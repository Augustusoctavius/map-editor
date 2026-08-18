/* ============================================================
   Cartographer — canvas.js  v3
   Görünüm (zoom/pan), render, minimap, kıyı efekti (shore glow),
   nehir/yol/etiket çizimi, etiket preset & parşömen kapıtları,
   interaktif ölçek çubuğu.
   ============================================================ */
(function (global) {
  'use strict';

  /* ================= geometri ================= */
  var Geo = {
    sample: function (pts, perSeg) {
      if (!pts || pts.length < 2) return (pts || []).slice();
      if (pts.length === 2) {
        var out = [], n = perSeg || 16;
        for (var k = 0; k <= n; k++) {
          var t = k / n;
          out.push([pts[0][0] + (pts[1][0]-pts[0][0])*t, pts[0][1] + (pts[1][1]-pts[0][1])*t]);
        }
        return out;
      }
      var res = [], n2 = perSeg || 16;
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i-1]||pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2]||pts[i+1];
        for (var j = 0; j < n2; j++) {
          var s = j/n2, s2 = s*s, s3 = s2*s;
          res.push([
            0.5*((2*p1[0]) + (-p0[0]+p2[0])*s + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*s2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*s3),
            0.5*((2*p1[1]) + (-p0[1]+p2[1])*s + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*s2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*s3)
          ]);
        }
      }
      res.push(pts[pts.length-1].slice());
      return res;
    },

    meander: function (pts, amount, wavelength) {
      if (!amount) return pts;
      var out = [], acc = 0;
      for (var i = 0; i < pts.length; i++) {
        var prev = pts[i-1]||pts[i], next = pts[i+1]||pts[i];
        var dx = next[0]-prev[0], dy = next[1]-prev[1];
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy/len, ny = dx/len;
        if (i > 0) acc += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
        var w = wavelength || 140;
        var o = Math.sin(acc/w*Math.PI*2)*amount + Math.sin(acc/(w*0.37)*Math.PI*2)*amount*0.35;
        out.push([pts[i][0]+nx*o, pts[i][1]+ny*o]);
      }
      return out;
    },

    ribbon: function (pts, wStart, wEnd) {
      var left = [], right = [], n = pts.length;
      for (var i = 0; i < n; i++) {
        var prev = pts[i-1]||pts[i], next = pts[i+1]||pts[i];
        var dx = next[0]-prev[0], dy = next[1]-prev[1];
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy/len, ny = dx/len;
        var t = n > 1 ? i/(n-1) : 1;
        var hw = (wStart + (wEnd-wStart)*t)/2;
        left.push([pts[i][0]+nx*hw, pts[i][1]+ny*hw]);
        right.push([pts[i][0]-nx*hw, pts[i][1]-ny*hw]);
      }
      return left.concat(right.reverse());
    },

    distToPolyline: function (px, py, pts) {
      var best = Infinity;
      for (var i = 1; i < pts.length; i++) {
        var x1=pts[i-1][0], y1=pts[i-1][1], x2=pts[i][0], y2=pts[i][1];
        var dx=x2-x1, dy=y2-y1, L2=dx*dx+dy*dy;
        var t = L2 ? Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy)/L2)) : 0;
        var d = Math.hypot(px-(x1+dx*t), py-(y1+dy*t));
        if (d < best) best = d;
      }
      return best;
    },

    /* Catmull-Rom <-> Bezier dönüşümü: elle tutamaç ayarlanmamış bir nokta
       için, mevcut Geo.sample ile TAM AYNI eğriyi üreten simetrik tutamaç.
       Böylece bir yolun bazı noktalarında özel tutamaç, bazılarında otomatik
       tutamaç karışık kullanılabilir — görsel süreklilik bozulmaz. */
    autoHandle: function (pts, i, closed) {
      var n = pts.length;
      var prev = closed ? pts[(i-1+n)%n] : (pts[i-1] || pts[i]);
      var next = closed ? pts[(i+1)%n] : (pts[i+1] || pts[i]);
      var tx = (next[0]-prev[0])/6, ty = (next[1]-prev[1])/6;
      return { ix:-tx, iy:-ty, ox:tx, oy:ty };
    },

    /* handles[i] = {ix,iy,ox,oy} (nokta i'nin giriş/çıkış tutamaç ofsetleri,
       nokta konumuna göre göreli) ya da null/undefined → otomatik tutamaç.
       closed=true ise son noktadan ilk noktaya kapanan bir eğri örneklenir
       (göl/bölge poligonları için). */
    sampleBezier: function (pts, handles, perSeg, closed) {
      var n = pts.length;
      if (n < 2) return (pts || []).slice();
      var self = this, res = [];
      var ps = Math.max(2, perSeg || 16);
      var segCount = closed ? n : n - 1;
      for (var i = 0; i < segCount; i++) {
        var i2 = closed ? (i+1) % n : i+1;
        var P0 = pts[i], P3 = pts[i2];
        var hOut = (handles && handles[i])  || self.autoHandle(pts, i, closed);
        var hIn  = (handles && handles[i2]) || self.autoHandle(pts, i2, closed);
        var C1 = [P0[0]+(hOut.ox||0), P0[1]+(hOut.oy||0)];
        var C2 = [P3[0]+(hIn.ix||0),  P3[1]+(hIn.iy||0)];
        for (var j = 0; j < ps; j++) {
          var t = j/ps, mt = 1-t;
          var a = mt*mt*mt, b = 3*mt*mt*t, c = 3*mt*t*t, d = t*t*t;
          res.push([
            a*P0[0]+b*C1[0]+c*C2[0]+d*P3[0],
            a*P0[1]+b*C1[1]+c*C2[1]+d*P3[1]
          ]);
        }
      }
      if (!closed) res.push(pts[n-1].slice());
      return res;
    },

    polyPath: function (pts) {
      var p = new Path2D();
      if (!pts.length) return p;
      p.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
      return p;
    },

    svgPolyD: function (pts, close) {
      if (!pts.length) return '';
      var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (var i = 1; i < pts.length; i++) d += ' L' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
      return d + (close ? ' Z' : '');
    },

    /* ---------- çizgi (nehir/yol) üzerinde konumlandırma — kavisli etiketler için ----------
       pathPts: [[x,y],...] örneklenmiş polyline (Cv.riverGeometry/roadGeometry çıktısı) */
    polylineLength: function (pts) {
      var len = 0;
      for (var i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
      return len;
    },

    /* verilen kümülatif uzunlukta {x,y,ang} döner (ang: teğet açısı, radyan) */
    pointAtLength: function (pts, len) {
      if (!pts || pts.length < 2) return { x:0, y:0, ang:0 };
      if (len <= 0) return { x:pts[0][0], y:pts[0][1], ang:Math.atan2(pts[1][1]-pts[0][1], pts[1][0]-pts[0][0]) };
      var acc = 0;
      for (var i = 1; i < pts.length; i++) {
        var dx = pts[i][0]-pts[i-1][0], dy = pts[i][1]-pts[i-1][1];
        var segLen = Math.hypot(dx, dy);
        if (acc + segLen >= len || i === pts.length-1) {
          var t = segLen > 0 ? Math.min(1, Math.max(0, (len-acc)/segLen)) : 0;
          return { x: pts[i-1][0]+dx*t, y: pts[i-1][1]+dy*t, ang: Math.atan2(dy, dx) };
        }
        acc += segLen;
      }
      var last = pts.length-1;
      return { x:pts[last][0], y:pts[last][1], ang:Math.atan2(pts[last][1]-pts[last-1][1], pts[last][0]-pts[last-1][0]) };
    },

    /* polyline üzerindeki en yakın noktanın kümülatif uzunluğunu ve mesafesini döner */
    nearestOnPolyline: function (pts, px, py) {
      var best = { len:0, dist:Infinity };
      var acc = 0;
      for (var i = 1; i < pts.length; i++) {
        var x0=pts[i-1][0], y0=pts[i-1][1], x1=pts[i][0], y1=pts[i][1];
        var dx=x1-x0, dy=y1-y0;
        var segLen = Math.hypot(dx, dy);
        var t = segLen > 0 ? ((px-x0)*dx + (py-y0)*dy) / (segLen*segLen) : 0;
        t = Math.min(1, Math.max(0, t));
        var qx = x0+dx*t, qy = y0+dy*t;
        var d = Math.hypot(px-qx, py-qy);
        if (d < best.dist) best = { len: acc + segLen*t, dist: d };
        acc += segLen;
      }
      return best;
    }
  };

  /* ================= yazı tipleri ================= */
  var FONTS = {
    fantasy:'"Papyrus","Luminari","Trattatello","Copperplate",fantasy',
    serif:'Georgia,"Iowan Old Style","Times New Roman",serif',
    sans:'"Segoe UI",Helvetica,Arial,sans-serif',
    mono:'"SFMono-Regular",Consolas,monospace',
    black:'"Cinzel","Trajan Pro",Georgia,serif'
  };

  /* ================= ETİKET PRESETLERİ =================
     banner: null | 'ribbon' | 'plate' | 'scroll' | 'stone'   */
  var LABEL_PRESETS = {
    continent: { tr:'Kıta',        en:'Continent',  font:'black',   size:78, color:'#4a3520', outline:true,  outlineColor:'#f3e7c8', shadow:true,  track:14, caps:true,  banner:null },
    region:    { tr:'Bölge',       en:'Region',     font:'serif',   size:46, color:'#5a4326', outline:true,  outlineColor:'#f5ecd8', shadow:true,  track:8,  caps:true,  banner:null },
    kingdom:   { tr:'Krallık',     en:'Kingdom',    font:'black',   size:52, color:'#6a2c20', outline:true,  outlineColor:'#f7eed6', shadow:true,  track:6,  caps:true,  banner:'ribbon' },
    city:      { tr:'Şehir',       en:'City',       font:'serif',   size:30, color:'#33260f', outline:true,  outlineColor:'#f8f0dc', shadow:false, track:1,  caps:false, banner:null },
    town:      { tr:'Kasaba',      en:'Town',       font:'serif',   size:23, color:'#3d2f18', outline:true,  outlineColor:'#f8f0dc', shadow:false, track:0,  caps:false, banner:null },
    scrollLbl: { tr:'Tomar',       en:'Scroll',     font:'serif',   size:34, color:'#4a3520', outline:false, outlineColor:'#fff',    shadow:true,  track:3,  caps:false, banner:'scroll' },
    plateLbl:  { tr:'Levha',       en:'Plate',      font:'serif',   size:30, color:'#3a2b18', outline:false, outlineColor:'#fff',    shadow:true,  track:2,  caps:false, banner:'plate' },
    stoneLbl:  { tr:'Taş kitabe',  en:'Stone slab', font:'black',   size:32, color:'#2f2a22', outline:false, outlineColor:'#fff',    shadow:true,  track:5,  caps:true,  banner:'stone' },
    water:     { tr:'Deniz',       en:'Sea',        font:'serif',   size:40, color:'#2d5570', outline:true,  outlineColor:'#dcecf4', shadow:false, track:12, caps:true,  banner:null },
    ruinLbl:   { tr:'Harabe',      en:'Ruin',       font:'serif',   size:24, color:'#5c4030', outline:true,  outlineColor:'#f2e6cf', shadow:false, track:2,  caps:false, banner:null }
  };

  /* ================= dokular ================= */
  var oceanTile = null, parchTile = null;
  var patCache = new WeakMap();

  function ctxPattern(ctx, tile, key) {
    var bag = patCache.get(ctx);
    if (!bag) { bag = {}; patCache.set(ctx, bag); }
    if (!bag[key]) bag[key] = ctx.createPattern(tile, 'repeat');
    return bag[key];
  }

  function makeOceanTile() {
    var S = 160, c = document.createElement('canvas');
    c.width = c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = '#7ba8bd';
    x.fillRect(0, 0, S, S);
    /* ince gren */
    var img = x.getImageData(0, 0, S, S), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.random() - 0.5) * 12;
      d[i] += n; d[i+1] += n; d[i+2] += n * 0.7;
    }
    x.putImageData(img, 0, 0);
    /* dalga çizgileri */
    x.strokeStyle = 'rgba(70,120,145,0.30)';
    x.lineWidth = 1.1;
    for (var r = 0; r < 5; r++) {
      var y = 14 + r * 32 + (r % 2) * 6;
      x.beginPath();
      x.moveTo(-6, y);
      for (var k = 0; k <= S + 12; k += 18) x.quadraticCurveTo(k + 5, y - 5.5, k + 10, y);
      x.stroke();
    }
    return c;
  }

  function makeParchTile() {
    var S = 256, c = document.createElement('canvas');
    c.width = c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = '#d9c79a';
    x.fillRect(0, 0, S, S);
    var img = x.getImageData(0, 0, S, S), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.random() - 0.5) * 34;
      d[i] += n; d[i+1] += n * 0.9; d[i+2] += n * 0.7;
    }
    x.putImageData(img, 0, 0);
    x.globalAlpha = 0.16;
    x.strokeStyle = '#7a6338';
    for (var k = 0; k < 26; k++) {
      x.lineWidth = Math.random() * 2 + 0.4;
      x.beginPath();
      var sx = Math.random() * S, sy = Math.random() * S;
      x.moveTo(sx, sy);
      x.bezierCurveTo(sx+40, sy+20, sx+10, sy+60, sx+60, sy+80);
      x.stroke();
    }
    x.globalAlpha = 1;
    return c;
  }

  /* ================= Cv ================= */
  var Cv = {
    W:2048, H:2048,
    zoom:1, panX:0, panY:0, dpr:1,
    view:null, ctx:null, mini:null, mctx:null,
    grid:false, gridSize:128, parchment:false,
    shore:true, shoreWidth:26, shoreStyle:'sandy',
    mouse:{x:0,y:0,over:false},
    _raf:0, _miniAt:0,
    shoreCanvas:null, shoreDirty:true,
    elevationCanvas:null, elevationDirty:true,

    init: function (w, h) {
      this.view = document.getElementById('view');
      this.ctx = this.view.getContext('2d');
      this.mini = document.getElementById('minimap');
      this.mctx = this.mini.getContext('2d');
      this.W = w; this.H = h;
      oceanTile = makeOceanTile();
      parchTile = makeParchTile();
      this.resize();
      var self = this;
      window.addEventListener('resize', function () { self.resize(); });
    },

    resize: function () {
      var r = this.view.parentElement.getBoundingClientRect();
      this.dpr = window.devicePixelRatio || 1;
      this.view.width = Math.max(1, Math.round(r.width * this.dpr));
      this.view.height = Math.max(1, Math.round(r.height * this.dpr));
      this.vw = r.width; this.vh = r.height;
      this.requestRender();
    },

    setSize: function (w, h, keep) {
      this.W = w; this.H = h;
      Layers.resize(w, h, keep);
      this.shoreDirty = true;
      this.shoreCanvas = null;
      this.elevationDirty = true;
      this.elevationCanvas = null;
      this.fit();
    },

    fit: function () {
      var s = Math.min(this.vw/this.W, this.vh/this.H) * 0.92;
      this.zoom = s;
      this.panX = (this.vw - this.W*s)/2;
      this.panY = (this.vh - this.H*s)/2;
      this.requestRender();
    },

    setZoom: function (z, cx, cy) {
      z = Math.max(0.1, Math.min(4, z));
      if (cx === undefined) { cx = this.vw/2; cy = this.vh/2; }
      var mx = (cx - this.panX)/this.zoom, my = (cy - this.panY)/this.zoom;
      this.zoom = z;
      this.panX = cx - mx*z;
      this.panY = cy - my*z;
      this.requestRender();
      if (global.UI) UI.status();
    },

    panBy: function (dx, dy) {
      this.panX += dx; this.panY += dy;
      this.requestRender();
    },

    screenToMap: function (sx, sy) { return { x:(sx-this.panX)/this.zoom, y:(sy-this.panY)/this.zoom }; },
    snapPoint: function (p) {
      if (!global.App || !App.snap || !App.snap.enabled) return p;
      var g = App.snap.size || 64;
      return { x: Math.round(p.x/g)*g, y: Math.round(p.y/g)*g };
    },
    mapToScreen: function (mx, my) { return { x:mx*this.zoom+this.panX, y:my*this.zoom+this.panY }; },

    requestRender: function () {
      var self = this;
      if (this._raf) return;
      this._raf = requestAnimationFrame(function () { self._raf = 0; self.render(); });
    },

    /* ---------- KIYI EFEKTİ ----------
       Kara silüetini bulanıklaştırıp açık kum/sığ su tonunda
       birkaç halka olarak karanın altına çizer.                */
    buildShore: function () {
      var L = Layers.get('landmass');
      var T = Layers.get('terrain');
      if (!L || !L.canvas) return null;
      var result = Terrain.buildShoreCanvas(
        L.canvas, T ? T.canvas : L.canvas,
        this.shoreWidth, this.W, this.H, this.shoreStyle
      );
      this.shoreCanvas = result.canvas;
      this._shoreScW   = result.sw;
      this._shoreScH   = result.sh;
      this.shoreDirty  = false;
      /* kıyı çizgisi değişti — nehir kesim noktaları geçersiz olabilir */
      this._riverCrossingCache = {};

      /* kara/deniz nokta testi için düşük çözünürlüklü alfa önbelleği —
         sembol "karaya kenetle" (clip) kontrolü ve fırça yerleştirmesi bunu kullanır */
      var LS = 512;
      var scx = document.createElement('canvas'); scx.width = LS; scx.height = LS;
      var sctx = scx.getContext('2d', { willReadFrequently:true });
      sctx.drawImage(L.canvas, 0, 0, LS, LS);
      this.landSample = { data: sctx.getImageData(0,0,LS,LS).data, size: LS, scale: LS / this.W };

      return result.canvas;
    },

    /* (x,y) tuval koordinatındaki nokta kara mı? Önbellek yoksa iyimser true döner. */
    isOnLand: function (x, y) {
      var ls = this.landSample;
      if (!ls) return true;
      var sx = Math.round(x * ls.scale), sy = Math.round(y * ls.scale);
      if (sx < 0 || sy < 0 || sx >= ls.size || sy >= ls.size) return false;
      return ls.data[(sy*ls.size + sx)*4 + 3] > 30;
    },

    /* ---------- YÜKSELTİ EFEKTİ (hillshade + kontur) ----------
       Yükselti katmanı ham gri tonlama olarak saklanır (fırça:
       tools.js#stamp). Burada bu veriden eğim tabanlı basit bir
       gölgeleme (hillshade) ve/veya kontur çizgisi türetilip tek bir
       önbelleğe alınmış katman olarak terrain'in üstüne, diğer
       nesnelerin altına bindirilir — kıyı efektiyle aynı mimari. */
    buildElevationEffect: function () {
      var Lv = Layers.get('elevation');
      if (!Lv || !Lv.canvas) return null;
      var MAX = 1024;
      var W = this.W, H = this.H;
      var sc = Math.min(1, MAX/Math.max(W,H));
      var sw = Math.max(1, Math.round(W*sc)), sh = Math.max(1, Math.round(H*sc));

      var tC = document.createElement('canvas'); tC.width = sw; tC.height = sh;
      var tctx = tC.getContext('2d', { willReadFrequently:true });
      tctx.drawImage(Lv.canvas, 0, 0, sw, sh);
      var data = tctx.getImageData(0, 0, sw, sh).data;

      function heightAt(x, y) {
        x = x < 0 ? 0 : x >= sw ? sw-1 : x;
        y = y < 0 ? 0 : y >= sh ? sh-1 : y;
        var i = (y*sw + x) * 4;
        var a = data[i+3] / 255;
        return a > 0.02 ? (data[i]*a + 128*(1-a)) : 128;
      }

      var showHS = App.elevation.showHillshade;
      var showCT = App.elevation.showContours;
      var interval = Math.max(4, App.elevation.contourInterval || 32);
      var lx = 0.6, ly = -0.5;

      var out = tctx.createImageData(sw, sh);
      var od = out.data;
      for (var y = 0; y < sh; y++) {
        for (var x = 0; x < sw; x++) {
          var i2 = (y*sw + x) * 4;
          var r = 0, g = 0, b = 0, al = 0;
          if (showHS) {
            var hx = heightAt(x+1, y) - heightAt(x-1, y);
            var hy = heightAt(x, y+1) - heightAt(x, y-1);
            var slope = hx*lx + hy*ly;
            if (slope > 0.5) { al = Math.min(1, slope/40) * 0.5; r = g = b = 255; }
            else if (slope < -0.5) { al = Math.min(1, -slope/40) * 0.5; r = g = b = 0; }
          }
          if (showCT) {
            var hC = heightAt(x, y), hR = heightAt(x+1, y), hD = heightAt(x, y+1);
            var bC = Math.floor(hC/interval), bR = Math.floor(hR/interval), bD = Math.floor(hD/interval);
            if (bC !== bR || bC !== bD) {
              r = 74; g = 58; b = 34;
              al = Math.max(al, 0.55);
            }
          }
          od[i2] = r; od[i2+1] = g; od[i2+2] = b; od[i2+3] = Math.round(al*255);
        }
      }
      tctx.putImageData(out, 0, 0);
      this.elevationCanvas = tC;
      this.elevationDirty = false;
      return tC;
    },

    /* ---------- ana render ---------- */
    render: function () {
      var ctx = this.ctx;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0, 0, this.view.width, this.view.height);
      ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 30/this.zoom;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.restore();

      this.renderMap(ctx, { includeReference:true });

      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1/this.zoom;
      ctx.strokeRect(0, 0, this.W, this.H);

      if (this.grid) this.drawGrid(ctx);
      if (global.Tools) Tools.drawOverlay(ctx);

      ctx.restore();

      this.drawCursor(ctx);

      var now = performance.now();
      if (now - this._miniAt > 200) { this._miniAt = now; this.renderMini(); }
      if (global.UI) UI.status();
    },

    /* ---------- tam harita ---------- */
    renderMap: function (ctx, opt) {
      opt = opt || {};
      var W = this.W, H = this.H;

      /* --- okyanus --- */
      ctx.save();
      var op = ctxPattern(ctx, oceanTile, 'ocean');
      ctx.fillStyle = op || '#7ba8bd';
      ctx.fillRect(0, 0, W, H);
      /* derinlik gradyanı */
      var og = ctx.createRadialGradient(W*0.5, H*0.5, Math.min(W,H)*0.15, W*0.5, H*0.5, Math.max(W,H)*0.78);
      og.addColorStop(0, 'rgba(40,80,105,0.00)');
      og.addColorStop(1, 'rgba(28,62,86,0.42)');
      ctx.fillStyle = og;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      /* --- kıyı efekti (kara katmanından hemen önce) --- */
      var landLayer = this.get_('landmass');
      if (this.shore && landLayer && landLayer.visible) {
        if (this.shoreDirty || !this.shoreCanvas) this.buildShore();
        if (this.shoreCanvas) {
          ctx.save();
          ctx.globalAlpha = 0.9 * landLayer.opacity;
          ctx.drawImage(this.shoreCanvas, 0, 0, W, H);
          ctx.restore();
        }
      }

      /* --- nehir ağzı deniz plume'u: TERRAIN'DEN ÖNCE çizilir.
         Böylece terrain rasteri bunun üstüne biner ve karaya taşan
         kısım otomatik örtülür — kıyı efektiyle aynı teknik. --- */
      var riversLayerEarly = Layers.get('rivers');
      if (riversLayerEarly && riversLayerEarly.visible) {
        var self0 = this;
        for (var pi = 0; pi < riversLayerEarly.objects.length; pi++) {
          var ro = riversLayerEarly.objects[pi];
          if (ro.kind === 'lake') continue;
          if (!ro.pts || ro.pts.length < 2) continue;
          var fp = self0.riverGeometry(ro);
          var wE = ro.width || 12;
          var crossing0 = self0._findSeaCrossingCached(ro, fp);
          if (crossing0) {
            self0._drawRiverPlume(ctx, ro, crossing0, fp, ro.color || '#5b8aa6', wE);
          }
        }
      }

      /* Yollar varsayılan olarak nehirlerin ALTINDA kalır (köprü olmadan
         geçiş doğal görünsün). Panel sırasını değiştirmeden, sadece
         render sırasında yolları nehirlerden önce çiziyoruz. */
      var roadsLayerEarly = Layers.get('roads');
      if (roadsLayerEarly && roadsLayerEarly.visible) {
        ctx.save();
        ctx.globalAlpha = roadsLayerEarly.opacity;
        for (var ri = 0; ri < roadsLayerEarly.objects.length; ri++) {
          this.drawRoad(ctx, roadsLayerEarly.objects[ri]);
        }
        ctx.restore();
      }

      for (var i = 0; i < Layers.list.length; i++) {
        var l = Layers.list[i];
        if (!l.visible) continue;
        if (l.id === 'roads') continue; /* yukarıda erken çizildi */

        if (l.id === 'reference') {
          if (!opt.includeReference || !l.image) continue;
          ctx.save();
          ctx.globalAlpha = l.opacity;
          ctx.drawImage(l.image, 0, 0, W, H);
          ctx.restore();
          continue;
        }

        if (l.id === 'elevation') {
          if (App.elevation && (App.elevation.showHillshade || App.elevation.showContours)) {
            if (this.elevationDirty || !this.elevationCanvas) this.buildElevationEffect();
            if (this.elevationCanvas) {
              ctx.save();
              ctx.globalAlpha = l.opacity;
              ctx.drawImage(this.elevationCanvas, 0, 0, W, H);
              ctx.restore();
            }
          }
          continue;
        }

        if (l.type === 'raster') {
          ctx.save();
          ctx.globalAlpha = l.opacity;
          ctx.drawImage(l.canvas, 0, 0, W, H);
          ctx.restore();
          continue;
        }

        if (l.type === 'vector') {
          ctx.save();
          ctx.globalAlpha = l.opacity;
          var self_ = this;
          if (l.id === 'rivers') {
            /* 1. pass: göl kıyı bantları — nehirlerin altında */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind === 'lake') self_.drawLakeShore(ctx, l.objects[j]);
            }
            /* 2. pass: nehirler — göl kıyısının üstünde */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind !== 'lake') self_.drawRiver(ctx, l.objects[j]);
            }
            /* 3. pass: göl dolguları — nehirlerin üstünde */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind === 'lake') self_.drawLakeFill(ctx, l.objects[j]);
            }
            /* 4. pass: nehir-göl birleşim yerinde delta/plume karışım efekti */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind !== 'lake') {
                for (var k2 = 0; k2 < l.objects.length; k2++) {
                  if (l.objects[k2].kind === 'lake') {
                    self_.drawRiverLakeConfluence(ctx, l.objects[j], l.objects[k2]);
                  }
                }
              }
            }
          } else {
            for (var j = 0; j < l.objects.length; j++) {
              var o = l.objects[j];
              if (l.id === 'roads') this.drawRoad(ctx, o);
              else if (l.id === 'territories') this.drawTerritory(ctx, o);
              else if (l.id === 'symbols') {
                if (o.clip && !this.isOnLand(o.x, o.y)) { /* kara sınırı dışına taştı — çizme */ }
                else if (o.kind === 'group') {
                  o.members.forEach(function(m){ Sym.draw(ctx, m.sym, m, function(){ Cv.requestRender(); }); });
                } else {
                  Sym.draw(ctx, o.sym, o, function(){ Cv.requestRender(); });
                }
              }
              else if (l.id === 'resources') this.drawResource(ctx, o);
              else if (l.id === 'links') { if (opt.includeLinks !== false) this.drawLink(ctx, o); }
              else if (l.id === 'labels') this.drawLabel(ctx, o);
            }
          }
          ctx.restore();
          continue;
        }

        if (l.type === 'overlay' && this.parchment) {
          ctx.save();
          ctx.globalAlpha = 0.55 * l.opacity;
          ctx.globalCompositeOperation = 'multiply';
          var pp = ctxPattern(ctx, parchTile, 'parch');
          ctx.fillStyle = pp || 'rgba(217,199,154,0.5)';
          ctx.fillRect(0, 0, W, H);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.35 * l.opacity;
          var g = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.32, W/2, H/2, Math.max(W,H)*0.72);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, 'rgba(60,40,15,0.75)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }
      }

      /* --- ölçek çubuğu (en üstte) --- */
      if (global.App && App.scale && App.scale.visible) this.drawScaleBar(ctx, App.scale);
      /* --- windrose --- */
      if (global.App && App.windrose && App.windrose.visible) this.drawWindrose(ctx, App.windrose);
    },

    get_: function (id) { return Layers.get(id); },

    /* ---------- nehir ---------- */
    riverGeometry: function (o) {
      var pts = o.handles ? Geo.sampleBezier(o.pts, o.handles, 18, false) : Geo.sample(o.pts, 18);
      return Geo.meander(pts, (o.meander||0)*(o.width||12)*1.6, (o.width||12)*9);
    },

    _pointInPoly: function (x, y, pts) {
      var inside = false;
      for (var i=0, j=pts.length-1; i<pts.length; j=i++) {
        var xi=pts[i][0], yi=pts[i][1], xj=pts[j][0], yj=pts[j][1];
        var intersect = ((yi>y) !== (yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi);
        if (intersect) inside = !inside;
      }
      return inside;
    },

    /* nehir ucu göle giriyorsa: göl içine dağılan organik tortu bulutu.
       Geometrik yelpaze yerine çok sayıda yumuşak leke kullanılır. */
    drawRiverLakeConfluence: function (ctx, river, lake) {
      if (!river.pts || river.pts.length < 2 || !lake.pts || lake.pts.length < 3) return;
      var rPts = this.riverGeometry(river);
      var lPts = this.lakeSmoothPts(lake, 30);
      var mouth = rPts[rPts.length-1];
      if (!this._pointInPoly(mouth[0], mouth[1], lPts)) return;

      ctx.save();
      /* göl sınırına clip — dağılım göl dışına taşmasın */
      ctx.beginPath();
      ctx.moveTo(lPts[0][0], lPts[0][1]);
      for (var i=1;i<lPts.length;i++) ctx.lineTo(lPts[i][0], lPts[i][1]);
      ctx.closePath();
      ctx.clip();

      /* nehir ağzı dağılımıyla aynı organik yöntemi kullan */
      var fakeCrossing = { point: mouth, index: rPts.length-1 };
      this._drawRiverPlume(ctx, river, fakeCrossing, rPts,
                           river.color || lake.color || '#5b8aa6',
                           river.width || 12);

      ctx.restore();
    },

    /* karadan denize geçiş noktasını bulur. SONUÇ CACHE'LENİR —
       her karede yeniden hesaplanmaz, sadece nehir noktaları değişince. */
    _riverCrossingCache: {},

    _findSeaCrossing: function (pts) {
      var lmLayer = global.Layers && Layers.get('landmass');
      if (!lmLayer || !lmLayer.canvas) return null;
      var tc = document.createElement('canvas'); tc.width=1; tc.height=1;
      var tx = tc.getContext('2d');
      function isLand(x, y) {
        try {
          tx.clearRect(0,0,1,1);
          tx.drawImage(lmLayer.canvas, Math.round(x)-1, Math.round(y)-1, 3,3, 0,0,1,1);
          return tx.getImageData(0,0,1,1).data[3] >= 80;
        } catch(e) { return true; }
      }
      /* SONDAN BAŞA doğru tara: "karada olunan SON nokta"yı bul.
         İlk geçişi aramak yerine bunu yapmamızın sebebi: kıyı düzensiz
         olduğunda meander sapması nehri kısa süreliğine "deniz" sayılan
         bir noktaya değdirebilir — ilk geçişi kesim noktası sayarsak
         nehri erken ve yanlış yerden keseriz. Sondan taramak, nehrin
         kalıcı olarak karayı terk ettiği GERÇEK noktayı bulur. */
      var lastLandIdx = -1;
      for (var i = pts.length - 1; i >= 0; i--) {
        if (isLand(pts[i][0], pts[i][1])) { lastLandIdx = i; break; }
      }
      if (lastLandIdx === -1) return null;               /* hiç kara yok — nehir tamamen denizde, gösterme */
      if (lastLandIdx === pts.length - 1) return null;     /* nehir tamamen karada, deniz hiç görmüyor */
      return { index: lastLandIdx + 1, point: pts[lastLandIdx + 1] };
    },

    _findSeaCrossingCached: function (o, fullPts) {
      var key = JSON.stringify(o.pts);
      var c = this._riverCrossingCache[o.id];
      if (c && c.key === key) return c.crossing;
      var crossing = this._findSeaCrossing(fullPts);
      this._riverCrossingCache[o.id] = { key: key, crossing: crossing };
      return crossing;
    },

    drawRiver: function (ctx, o) {
      if (!o.pts || o.pts.length < 2) return;
      var fullPts = this.riverGeometry(o);
      var wEnd = o.width || 12;
      var wStart = o.taper ? Math.max(1.2, wEnd*0.18) : wEnd;
      var col = o.color || '#5b8aa6';
      var baseAlpha = (o.opacity === undefined ? 1 : o.opacity);

      /* kıyı geçişini bul (cache'li) — nehri SADECE karada kalan
         kısmıyla çiz, deniz üzerindeki kısmı tamamen at */
      var crossing = this._findSeaCrossingCached(o, fullPts);
      var pts = crossing ? fullPts.slice(0, crossing.index + 1) : fullPts;
      if (pts.length < 2) pts = fullPts.slice(0, 2);

      var poly = Geo.ribbon(pts, wStart, wEnd);

      ctx.save();
      ctx.globalAlpha = baseAlpha;
      var path = Geo.polyPath(poly); path.closePath();
      ctx.fillStyle = col; ctx.fill(path);
      ctx.strokeStyle = col; ctx.globalAlpha = baseAlpha*0.55;
      ctx.lineWidth = Math.max(0.7, wEnd*0.09); ctx.lineJoin='round'; ctx.stroke(path);
      ctx.restore();

      /* not: deniz plume efekti artık burada değil — render döngüsünün
         başında (terrain katmanından önce) çiziliyor, böylece terrain
         onun üstüne binip karaya taşan kısmı otomatik örtüyor. */
    },

    /* ---------- nehir ağzı tortu dağılımı ----------
       Tek geometrik poligon yerine, akış yönünde savrulmuş ÇOK SAYIDA
       yumuşak radyal leke üst üste bindirilir. Her leke farklı konum,
       boyut ve saydamlıkta; toplamı düzensiz, bulutsu bir dağılım verir.
       Deterministik seed → her render'da aynı görünüm.               */
    _drawRiverPlume: function (ctx, o, crossing, fullPts, col, wEnd) {
      var mouth = crossing.point;
      var prevIdx = Math.max(0, crossing.index - 1);
      var prevPt = fullPts[prevIdx];
      var dx = mouth[0]-prevPt[0], dy = mouth[1]-prevPt[1];
      var dlen = Math.hypot(dx,dy) || 1; dx/=dlen; dy/=dlen;
      var nx = -dy, ny = dx;

      /* deterministik pseudo-random (nehir id + index seed) */
      var seedBase = 0;
      var idStr = String(o.id || '');
      for (var q=0; q<idStr.length; q++) seedBase += idStr.charCodeAt(q)*(q+1);
      seedBase += Math.round(mouth[0]*0.7 + mouth[1]*1.3);
      function rnd(i) {
        var x = Math.sin(seedBase*0.017 + i*78.233) * 43758.5453;
        return x - Math.floor(x);
      }

      /* rgb ayrıştır — alfalı gradient için */
      var hex = (col||'#5b8aa6').replace('#','');
      if (hex.length===3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      var R = parseInt(hex.substr(0,2),16),
          G = parseInt(hex.substr(2,2),16),
          B = parseInt(hex.substr(4,2),16);
      function rgba(a) { return 'rgba('+R+','+G+','+B+','+a+')'; }

      var reach = wEnd * 4.2;      /* toplam yayılma mesafesi — kısaltıldı */
      var blobs = 24;            /* leke sayısı */

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';

      for (var i=0; i<blobs; i++) {
        var r1 = rnd(i*3), r2 = rnd(i*3+1), r3 = rnd(i*3+2);

        /* akış yönünde ilerleme: öne doğru yoğunlaşan dağılım */
        var t = Math.pow(r1, 0.65);              /* 0..1, ağıza yakın daha sık */
        var along = reach * t;

        /* yanal savrulma: mesafeyle artan, rastgele işaretli */
        var lateralMax = wEnd * (0.65 + t * 4.4);
        var lateral = (r2 - 0.5) * 2 * lateralMax;

        /* hafif geri/ileri jitter — sıra sıra dizilmesin */
        var jitter = (r3 - 0.5) * wEnd * 1.2;

        var px = mouth[0] + dx*(along + jitter) + nx*lateral;
        var py = mouth[1] + dy*(along + jitter) + ny*lateral;

        /* leke boyutu: uzaklaştıkça büyür ama zayıflar */
        var rad = wEnd * (0.95 + t*2.5) * (0.6 + r3*0.9);
        /* saydamlık: ağıza yakın koyu, uzakta silik */
        var alpha = 0.30 * (1 - t*0.88) * (0.55 + r2*0.65);
        if (alpha < 0.012) continue;

        var g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0,    rgba(alpha));
        g.addColorStop(0.45, rgba(alpha*0.55));
        g.addColorStop(1,    rgba(0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI*2);
        ctx.fill();
      }

      /* ağız çekirdeği — nehrin sudan çıktığı nokta belli olsun,
         ama sert kenar olmadan */
      var coreR = wEnd * 1.7;
      var cg = ctx.createRadialGradient(mouth[0],mouth[1],0, mouth[0],mouth[1], coreR);
      cg.addColorStop(0,   rgba(0.42));
      cg.addColorStop(0.5, rgba(0.22));
      cg.addColorStop(1,   rgba(0));
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(mouth[0], mouth[1], coreR, 0, Math.PI*2);
      ctx.fill();

      ctx.restore();
    },

    /* ---------- göl yardımcısı: köşe yumuşatma (Chaikin) ----------
       Kullanıcının elle çizdiği ham göl noktaları keskin köşeler
       içerebilir. Kapalı bir poligonu birkaç iterasyonda yumuşatır. */
    _chaikinSmooth: function (pts, iterations) {
      var out = pts;
      for (var it = 0; it < iterations; it++) {
        var next = [];
        var n = out.length;
        for (var i = 0; i < n; i++) {
          var p0 = out[i], p1 = out[(i+1)%n];
          next.push([p0[0]*0.75 + p1[0]*0.25, p0[1]*0.75 + p1[1]*0.25]);
          next.push([p0[0]*0.25 + p1[0]*0.75, p0[1]*0.25 + p1[1]*0.75]);
        }
        out = next;
      }
      return out;
    },

    /* ham çizim noktalarını basitleştir: birbirine çok yakın ardışık
       noktaları birleştir. Kullanıcının elle çizdiği göller genelde
       yoğun/düzensiz nokta kümeleri içerir, bu kümeler Chaikin sonrası
       bile ufak köşeler bırakabilir — önce onları temizliyoruz. */
    _simplifyPts: function (pts, minDist) {
      if (pts.length < 4) return pts;
      var out = [pts[0]];
      for (var i = 1; i < pts.length; i++) {
        var last = out[out.length-1];
        var d = Math.hypot(pts[i][0]-last[0], pts[i][1]-last[1]);
        if (d >= minDist) out.push(pts[i]);
      }
      if (out.length < 3) return pts; /* aşırı basitleşmeyi önle */
      return out;
    },

    /* göl/bölge için yumuşatılmış nokta dizisi üretir — tüm göl/bölge
       fonksiyonları bunu ortak kullanır ki kıyı ve dolgu birbiriyle
       tutarlı kalsın. o: nesne ({pts,handles}) ya da geriye dönük
       uyumluluk için doğrudan nokta dizisi kabul eder. */
    lakeSmoothPts: function (o, sampleN) {
      var rawPts  = Array.isArray(o) ? o : o.pts;
      var handles = Array.isArray(o) ? null : o.handles;
      if (handles) {
        /* kullanıcı tutamaç düzenlemesi yaptıysa: basitleştirme/Chaikin
           uygulanmaz, doğrudan kapalı bezier eğrisi örneklenir */
        return Geo.sampleBezier(rawPts, handles, 12, true);
      }
      /* Az agresif basitleştirme — kullanıcının orijinal hatlarını koru */
      var cleaned = this._simplifyPts(rawPts, 6);
      /* Daha fazla örnekleme noktası — detayları kaybetmeden yumuşat */
      var sampled = Geo.sample(cleaned, Math.max(sampleN, 48));
      /* SADECE 1 hafif Chaikin iterasyonu: çizilen şekli generic bir
         oval/elmasa dönüştürmeden yalnızca sivri köşeleri hafifçe kırpar.
         Önceki 5 iterasyon şekli tanınmaz hale getiriyordu. */
      return this._chaikinSmooth(sampled, 1);
    },

    /* ---------- göl yardımcısı: terrain kıyı rengi ----------
       getImageData her frame'de senkron GPU okuması yapar; terrain
       değişmediği sürece (shoreDirty false) sonucu göl id'sine göre
       önbelleğe alırız — pan/zoom sırasında tekrar tekrar okumayız. */
    _lakeShoreColorCache: {},
    _lakeShoreColor: function (pts, lakeId) {
      var sampleX = Math.round(pts[0][0]), sampleY = Math.round(pts[0][1]);
      var cache = this._lakeShoreColorCache;
      var entry = lakeId != null ? cache[lakeId] : null;
      if (entry && !this.shoreDirty && entry.sx === sampleX && entry.sy === sampleY) {
        return entry.col;
      }

      var shoreCol = 'rgba(195,178,140,0.75)';
      var tLayer = global.Layers && Layers.get('terrain');
      if (tLayer && tLayer.canvas) {
        try {
          var tc = document.createElement('canvas'); tc.width=1; tc.height=1;
          var tx = tc.getContext('2d');
          tx.drawImage(tLayer.canvas, sampleX-1, sampleY-1, 3, 3, 0, 0, 1, 1);
          var px = tx.getImageData(0,0,1,1).data;
          if (px[3] > 20) {
            var lr = Math.min(255,px[0]+60), lg = Math.min(255,px[1]+50), lb = Math.min(255,px[2]+40);
            shoreCol = 'rgba('+lr+','+lg+','+lb+',0.82)';
          }
        } catch(e) {}
      }

      if (lakeId != null) cache[lakeId] = { sx:sampleX, sy:sampleY, col:shoreCol };
      return shoreCol;
    },

    /* ---------- göl kıyı maskesi: blur tabanlı (raster), asla sivri uç üretmez ----------
       Vektör offset yöntemi göllerin dar/çukur (concave) bölgelerinde
       matematiksel olarak kırılıp sivri uçlar üretiyordu. Bunun yerine
       ana kıyı efektinde (buildShoreCanvas) kullanılan kanıtlanmış
       blur yöntemi kullanılıyor: göl siluetini çiz, blur uygula.
       Sonuç PTS bazlı cache'lenir — sadece göl şekli değişince yeniden
       hesaplanır, her karede değil. */
    _lakeShoreCache: {},

    _buildLakeShoreMask: function (o) {
      var pts = this.lakeSmoothPts(o, 40);
      var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for (var i=0;i<pts.length;i++) {
        if (pts[i][0]<minX) minX=pts[i][0];
        if (pts[i][0]>maxX) maxX=pts[i][0];
        if (pts[i][1]<minY) minY=pts[i][1];
        if (pts[i][1]>maxY) maxY=pts[i][1];
      }
      var pad = 46;
      var bx = minX-pad, by = minY-pad;
      var bw = (maxX-minX)+pad*2, bh = (maxY-minY)+pad*2;
      var MAXD = 700;
      var scale = Math.min(1, MAXD/Math.max(bw,bh,1));
      var cw = Math.max(1, Math.round(bw*scale)), ch = Math.max(1, Math.round(bh*scale));

      var c1 = document.createElement('canvas'); c1.width=cw; c1.height=ch;
      var x1 = c1.getContext('2d');
      x1.save();
      x1.scale(scale, scale);
      x1.translate(-bx, -by);
      x1.fillStyle = '#fff';
      x1.beginPath();
      x1.moveTo(pts[0][0], pts[0][1]);
      for (var i=1;i<pts.length;i++) x1.lineTo(pts[i][0], pts[i][1]);
      x1.closePath();
      x1.fill();
      x1.restore();

      /* blur ile yumuşak, düzensiz-görünen kenar — vektör diken riski yok */
      var blurPx = Math.max(4, 24*scale);
      var c2 = document.createElement('canvas'); c2.width=cw; c2.height=ch;
      var x2 = c2.getContext('2d');
      x2.filter = 'blur(' + blurPx.toFixed(1) + 'px)';
      x2.drawImage(c1, 0, 0);
      x2.filter = 'none';

      return { canvas:c2, bx:bx, by:by, bw:bw, bh:bh };
    },

    drawLakeShore: function (ctx, o) {
      if (!o.pts || o.pts.length < 3) return;

      var key = JSON.stringify(o.pts);
      var entry = this._lakeShoreCache[o.id];
      if (!entry || entry.key !== key) {
        var built = this._buildLakeShoreMask(o);
        entry = { key:key, mask:built.canvas, bx:built.bx, by:built.by, bw:built.bw, bh:built.bh };
        this._lakeShoreCache[o.id] = entry;
      }

      var pts = this.lakeSmoothPts(o, 8);
      var shoreCol = this._lakeShoreColor(pts, o.id);

      /* maskeyi renklendir: ayrı bir scratch canvas'ta — ana ctx'e
         asla destination-in gibi yıkıcı bir mod uygulanmaz */
      var scratch = document.createElement('canvas');
      scratch.width = entry.mask.width; scratch.height = entry.mask.height;
      var sx = scratch.getContext('2d');
      sx.fillStyle = shoreCol;
      sx.fillRect(0,0,scratch.width,scratch.height);
      sx.globalCompositeOperation = 'destination-in';
      sx.drawImage(entry.mask, 0, 0);
      sx.globalCompositeOperation = 'source-over';

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(scratch, entry.bx, entry.by, entry.bw, entry.bh);
      ctx.restore();
    },

    /* ---------- göl 2. pass: dolgu + iç efektler (nehirlerin üstünde) ---------- */
    drawLakeFill: function (ctx, o) {
      if (!o.pts || o.pts.length < 3) return;
      var pts = this.lakeSmoothPts(o, 24);
      var col = o.color || '#5b8aa6';
      var shoreCol = this._lakeShoreColor(pts, o.id);

      var cx = 0, cy = 0;
      for (var k=0; k<pts.length; k++) { cx+=pts[k][0]; cy+=pts[k][1]; }
      cx /= pts.length; cy /= pts.length;

      function makePath() {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i=1; i<pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
      }

      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      /* ana dolgu */
      ctx.globalAlpha = 0.96;
      ctx.fillStyle = col;
      makePath(); ctx.fill();

      /* derinlik gradient */
      ctx.save();
      makePath(); ctx.clip();
      var maxR = 0;
      for (var j=0; j<pts.length; j++) {
        var d = Math.hypot(pts[j][0]-cx, pts[j][1]-cy);
        if (d > maxR) maxR = d;
      }
      var dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      dg.addColorStop(0,   'rgba(0,0,0,0.20)');
      dg.addColorStop(0.6, 'rgba(0,0,0,0.05)');
      dg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = dg;
      ctx.fillRect(cx-maxR-10, cy-maxR-10, (maxR+10)*2, (maxR+10)*2);
      ctx.restore();

      /* dış kenar ince */
      ctx.globalAlpha = 0.30;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2;
      makePath(); ctx.stroke();

      ctx.restore();
    },

    /* ---------- bölge/toprak (territory) dolgusu ---------- */
    drawTerritory: function (ctx, o) {
      if (!o.pts || o.pts.length < 3) return;
      var pts = this.lakeSmoothPts(o, 24);
      ctx.save();
      ctx.lineJoin = 'round';
      var path = Geo.polyPath(pts);
      path.closePath();
      ctx.globalAlpha *= (o.opacity === undefined ? 0.30 : o.opacity);
      ctx.fillStyle = o.color || '#8a5a3a';
      ctx.fill(path);
      if (o.borderWidth) {
        ctx.globalAlpha = Math.min(1, (o.opacity === undefined ? 0.30 : o.opacity) * 2.4);
        ctx.strokeStyle = o.borderColor || '#5a3a20';
        ctx.lineWidth = o.borderWidth;
        ctx.setLineDash([o.borderWidth*3, o.borderWidth*2]);
        ctx.stroke(path);
      }
      ctx.restore();
    },

    /* eski drawLake — geriye uyumluluk için yönlendir */
    drawLake: function (ctx, o) {
      this.drawLakeShore(ctx, o);
      this.drawLakeFill(ctx, o);
    },

    lakeGeometry: function (o) { return Geo.sample(o.pts, 16); },

    /* ---------- windrose ---------- */
    windroseSize: function (wr) { return wr.size || 120; },

    windroseBounds: function (wr) {
      var r = this.windroseSize(wr) * 0.6;
      return { x: wr.x - r, y: wr.y - r, w: r*2, h: r*2 };
    },

    drawWindrose: function (ctx, wr) {
      var style = wr.style || 'classic';
      if (style === 'minimal') { this.drawWindroseMinimal(ctx, wr); return; }

      var x = wr.x, y = wr.y, R = this.windroseSize(wr);
      var col = wr.color || '#3a2b18';
      ctx.save();
      ctx.translate(x, y);

      /* dış daire */
      ctx.strokeStyle = col;
      ctx.lineWidth = R * 0.025;
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.52, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;

      /* 8 yön oku */
      var dirs = [0, 45, 90, 135, 180, 225, 270, 315];
      dirs.forEach(function(deg) {
        var rad = deg * Math.PI / 180;
        var isCard = (deg % 90 === 0); /* kardinal yönler daha büyük */
        var tip = isCard ? R * 0.50 : R * 0.32;
        var base = isCard ? R * 0.13 : R * 0.08;
        var side = isCard ? R * 0.10 : R * 0.06;
        ctx.save();
        ctx.rotate(rad);
        ctx.beginPath();
        ctx.moveTo(0, -tip);
        ctx.lineTo(side, -base);
        ctx.lineTo(0, 0);
        ctx.lineTo(-side, -base);
        ctx.closePath();
        ctx.fillStyle = isCard ? col : col;
        ctx.globalAlpha = isCard ? 1.0 : 0.65;
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = R * 0.018;
        ctx.stroke();
        ctx.restore();
      });

      /* merkez nokta */
      ctx.beginPath(); ctx.arc(0, 0, R * 0.06, 0, Math.PI*2);
      ctx.fillStyle = '#f5ecd8'; ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = R * 0.025; ctx.stroke();

      /* N harfi */
      ctx.font = 'bold ' + Math.round(R*0.22) + 'px Georgia,serif';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, -(R * 0.70));

      ctx.restore();
    },

    /* sade stil: ince artı + dört ana yön ticki + N etiketi, süslemesiz */
    drawWindroseMinimal: function (ctx, wr) {
      var x = wr.x, y = wr.y, R = this.windroseSize(wr);
      var col = wr.color || '#3a2b18';
      ctx.save();
      ctx.translate(x, y);

      ctx.strokeStyle = col;
      ctx.lineCap = 'round';

      /* dış çember */
      ctx.lineWidth = R * 0.02;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.46, 0, Math.PI*2); ctx.stroke();

      /* dört ana eksen çizgisi */
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = R * 0.022;
      ctx.beginPath();
      ctx.moveTo(0, -R*0.46); ctx.lineTo(0, R*0.46);
      ctx.moveTo(-R*0.46, 0); ctx.lineTo(R*0.46, 0);
      ctx.stroke();

      /* ara yön tikleri */
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = R * 0.014;
      [45,135,225,315].forEach(function (deg) {
        var rad = deg * Math.PI/180;
        var x1 = Math.sin(rad)*R*0.36, y1 = -Math.cos(rad)*R*0.36;
        var x2 = Math.sin(rad)*R*0.46, y2 = -Math.cos(rad)*R*0.46;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });

      /* merkez nokta */
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.035, 0, Math.PI*2);
      ctx.fillStyle = col; ctx.fill();

      /* N ucu ok */
      ctx.beginPath();
      ctx.moveTo(0, -R*0.46);
      ctx.lineTo(R*0.045, -R*0.36);
      ctx.lineTo(-R*0.045, -R*0.36);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();

      /* N harfi */
      ctx.font = '600 ' + Math.round(R*0.16) + 'px Georgia,serif';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, -(R * 0.60));

      ctx.restore();
    },

    /* ---------- yol ---------- */
    roadGeometry: function (o) {
      return o.handles ? Geo.sampleBezier(o.pts, o.handles, 14, false) : Geo.sample(o.pts, 14);
    },

    drawRoad: function (ctx, o) {
      if (!o.pts || o.pts.length < 2) return;
      var pts = this.roadGeometry(o);
      var path = Geo.polyPath(pts);
      var w = o.width || 5;
      var col = o.color || '#6b4f2a';
      ctx.save();
      ctx.globalAlpha *= (o.opacity === undefined ? 1 : o.opacity);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      /* --- alt gölge: hafif koyu şerit, sadece varlığı belli etmek için --- */
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = w * 1.9;
      ctx.stroke(path);

      /* --- zemin tonu: çok hafif, yolu terrain'den ayırmak için --- */
      ctx.strokeStyle = 'rgba(205,185,145,0.30)';
      ctx.lineWidth = w * 1.4;
      ctx.stroke(path);

      /* --- asıl yol çizgisi --- */
      ctx.strokeStyle = col;
      if (o.style === 'dashed') {
        ctx.setLineDash([w*2.6, w*2.0]); ctx.lineWidth = w; ctx.stroke(path);
      } else if (o.style === 'dotted') {
        ctx.setLineDash([w*0.35, w*2.1]); ctx.lineWidth = w; ctx.stroke(path);
      } else if (o.style === 'double') {
        ctx.setLineDash([]); ctx.lineWidth = w*1.9; ctx.stroke(path);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = w*0.7; ctx.stroke(path);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.setLineDash([]); ctx.lineWidth = w; ctx.stroke(path);
      }
      ctx.setLineDash([]);
      ctx.restore();
    },

    /* ================= ETİKETLER ================= */
    labelFont: function (o) {
      return '600 ' + (o.size||32) + 'px ' + (FONTS[o.font] || FONTS.serif);
    },

    labelText: function (o) {
      var t = o.text || '';
      return o.caps ? t.toUpperCase() : t;
    },

    measureLabel: function (ctx, o) {
      ctx.save();
      ctx.font = this.labelFont(o);
      var tr = o.track || 0, w = 0, t = this.labelText(o);
      for (var i = 0; i < t.length; i++) w += ctx.measureText(t[i]).width + tr;
      ctx.restore();
      return Math.max(1, w - tr);
    },

    /* Kapıt (banner) geometrisi — canvas ve SVG ortak kullanır.
       Dönen: [{d, fill, stroke, lw}]  (etiket merkezinde, 0,0)   */
    bannerPaths: function (style, w, h) {
      var out = [];
      var hw = w/2, hh = h/2;
      var PARCH = '#e9d9ae', PARCH_D = '#cbb887', INK = '#5a4326';

      if (style === 'ribbon') {
        var tail = h*0.85, notch = h*0.42;
        /* kuyruklar */
        out.push({ d:'M'+(-hw)+' '+(-hh*0.72)+' L'+(-hw-tail)+' '+(-hh*1.05)+
                     ' L'+(-hw-tail*0.72)+' 0 L'+(-hw-tail)+' '+(hh*1.05)+
                     ' L'+(-hw)+' '+(hh*0.72)+' Z', fill:PARCH_D, stroke:INK, lw:h*0.055 });
        out.push({ d:'M'+(hw)+' '+(-hh*0.72)+' L'+(hw+tail)+' '+(-hh*1.05)+
                     ' L'+(hw+tail*0.72)+' 0 L'+(hw+tail)+' '+(hh*1.05)+
                     ' L'+(hw)+' '+(hh*0.72)+' Z', fill:PARCH_D, stroke:INK, lw:h*0.055 });
        /* gövde */
        out.push({ d:'M'+(-hw)+' '+(-hh)+' L'+(hw)+' '+(-hh)+
                     ' L'+(hw-notch)+' 0 L'+(hw)+' '+hh+
                     ' L'+(-hw)+' '+hh+' L'+(-hw+notch)+' 0 Z',
                   fill:PARCH, stroke:INK, lw:h*0.06 });
        return out;
      }

      if (style === 'plate') {
        var r = h*0.30;
        out.push({ d:roundRectD(-hw, -hh, w, h, r), fill:PARCH, stroke:INK, lw:h*0.07 });
        out.push({ d:roundRectD(-hw+h*0.13, -hh+h*0.13, w-h*0.26, h-h*0.26, r*0.7),
                   fill:null, stroke:INK, lw:h*0.032 });
        return out;
      }

      if (style === 'scroll') {
        var roll = h*0.46;
        out.push({ d:'M'+(-hw)+' '+(-hh)+' L'+hw+' '+(-hh)+' L'+hw+' '+hh+' L'+(-hw)+' '+hh+' Z',
                   fill:PARCH, stroke:INK, lw:h*0.055 });
        /* kıvrık uçlar */
        out.push({ d:'M'+(-hw)+' '+(-hh)+' C'+(-hw-roll)+' '+(-hh)+' '+(-hw-roll)+' '+hh+' '+(-hw)+' '+hh+
                     ' C'+(-hw-roll*0.45)+' '+(hh*0.4)+' '+(-hw-roll*0.45)+' '+(-hh*0.4)+' '+(-hw)+' '+(-hh)+' Z',
                   fill:PARCH_D, stroke:INK, lw:h*0.05 });
        out.push({ d:'M'+hw+' '+(-hh)+' C'+(hw+roll)+' '+(-hh)+' '+(hw+roll)+' '+hh+' '+hw+' '+hh+
                     ' C'+(hw+roll*0.45)+' '+(hh*0.4)+' '+(hw+roll*0.45)+' '+(-hh*0.4)+' '+hw+' '+(-hh)+' Z',
                   fill:PARCH_D, stroke:INK, lw:h*0.05 });
        return out;
      }

      if (style === 'stone') {
        var j = h*0.10;
        out.push({ d:'M'+(-hw)+' '+(-hh+j)+' L'+(-hw+j*1.4)+' '+(-hh)+
                     ' L'+(hw-j*1.1)+' '+(-hh)+' L'+hw+' '+(-hh+j*0.8)+
                     ' L'+hw+' '+(hh-j)+' L'+(hw-j*1.5)+' '+hh+
                     ' L'+(-hw+j)+' '+hh+' L'+(-hw)+' '+(hh-j*1.2)+' Z',
                   fill:'#c9c2b0', stroke:'#4a443a', lw:h*0.07 });
        out.push({ d:'M'+(-hw+j*1.6)+' '+(-hh+j*1.5)+' L'+(hw-j*1.6)+' '+(-hh+j*1.5),
                   fill:null, stroke:'#8d867a', lw:h*0.03 });
        return out;
      }
      return out;
    },

    /* ---------- kaynak/ikon işaretleri (maden, tarım, avlanma, balıkçılık, ticaret, taş ocağı) ---------- */
    RESOURCE_TYPES: {
      mine:     { color:'#8a7a5a', icon: function (ctx, r) {
        ctx.save(); ctx.rotate(-Math.PI/4);
        ctx.beginPath(); ctx.moveTo(0,-r*0.55); ctx.lineTo(0,r*0.15); ctx.lineWidth = r*0.16; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*0.3,-r*0.55); ctx.lineTo(r*0.3,-r*0.55); ctx.lineTo(0,-r*0.15); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.rotate(Math.PI/4);
        ctx.beginPath(); ctx.moveTo(0,-r*0.55); ctx.lineTo(0,r*0.15); ctx.lineWidth = r*0.16; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*0.3,-r*0.55); ctx.lineTo(r*0.3,-r*0.55); ctx.lineTo(0,-r*0.15); ctx.closePath(); ctx.fill();
        ctx.restore();
      }},
      farm:     { color:'#8a9a4a', icon: function (ctx, r) {
        for (var i=-1; i<=1; i++) {
          ctx.beginPath();
          ctx.moveTo(i*r*0.28, r*0.5);
          ctx.quadraticCurveTo(i*r*0.5, 0, i*r*0.14, -r*0.55);
          ctx.lineWidth = r*0.13; ctx.lineCap = 'round'; ctx.stroke();
        }
      }},
      hunting:  { color:'#7a4a30', icon: function (ctx, r) {
        ctx.save(); ctx.rotate(Math.PI/4);
        ctx.beginPath(); ctx.moveTo(0,-r*0.6); ctx.lineTo(0,r*0.6); ctx.lineWidth = r*0.13; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-r*0.6); ctx.lineTo(-r*0.24,-r*0.28); ctx.moveTo(0,-r*0.6); ctx.lineTo(r*0.24,-r*0.28);
        ctx.lineWidth = r*0.11; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*0.2,r*0.4); ctx.lineTo(0,r*0.6); ctx.lineTo(r*0.2,r*0.4);
        ctx.lineWidth = r*0.11; ctx.stroke();
        ctx.restore();
      }},
      fishing:  { color:'#4a7a95', icon: function (ctx, r) {
        ctx.beginPath();
        ctx.moveTo(-r*0.55, 0);
        ctx.quadraticCurveTo(-r*0.15,-r*0.4, r*0.45, 0);
        ctx.quadraticCurveTo(-r*0.15, r*0.4, -r*0.55, 0);
        ctx.fill();
        ctx.beginPath(); ctx.moveTo(r*0.45,0); ctx.lineTo(r*0.68,-r*0.22); ctx.lineTo(r*0.68,r*0.22); ctx.closePath(); ctx.fill();
      }},
      trade:    { color:'#c9a44b', icon: function (ctx, r) {
        ctx.beginPath(); ctx.arc(0, 0, r*0.48, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = r*0.07;
        ctx.beginPath(); ctx.arc(0, 0, r*0.48, 0, Math.PI*2); ctx.stroke();
      }},
      quarry:   { color:'#8a8a8a', icon: function (ctx, r) {
        ctx.beginPath();
        ctx.moveTo(-r*0.5,r*0.35); ctx.lineTo(-r*0.25,-r*0.4); ctx.lineTo(r*0.15,-r*0.5);
        ctx.lineTo(r*0.5,-r*0.05); ctx.lineTo(r*0.25,r*0.45); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = r*0.05;
        ctx.beginPath(); ctx.moveTo(-r*0.25,-r*0.4); ctx.lineTo(r*0.1,r*0.1); ctx.lineTo(r*0.25,r*0.45); ctx.stroke();
      }}
    },

    drawResource: function (ctx, o) {
      var def = this.RESOURCE_TYPES[o.type] || this.RESOURCE_TYPES.mine;
      var r = (o.size||36)*0.5;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.shadowColor = 'rgba(20,15,5,0.45)'; ctx.shadowBlur = r*0.35; ctx.shadowOffsetY = r*0.08;
      ctx.fillStyle = '#f5ecd8'; ctx.strokeStyle = 'rgba(58,43,24,0.6)'; ctx.lineWidth = Math.max(1, r*0.1);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.fillStyle = def.color; ctx.strokeStyle = def.color;
      def.icon(ctx, r);
      ctx.restore();
    },

    /* ---------- bölge haritası bağlantı iğnesi ---------- */
    drawLink: function (ctx, o) {
      var r = (o.size||40)*0.5;
      ctx.save();
      ctx.translate(o.x, o.y);

      ctx.shadowColor = 'rgba(20,15,5,0.5)';
      ctx.shadowBlur = r*0.5;
      ctx.shadowOffsetY = r*0.12;
      ctx.fillStyle = '#c99a4b';
      ctx.strokeStyle = '#4a3218';
      ctx.lineWidth = Math.max(1.5, r*0.14);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();

      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.fillStyle = '#3a2b18';
      ctx.beginPath();
      ctx.moveTo(0, -r*0.55); ctx.lineTo(r*0.4, 0); ctx.lineTo(0, r*0.55); ctx.lineTo(-r*0.4, 0);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r*0.16, 0, Math.PI*2); ctx.fillStyle = '#c99a4b'; ctx.fill();

      if (o.name) {
        ctx.font = '600 ' + Math.round(r*0.62) + 'px Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.lineWidth = Math.max(2, r*0.16);
        ctx.strokeStyle = '#f5ecd8';
        ctx.strokeText(o.name, 0, r + r*0.28);
        ctx.fillStyle = '#3a2b18';
        ctx.fillText(o.name, 0, r + r*0.28);
      }
      ctx.restore();
    },

    drawLabel: function (ctx, o) {
      var text = this.labelText(o);
      if (!text) return;
      ctx.save();
      ctx.globalAlpha *= (o.opacity === undefined ? 1 : o.opacity);
      ctx.font = this.labelFont(o);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;

      var total = this.measureLabel(ctx, o);

      /* --- nehir/yol üzerine oturan etiket: gerçek çizilmiş eğriyi izler,
         daire yayı değil, sabit poligon (o.pathPts, oluşturulduğu anda alınmış) --- */
      if (o.pathPts && o.pathPts.length > 1) {
        if (o.shadow) {
          ctx.shadowColor = 'rgba(40,25,5,0.45)';
          ctx.shadowBlur = Math.max(2, (o.size||32)*0.12);
          ctx.shadowOffsetY = Math.max(1, (o.size||32)*0.05);
        }
        var pathLen = Geo.polylineLength(o.pathPts);
        var center = (o.pathCenter != null) ? o.pathCenter : pathLen/2;
        var startLen = center - total/2;
        var tr3 = o.track||0;
        var cursor = startLen;
        for (var pi = 0; pi < text.length; pi++) {
          var cw3 = ctx.measureText(text[pi]).width;
          var mid3 = cursor + cw3/2;
          var pt = Geo.pointAtLength(o.pathPts, mid3);
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.ang);
          if (o.outline) {
            ctx.strokeStyle = o.outlineColor || '#f5ecd8';
            ctx.lineWidth = Math.max(1.5, (o.size||32)*0.16);
            ctx.strokeText(text[pi], 0, 0);
          }
          ctx.fillStyle = o.color || '#3a2b18';
          ctx.fillText(text[pi], 0, 0);
          ctx.restore();
          cursor += cw3 + tr3;
        }
        ctx.restore();
        return;
      }

      ctx.translate(o.x, o.y);
      if (o.rot) ctx.rotate(o.rot*Math.PI/180);

      /* --- kapıt --- */
      if (o.banner) {
        var bw = total + (o.size||32)*1.25;
        var bh = (o.size||32)*1.62;
        var paths = this.bannerPaths(o.banner, bw, bh);
        ctx.save();
        ctx.shadowColor = 'rgba(40,25,5,0.35)';
        ctx.shadowBlur = (o.size||32)*0.18;
        ctx.shadowOffsetY = (o.size||32)*0.07;
        for (var bi = 0; bi < paths.length; bi++) {
          var bp = paths[bi], p2 = new Path2D(bp.d);
          if (bp.fill) { ctx.fillStyle = bp.fill; ctx.fill(p2); }
          if (bi > 0) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
          if (bp.stroke) { ctx.strokeStyle = bp.stroke; ctx.lineWidth = bp.lw; ctx.stroke(p2); }
        }
        ctx.restore();
      }

      if (o.shadow && !o.banner) {
        ctx.shadowColor = 'rgba(40,25,5,0.45)';
        ctx.shadowBlur = Math.max(2, (o.size||32)*0.12);
        ctx.shadowOffsetY = Math.max(1, (o.size||32)*0.05);
      }

      var arc = (o.curve||0)*Math.PI/180;

      function paint(ch, cx) {
        if (o.outline) {
          ctx.strokeStyle = o.outlineColor || '#f5ecd8';
          ctx.lineWidth = Math.max(1.5, (o.size||32)*0.16);
          ctx.strokeText(ch, cx, 0);
        }
        ctx.fillStyle = o.color || '#3a2b18';
        ctx.fillText(ch, cx, 0);
      }

      if (!arc || Math.abs(arc) < 0.01) {
        var x = -total/2, tr = o.track||0;
        for (var i = 0; i < text.length; i++) {
          var cw = ctx.measureText(text[i]).width;
          paint(text[i], x + cw/2);
          x += cw + tr;
        }
      } else {
        var R = total/arc, sign = R < 0 ? -1 : 1;
        ctx.translate(0, R);
        var a = -arc/2, tr2 = o.track||0;
        for (var j = 0; j < text.length; j++) {
          var w2 = ctx.measureText(text[j]).width + tr2;
          var mid = a + (w2/2)/R;
          ctx.save();
          ctx.rotate(mid);
          ctx.translate(0, -R);
          ctx.rotate(sign > 0 ? 0 : Math.PI);
          paint(text[j], 0);
          ctx.restore();
          a += w2/R;
        }
      }
      ctx.restore();
    },

    labelBounds: function (o) {
      var w = this.measureLabel(this.ctx, o);
      var h = (o.size||32)*1.25;
      if (o.banner) {
        w += (o.size||32)*1.25;
        h = (o.size||32)*1.62;
        if (o.banner === 'ribbon' || o.banner === 'scroll') w += (o.size||32)*1.5;
      }
      var extra = Math.abs(o.curve||0)*(o.size||32)*0.01*8;
      return { x:o.x-w/2, y:o.y-h/2-extra/2, w:w, h:h+extra };
    },

    /* ================= ÖLÇEK ÇUBUĞU ================= */
    scaleBounds: function (s) {
      var h = s.size*2.1;
      return { x:s.x, y:s.y - s.size*1.25, w:s.len, h:h };
    },

    drawScaleBar: function (ctx, s) {
      var segs = Math.max(2, s.segs|0);
      var segW = s.len/segs;
      var barH = s.size*0.62;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.lineJoin = 'miter';

      /* gövde */
      ctx.fillStyle = '#f2e6c8';
      ctx.strokeStyle = '#3a2b18';
      ctx.lineWidth = Math.max(1, s.size*0.10);
      ctx.beginPath();
      ctx.rect(0, 0, s.len, barH);
      ctx.fill();
      ctx.stroke();

      /* dolu segmentler */
      ctx.fillStyle = '#3a2b18';
      for (var i = 0; i < segs; i += 2) {
        ctx.fillRect(i*segW, 0, segW, barH);
      }
      ctx.beginPath();
      ctx.rect(0, 0, s.len, barH);
      ctx.stroke();

      /* uç tırnaklar */
      ctx.beginPath();
      ctx.moveTo(0, -s.size*0.34); ctx.lineTo(0, 0);
      ctx.moveTo(s.len, -s.size*0.34); ctx.lineTo(s.len, 0);
      ctx.moveTo(s.len/2, -s.size*0.22); ctx.lineTo(s.len/2, 0);
      ctx.stroke();

      /* metin */
      ctx.font = '600 ' + s.size + 'px ' + FONTS.serif;
      ctx.fillStyle = '#3a2b18';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';   ctx.fillText('0', 0, barH + s.size*0.24);
      ctx.textAlign = 'right';  ctx.fillText(s.label || '', s.len, barH + s.size*0.24);
      ctx.restore();
    },

    /* ---------- ızgara ---------- */
    drawGrid: function (ctx) {
      var g = this.gridSize;
      ctx.save();
      ctx.strokeStyle = 'rgba(30,40,30,0.28)';
      ctx.lineWidth = 1/this.zoom;
      ctx.beginPath();
      for (var x = 0; x <= this.W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, this.H); }
      for (var y = 0; y <= this.H; y += g) { ctx.moveTo(0, y); ctx.lineTo(this.W, y); }
      ctx.stroke();
      ctx.restore();
    },

    /* ---------- fırça imleci ---------- */
    drawCursor: function (ctx) {
      if (!this.mouse.over || !global.App) return;
      var t = App.tool, r = 0;
      if (t === 'landmass' || t === 'erase') r = App.brush.size/2;
      else if (t === 'terrain') r = App.terrain.size/2;
      else if (t === 'elevation') r = App.elevation.brushSize/2;
      else if (t === 'symbol') r = App.symbol.size/2;
      else if (t === 'eyedrop') r = App.eyedrop.painting ? App.eyedrop.brushRadius : 0;
      if (!r) return;
      var s = this.mapToScreen(this.mouse.x, this.mouse.y);
      ctx.save();
      ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(s.x, s.y, r*this.zoom, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.arc(s.x, s.y, r*this.zoom+1, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    },

    /* ---------- minimap ---------- */
    renderMini: function () {
      var m = this.mctx, S = this.mini.width;
      var s = S/Math.max(this.W, this.H);
      m.setTransform(1,0,0,1,0,0);
      m.clearRect(0, 0, S, S);
      m.save();
      m.scale(s, s);
      this.renderMap(m, { includeReference:false });
      m.restore();
      var tl = this.screenToMap(0, 0), br = this.screenToMap(this.vw, this.vh);
      m.strokeStyle = '#c99a4b';
      m.lineWidth = 1.5;
      m.strokeRect(tl.x*s, tl.y*s, (br.x-tl.x)*s, (br.y-tl.y)*s);
    },

    centerOn: function (mx, my) {
      this.panX = this.vw/2 - mx*this.zoom;
      this.panY = this.vh/2 - my*this.zoom;
      this.requestRender();
    }
  };

  function roundRectD(x, y, w, h, r) {
    return 'M'+(x+r)+' '+y+
           ' L'+(x+w-r)+' '+y+' Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+
           ' L'+(x+w)+' '+(y+h-r)+' Q'+(x+w)+' '+(y+h)+' '+(x+w-r)+' '+(y+h)+
           ' L'+(x+r)+' '+(y+h)+' Q'+x+' '+(y+h)+' '+x+' '+(y+h-r)+
           ' L'+x+' '+(y+r)+' Q'+x+' '+y+' '+(x+r)+' '+y+' Z';
  }

  global.Geo = Geo;
  global.FONTS = FONTS;
  global.LABEL_PRESETS = LABEL_PRESETS;
  global.Cv = Cv;
})(window);
