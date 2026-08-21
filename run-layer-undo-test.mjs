/**
 * Katman ekle/sil geri alma testi — CDP ile headless Chromium
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8767, CDP_PORT = 9224;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_DIR = '/home/user/wayborne-map-editor';

function startServer() {
  const MIME = {'.html':'text/html','.js':'application/javascript','.css':'text/css'};
  const srv = createServer((req, res) => {
    let p = join(BASE_DIR, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    try { res.writeHead(200,{'Content-Type':MIME[extname(p)]||'text/plain'}); res.end(readFileSync(p)); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

async function connectCDP() {
  const resp = JSON.parse(execSync(`curl -s http://localhost:${CDP_PORT}/json/list`));
  const wsUrl = resp[0].webSocketDebuggerUrl;
  return new Promise((res, rej) => {
    const ws = new WebSocket(wsUrl);
    let id = 0; const pending = {};
    ws.addEventListener('message', ({ data: d }) => {
      const m = JSON.parse(d);
      if (!m.id && m.method === 'Runtime.consoleAPICalled') {
        const args = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        if (args) process.stdout.write('[browser] ' + args + '\n');
      }
      if (!m.id && m.method === 'Runtime.exceptionThrown') {
        console.error('[browser ERROR]', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description || '');
      }
      if (m.id && pending[m.id]) { pending[m.id](m.result ?? m.error); delete pending[m.id]; }
    });
    ws.addEventListener('open', () => res({
      send: (method, params={}) => new Promise((r2,e2) => {
        const cid = ++id;
        pending[cid] = v => v && v.code ? e2(new Error(JSON.stringify(v))) : r2(v);
        ws.send(JSON.stringify({id:cid, method, params}));
      })
    }));
    ws.addEventListener('error', e => rej(e));
  });
}

async function evaluate(cdp, expression, awaitPromise=false) {
  return cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
}

async function run() {
  const srv = await startServer();
  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
    '--window-size=1280,800', `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });
  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);
  let cdp;
  try {
    cdp = await connectCDP();
    await cdp.send('Runtime.enable');

    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Layers!=="undefined"&&typeof History!=="undefined"&&typeof UI!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      try {
        const results = [];
        function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

        const countBefore = Layers.list.length;
        check('başlangıç katman sayısı > 0', countBefore > 0);

        // 1) Katman ekle
        UI.addLayer();
        await new Promise(r => setTimeout(r, 50));
        const afterAdd = Layers.list.length;
        check('ekleme sonrası +1 katman', afterAdd === countBefore + 1);
        const addedId = Layers.active;
        check('yeni katman aktif', !!Layers.get(addedId) && Layers.get(addedId).custom);

        // 2) Undo (ekleme geri alınmalı)
        await History.undo();
        await new Promise(r => setTimeout(r, 100));
        check('undo sonrası katman sayısı eski hâline döndü', Layers.list.length === countBefore);
        check('silinen katman artık yok', !Layers.get(addedId));

        // 3) Redo (katman geri gelmeli)
        await History.redo();
        await new Promise(r => setTimeout(r, 200));
        check('redo sonrası katman geri geldi', Layers.list.length === afterAdd);
        check('redo sonrası katman verisi mevcut', !!Layers.get(addedId));

        // 4) Katmanı boyayıp sil, undo ile geri getir + içeriği kontrol et
        const l = Layers.get(addedId);
        l.ctx.fillStyle = '#ff0000';
        l.ctx.fillRect(10, 10, 50, 50);
        const pixelBefore = l.ctx.getImageData(20, 20, 1, 1).data.join(',');

        const snap = Layers.snapshotLayer(l);
        Layers.removeCustom(addedId);
        History.pushLayerRemove(snap, 'layer:remove');
        await new Promise(r => setTimeout(r, 50));
        check('silme sonrası katman yok', !Layers.get(addedId));

        await History.undo();
        await new Promise(r => setTimeout(r, 200));
        const restored = Layers.get(addedId);
        check('silme undo edildi, katman geri geldi', !!restored);
        if (restored) {
          const pixelAfter = restored.ctx.getImageData(20, 20, 1, 1).data.join(',');
          check('geri gelen katmanın piksel verisi korundu', pixelBefore === pixelAfter);
        }

        window.__testResults = results;
        window.__testPass = results.every(r => r.endsWith('PASS'));
        window.__testDone = true;
      } catch (e) {
        window.__testError = e.message + ' ' + e.stack;
        window.__testDone = true;
      }
    })();`;

    await evaluate(cdp, testCode, true);

    for (let i = 0; i < 20; i++) {
      const done = await evaluate(cdp, 'window.__testDone===true');
      if (done.result?.value) break;
      await sleep(300);
    }

    const err = await evaluate(cdp, 'window.__testError||""');
    if (err.result?.value) { console.error('HATA:', err.result.value); process.exit(1); }

    const res = await evaluate(cdp, 'JSON.stringify(window.__testResults||[])');
    const pass = await evaluate(cdp, 'window.__testPass===true');
    const list = JSON.parse(res.result?.value || '[]');
    console.log('\n========== KATMAN UNDO/REDO TESTİ ==========');
    list.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
    console.log(pass.result?.value ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
    process.exit(pass.result?.value ? 0 : 1);

  } finally {
    cdp?.close(); chrome.kill(); srv.close();
  }
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
