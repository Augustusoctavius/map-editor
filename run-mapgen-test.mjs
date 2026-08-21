/**
 * Harita üretimi görsel testi — 3 farklı şablon × rastgele seed
 * CDP üzerinden headless Chromium; ekran görüntülerini /tmp'ye kaydeder.
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT    = 8766;
const CDP_PORT = 9223;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_DIR = '/home/user/wayborne-map-editor';
const OUT_DIR  = '/tmp/mapgen-shots';

try { execSync('mkdir -p ' + OUT_DIR); } catch {}

function startServer() {
  const MIME = {'.html':'text/html','.js':'application/javascript','.css':'text/css',
    '.png':'image/png','.json':'application/json','.svg':'image/svg+xml'};
  const srv = createServer((req, res) => {
    let p = join(BASE_DIR, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    try { res.writeHead(200,{'Content-Type':MIME[extname(p)]||'text/plain'}); res.end(readFileSync(p)); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise(r => srv.listen(PORT, () => { console.log(`[srv] http://localhost:${PORT}`); r(srv); }));
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
      if (m.id && pending[m.id]) { pending[m.id](m.result ?? m.error); delete pending[m.id]; }
    });
    ws.addEventListener('open', () => res({
      send: (method, params={}) => new Promise((r2,e2) => {
        const cid = ++id;
        pending[cid] = v => v && v.code ? e2(new Error(JSON.stringify(v))) : r2(v);
        ws.send(JSON.stringify({id:cid, method, params}));
      }),
      close: () => ws.close()
    }));
    ws.addEventListener('error', e => rej(e));
  });
}

async function evaluate(cdp, expression, awaitPromise=false) {
  return cdp.send('Runtime.evaluate', {
    expression, awaitPromise, returnByValue: true,
    userGesture: true, includeCommandLineAPI: false
  });
}

async function screenshot(cdp, filename) {
  const r = await cdp.send('Page.captureScreenshot', { format:'png', clip:{x:0,y:0,width:1280,height:800,scale:1} });
  const buf = Buffer.from(r.data, 'base64');
  writeFileSync(filename, buf);
  console.log('[shot] ' + filename + ' (' + (buf.length/1024).toFixed(0) + ' KB)');
}

async function run() {
  const srv = await startServer();

  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--window-size=1280,800',
    `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });

  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);
  let cdp;
  try {
    cdp = await connectCDP();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');

    // Sayfa yüklenene kadar bekle
    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Cv!=="undefined"&&typeof Exporter!=="undefined"&&typeof Tools!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
      if (i === 39) throw new Error('Sayfa yüklenmedi');
    }
    console.log('[test] Sayfa hazır\n');

    // Editör görünümüne geç
    await evaluate(cdp, 'UI.showView("editor")');
    await sleep(600);

    const TESTS = [
      { tpl:'island',      rough:0.55, seed:0xDEADBEEF, label:'Ada (yüksek pürüzlülük)'     },
      { tpl:'continent',   rough:0.45, seed:0xCAFEBABE, label:'Kıta (orta pürüzlülük)'     },
      { tpl:'archipelago', rough:0.62, seed:0x1337F00D, label:'Takımada (dağınık adalar)'   },
    ];

    for (let i = 0; i < TESTS.length; i++) {
      const t = TESTS[i];
      console.log(`\n[test] ${i+1}/3 — ${t.label}`);

      // Yeni proje başlat (2048×2048)
      const setupCode = `(function(){
        Exporter.newProject(2048, 2048, ${JSON.stringify(t.label)});
      })()`;
      await evaluate(cdp, setupCode);
      await sleep(700);

      // Harita üret
      const genCode = `(function(){
        Tools.generateLandmass(${JSON.stringify(t.tpl)}, ${t.rough}, ${t.seed});
      })()`;
      await evaluate(cdp, genCode);
      await sleep(1200);  // shore efekti ve render

      // Fit (tüm haritayı görmek için)
      await evaluate(cdp, 'Cv.fit(); Cv.requestRender();');
      await sleep(400);

      const fname = `${OUT_DIR}/map-${i+1}-${t.tpl}.png`;
      await screenshot(cdp, fname);
    }

    console.log('\n[test] Tamamlandı. Görüntüler: ' + OUT_DIR);

  } finally {
    cdp?.close();
    chrome.kill();
    srv.close();
  }
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
