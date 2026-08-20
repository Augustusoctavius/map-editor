/**
 * FPS Benchmark Runner — CDP ile headless Chromium
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT   = 8765;
const CDP_PORT = 9222;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_DIR = '/home/user/wayborne-map-editor';
const BUDGET_MS = 16.67;

/* --- HTTP sunucu --- */
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

/* --- CDP --- */
async function connectCDP() {
  const resp = JSON.parse(execSync(`curl -s http://localhost:${CDP_PORT}/json/list`));
  const wsUrl = resp[0].webSocketDebuggerUrl;
  return new Promise((res, rej) => {
    const ws = new WebSocket(wsUrl);
    let id = 0; const pending = {};
    ws.addEventListener('message', ({ data: d }) => {
      const m = JSON.parse(d);
      /* CDP olaylarını da yakala */
      if (!m.id && m.method === 'Runtime.consoleAPICalled') {
        const args = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        if (args) process.stdout.write('[browser] ' + args + '\n');
      }
      if (!m.id && m.method === 'Runtime.exceptionThrown') {
        const ex = m.params.exceptionDetails;
        console.error('[browser ERROR]', ex.text, ex.exception?.description || '');
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

/* --- eval yardımcısı --- */
async function evaluate(cdp, expression, awaitPromise=false) {
  return cdp.send('Runtime.evaluate', {
    expression, awaitPromise, returnByValue: true,
    userGesture: true, includeCommandLineAPI: false
  });
}

async function run() {
  const srv = await startServer();

  /* Chromium başlat */
  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--window-size=1280,800',
    `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });

  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);

  let cdp;
  try {
    cdp = await connectCDP();
    await cdp.send('Runtime.enable');
    await cdp.send('Runtime.setAsyncCallStackDepth', { maxDepth: 8 });

    /* Yüklenene kadar bekle */
    console.log('[bench] Sayfa yükleniyor...');
    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Cv!=="undefined"&&typeof Names!=="undefined"&&typeof Sym!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
      if (i === 39) throw new Error('Sayfa yüklenmedi');
    }
    console.log('[bench] Sayfa hazır.\n');

    /* Basit render sayımı: kaç ms sürüyor? */
    const benchCode = `(async function bench() {
  try {
    const SIZES  = [1024, 2048, 4096];
    const FRAMES = 30;
    const results = {};

    function seeded(s) { return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

    function populateMap(size) {
      const rnd = seeded(42);
      const LL = Layers.get('landmass');
      const ctx = LL.canvas.getContext('2d');
      ctx.clearRect(0,0,size,size); ctx.fillStyle='#fff';
      for(let i=0;i<20;i++){
        ctx.beginPath(); ctx.arc(rnd()*size,rnd()*size,50+rnd()*80,0,Math.PI*2); ctx.fill();
      }
      LL.dirty=true;
      const SL=Layers.get('symbols'); SL.objects=[];
      const cats=Object.keys(Sym.SYMBOLS);
      for(let i=0;i<40;i++){
        const items=Sym.SYMBOLS[cats[i%cats.length]].items;
        if(items&&items.length) SL.objects.push({id:items[0].id,x:rnd()*size,y:rnd()*size,size:40,rotation:0,wear:0});
      }
      const LAB=Layers.get('labels'); LAB.objects=[];
      const cults=Object.keys(Names.CULTURES);
      for(let i=0;i<30;i++){
        LAB.objects.push({id:'l'+i,x:rnd()*size,y:rnd()*size,
          text:Names.generate(cults[i%cults.length],'settlement','en',i),size:14,font:'serif',color:'#000'});
      }
      Cv.grid=true; Cv.gridType='hex'; Cv.gridSize=64;
      Cv.resize(); Cv.fit();
    }

    function measureFrames(frames, perFrame) {
      return new Promise(res=>{
        const times=[]; let f=0, t0=performance.now();
        function tick(){
          const now=performance.now(); if(f>0) times.push(now-t0); t0=now;
          perFrame(f);
          if(typeof Cv.render==='function') Cv.render();
          f++; if(f<frames) setTimeout(tick,0); else res(times.sort((a,b)=>a-b));
        }
        setTimeout(tick,0);
      });
    }

    for(const size of SIZES){
      console.log('[FPS] ' + size + 'x' + size);
      Exporter.newProject(size,size,size+'x'+size);
      await new Promise(r=>setTimeout(r,500));  /* UI.refreshAll() bitmesi için bekle */
      populateMap(size);
      await new Promise(r=>setTimeout(r,300));

      const sizeRes={};

      // idle
      const idle=await measureFrames(FRAMES,()=>{});
      sizeRes.idle={median:idle[Math.floor(idle.length/2)],p95:idle[Math.floor(idle.length*.95)],max:idle[idle.length-1]};
      console.log('  idle median='+sizeRes.idle.median.toFixed(2)+'ms');

      // pan
      let pt=0; const startPanX=Cv.panX||0, startPanY=Cv.panY||0;
      const pan=await measureFrames(FRAMES,()=>{pt+=0.5;Cv.panX=startPanX+Math.cos(pt)*50;Cv.panY=startPanY+Math.sin(pt)*50;});
      sizeRes.pan={median:pan[Math.floor(pan.length/2)],p95:pan[Math.floor(pan.length*.95)],max:pan[pan.length-1]};
      console.log('  pan  median='+sizeRes.pan.median.toFixed(2)+'ms');

      // zoom
      let zt=0; const startZoom=Cv.zoom||1;
      const zoom=await measureFrames(FRAMES,()=>{zt+=0.05;Cv.zoom=Math.max(0.2,Math.min(4,startZoom+Math.sin(zt)*.5));});
      sizeRes.zoom={median:zoom[Math.floor(zoom.length/2)],p95:zoom[Math.floor(zoom.length*.95)],max:zoom[zoom.length-1]};
      console.log('  zoom median='+sizeRes.zoom.median.toFixed(2)+'ms');

      results[size]=sizeRes;
    }

    window.__fpsResults=results;
    window.__fpsPass=Object.values(results).every(s=>Object.values(s).every(v=>v.median<=16.67));
    window.__fpsDone=true;
    console.log('[FPS] DONE pass='+window.__fpsPass);
  } catch(e) {
    console.error('[FPS ERROR] '+e.message+' '+e.stack);
    window.__fpsError=e.message;
    window.__fpsDone=true;
  }
})();`;

    await evaluate(cdp, benchCode);

    /* Tamamlanana kadar bekle */
    console.log('[bench] Çalışıyor...');
    for (let i = 0; i < 120; i++) {
      await sleep(1000);
      const done = await evaluate(cdp, 'window.__fpsDone===true');
      if (done.result?.value) break;
      if (i % 5 === 4) console.log(`  ${i+1}s bekleniyor...`);
    }

    /* Sonuçları al */
    const errR = await evaluate(cdp, 'window.__fpsError||""');
    if (errR.result?.value) {
      console.error('\n[bench] HATA:', errR.result.value);
      process.exit(1);
    }

    const resR  = await evaluate(cdp, 'JSON.stringify(window.__fpsResults||{})');
    const passR = await evaluate(cdp, 'window.__fpsPass===true');
    const allPass = passR.result?.value === true;

    const data = JSON.parse(resR.result?.value || '{}');
    console.log('\n========== FPS SONUÇLARI ==========');
    for (const [size, scenarios] of Object.entries(data)) {
      console.log(`\nCanvas ${size}×${size}:`);
      for (const [sc, s] of Object.entries(scenarios)) {
        const ok = s.median <= BUDGET_MS;
        console.log(`  ${ok?'✓':'✗'} ${sc.padEnd(6)}: median=${s.median.toFixed(2)}ms  p95=${s.p95.toFixed(2)}ms  max=${s.max.toFixed(2)}ms`);
      }
    }
    console.log(`\n${allPass ? '✅ TÜM TESTLER GEÇTİ' : '❌ BAZI TESTLER BAŞARISIZ'}`);
    console.log('=====================================');

    process.exit(allPass ? 0 : 1);

  } finally {
    cdp?.close();
    chrome.kill();
    srv.close();
  }
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
