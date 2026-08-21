/**
 * Bölgeler sekmesi (siyasi bölgeler alt-paneli + harita ağacı), Görevler
 * (yapılacaklar) listesi ve sol/sağ panel kapatma doğrulaması. Diğer test
 * runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8781, CDP_PORT = 9238;
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

    const testCode = `(async function () {
      try {
        const results = [];
        function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

        /* ---- 1) siyasi bölgeler alt-paneli ---- */
        var T = Layers.get('territories');
        T.objects.push({ id:'t1', pts:[[100,100],[300,100],[300,300],[100,300]], name:'Kızıl Krallık', color:'#8a5a3a' });
        UI.refreshTerritoryList();
        var tl = document.getElementById('territory-list');
        check('bölge listesi öğe içeriyor', tl.children.length === 1);
        check('bölge adı doğru gösteriliyor', tl.textContent.indexOf('Kızıl Krallık') >= 0);
        var hint = document.getElementById('territory-empty-hint');
        check('boş-ipucu gizlendi', hint.style.display === 'none');
        tl.children[0].click();
        check('tıklama araç değiştirdi', App.tool === 'territory');
        check('tıklama seçim yaptı', App.selection && App.selection.id === 't1');

        T.objects.length = 0;
        UI.refreshTerritoryList();
        check('bölge silinince liste boşaldı', tl.children.length === 0);
        check('boş-ipucu geri geldi', hint.style.display !== 'none');

        /* ---- 2) çok seviyeli harita ağacı ----
           enterMap tek başına yalnız aktif dokümanı değiştirir; ağaç
           App.buildMapTree ile "links" katmanındaki targetMapId işaretçilerini
           izlediği için gerçek regionlink pimi gibi bir nesne de eklememiz gerekiyor. */
        Layers.get('links').objects.push({ id:'lnk1', x:500, y:500, size:40, name:'Kuzey Bölgesi', targetMapId:'sub_a' });
        App.enterMap('sub_a', 'Kuzey Bölgesi');
        await new Promise(function (r) { setTimeout(r, 200); });
        Layers.get('links').objects.push({ id:'lnk2', x:500, y:500, size:40, name:'İç Kale', targetMapId:'sub_a_1' });
        App.enterMap('sub_a_1', 'İç Kale');
        await new Promise(function (r) { setTimeout(r, 200); });
        var tree = App.buildMapTree();
        check('kök düğüm var', tree && tree.id === 'root');
        check('kökün bir çocuğu var', tree && tree.children && tree.children.length === 1 && tree.children[0].id === 'sub_a');
        check('ikinci seviye çocuk var', tree && tree.children && tree.children[0] && tree.children[0].children && tree.children[0].children.length === 1 && tree.children[0].children[0].id === 'sub_a_1');

        UI.refreshMapTree();
        var ml = document.getElementById('maptree-list');
        check('ağaç UI 3 düğüm gösteriyor', ml.children.length === 3);
        check('aktif düğüm vurgulanıyor', ml.querySelector('.maptree-item.cur') !== null);

        /* kökten doğrudan en derin düğüme atla */
        App.jumpToMap('root');
        await new Promise(function (r) { setTimeout(r, 200); });
        check('jumpToMap kök\\'e döndü', App.currentMapId === 'root');
        App.jumpToMap('sub_a_1');
        await new Promise(function (r) { setTimeout(r, 200); });
        check('jumpToMap 2 seviye atladı', App.currentMapId === 'sub_a_1' && App.mapStack.length === 2);

        /* ---- 3) özyinelemeli silme ---- */
        App.jumpToMap('root');
        await new Promise(function (r) { setTimeout(r, 200); });
        check('kayıtlı haritalarda alt-alt harita var', !!App.maps['sub_a_1']);
        App.deleteMapRecursive('sub_a');
        check('sub_a silindi', !App.maps['sub_a']);
        check('sub_a_1 de silindi (özyinelemeli)', !App.maps['sub_a_1']);

        /* ---- 4) yapılacaklar listesi ---- */
        localStorage.removeItem(UI.TODO_KEY);
        UI.refreshTodoList();
        var tdl = document.getElementById('todo-list');
        var tdHint = document.getElementById('todo-empty-hint');
        check('görev listesi başlangıçta boş', tdl.children.length === 0);
        check('boş-ipucu görünür', tdHint.style.display !== 'none');

        document.getElementById('todo-input').value = 'Kale planını çiz';
        UI.addTodo();
        check('görev eklendi', tdl.children.length === 1);
        check('görev metni doğru', tdl.textContent.indexOf('Kale planını çiz') >= 0);
        var stored = JSON.parse(localStorage.getItem(UI.TODO_KEY));
        check('görev localStorage\\'a yazıldı', stored.length === 1 && stored[0].text === 'Kale planını çiz');

        var chk = tdl.querySelector('.todo-check');
        chk.checked = true;
        chk.dispatchEvent(new Event('change'));
        check('görev tamamlandı işaretlendi', tdl.querySelector('.todo-item.done') !== null);
        var storedDone = JSON.parse(localStorage.getItem(UI.TODO_KEY));
        check('tamamlanma durumu kalıcı', storedDone[0].done === true);

        var delBtn = tdl.querySelector('.todo-del');
        delBtn.click();
        check('görev silindi', tdl.children.length === 0);
        check('boş-ipucu geri geldi', tdHint.style.display !== 'none');

        /* ---- 5) sol/sağ panel kapatma ---- */
        var ws = document.getElementById('workspace');
        var btnL = document.getElementById('btn-toggle-left');
        var btnR = document.getElementById('btn-toggle-right');
        check('başlangıçta paneller açık', !ws.classList.contains('collapsed-left') && !ws.classList.contains('collapsed-right'));
        btnL.click();
        check('sol panel kapandı', ws.classList.contains('collapsed-left'));
        check('sol panel genişliği 0', getComputedStyle(ws).gridTemplateColumns.split(' ')[0] === '0px');
        check('kolçak aria-expanded false', btnL.getAttribute('aria-expanded') === 'false');
        btnL.click();
        check('sol panel yeniden açıldı', !ws.classList.contains('collapsed-left'));
        btnR.click();
        check('sağ panel kapandı', ws.classList.contains('collapsed-right'));
        var cols = getComputedStyle(ws).gridTemplateColumns.split(' ');
        check('sağ panel genişliği 0', cols[cols.length - 1] === '0px');
        btnR.click();
        check('sağ panel yeniden açıldı', !ws.classList.contains('collapsed-right'));

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
    console.log('\n========== BÖLGELER + GÖREVLER TESTİ ==========');
    list.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
    console.log(pass.result?.value ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
    process.exit(pass.result?.value ? 0 : 1);
  } catch (e) {
    console.error('Test çalıştırma hatası:', e);
    process.exit(1);
  }
}

run();
