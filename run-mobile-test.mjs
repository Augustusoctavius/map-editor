/**
 * Mobil çekirdek uyum doğrulaması: sabit ekran-boyutu kapısının kaldırıldığı
 * (editör artık dar viewport'ta da açılıyor), sol/sağ panellerin dar
 * ekranda varsayılan kapalı çekmece olarak başladığı ve iki parmaklı
 * yakınlaştırma jestinin çalıştığı doğrulanır. Diğer test runner'larla aynı
 * CDP iskeletini kullanır (bkz. CLAUDE.md § Tests), Emulation.setDeviceMetricsOverride
 * ile viewport'u telefon genişliğine daraltır.
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8783, CDP_PORT = 9240;
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
      const r = await evaluate(cdp, 'typeof Layers!=="undefined"&&typeof Tools!=="undefined"&&typeof UI!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    /* viewport'u telefon genişliğine daralt (390x800, DPR 2, mobile=true
       dokunmatik olayları da devreye sokar) */
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 800, deviceScaleFactor: 2, mobile: true
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await sleep(300);

    const testCode = `(async function () {
      try {
        const results = [];
        function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

        /* ---- 1) sabit kapı kaldırıldı: dar viewport'ta editör açılabiliyor ---- */
        check('editorFits/EDITOR_MIN referansları temizlendi', typeof UI.editorFits === 'undefined' && typeof UI.EDITOR_MIN_W === 'undefined');
        check('view-narrow DOM\\'dan kaldırıldı', document.getElementById('view-narrow') === null);
        UI.showView('editor');
        await new Promise(function (r) { setTimeout(r, 250); });
        check('dar viewport\\'ta editör görünümü açık kaldı', UI._currentView === 'editor' && !document.getElementById('view-editor').classList.contains('hidden'));
        check('tuval sıfır değil (Cv.resize çalıştı)', Cv.vw > 0 && Cv.vh > 0);

        /* ---- 2) mobilde paneller varsayılan kapalı başlıyor ---- */
        var ws = document.getElementById('workspace');
        check('sol panel mobilde varsayılan kapalı', ws.classList.contains('collapsed-left'));
        check('sağ panel mobilde varsayılan kapalı', ws.classList.contains('collapsed-right'));
        check('#workspace tek sütuna indi', getComputedStyle(ws).gridTemplateColumns.trim().indexOf(' ') === -1);

        /* kolçakla tekrar açılabiliyor mu */
        document.getElementById('btn-toggle-left').click();
        check('kolçakla sol panel açılabiliyor', !ws.classList.contains('collapsed-left'));
        document.getElementById('btn-toggle-left').click();

        /* ---- 3) iki parmaklı yakınlaştırma jesti ---- */
        var view = document.getElementById('view');
        var r = view.getBoundingClientRect();
        var cx = r.left + r.width/2, cy = r.top + r.height/2;
        var z0 = Cv.zoom;

        function touchDown(id, x, y) {
          view.dispatchEvent(new PointerEvent('pointerdown', { pointerId:id, pointerType:'touch', clientX:x, clientY:y, bubbles:true, button:0 }));
        }
        function touchMove(id, x, y) {
          view.dispatchEvent(new PointerEvent('pointermove', { pointerId:id, pointerType:'touch', clientX:x, clientY:y, bubbles:true }));
        }
        function touchUp(id, x, y) {
          window.dispatchEvent(new PointerEvent('pointerup', { pointerId:id, pointerType:'touch', clientX:x, clientY:y, bubbles:true }));
        }

        /* iki parmak birbirinden 40px uzakta başlar, 200px uzağa açılır -> yakınlaştırma büyümeli */
        touchDown(101, cx-20, cy);
        touchDown(102, cx+20, cy);
        check('pinch başladığında Tools._pinch kuruldu', !!Tools._pinch);
        touchMove(101, cx-100, cy);
        touchMove(102, cx+100, cy);
        var zAfterSpread = Cv.zoom;
        check('parmaklar açılınca yakınlaştırma arttı', zAfterSpread > z0);

        touchUp(101, cx-100, cy);
        touchUp(102, cx+100, cy);
        check('parmaklar kalkınca pinch durumu temizlendi', !Tools._pinch);

        /* ---- 4) tek parmakla normal çizim jesti pinch\\'ten etkilenmedi ---- */
        Layers.get('landmass').ctx.clearRect(0,0,Cv.W,Cv.H);
        History.clear();
        App.tool = 'landmass';
        touchDown(201, cx, cy);
        touchMove(201, cx+5, cy+5);
        touchUp(201, cx+5, cy+5);
        check('tek parmak çizimi pinch sonrası hâlâ çalışıyor', History.canUndo());

        window.__testResults = results;
        window.__testPass = results.every(function (r) { return r.endsWith('PASS'); });
        window.__testDone = true;
      } catch (e) {
        window.__testError = e.message + ' ' + e.stack;
        window.__testDone = true;
      }
    })();`;

    await evaluate(cdp, testCode, true);

    for (let i = 0; i < 30; i++) {
      const done = await evaluate(cdp, 'window.__testDone===true');
      if (done.result?.value) break;
      await sleep(300);
    }

    const err = await evaluate(cdp, 'window.__testError||""');
    if (err.result?.value) { console.error('HATA:', err.result.value); process.exit(1); }

    const res = await evaluate(cdp, 'JSON.stringify(window.__testResults||[])');
    const pass = await evaluate(cdp, 'window.__testPass===true');
    const list = JSON.parse(res.result?.value || '[]');
    console.log('\n========== MOBİL ÇEKİRDEK UYUM TESTİ ==========');
    list.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
    console.log(pass.result?.value ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
    process.exit(pass.result?.value ? 0 : 1);
  } catch (e) {
    console.error('Test çalıştırma hatası:', e);
    process.exit(1);
  }
}

run();
