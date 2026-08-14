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
    shore:true, shoreWidth:26,
    mouse:{x:0,y:0,over:false},
    _raf:0, _miniAt:0,
    shoreCanvas:null, shoreDirty:true,

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
        this.shoreWidth, this.W, this.H
      );
      this.shoreCanvas = result.canvas;
      this._shoreScW   = result.sw;
      this._shoreScH   = result.sh;
      this.shoreDirty  = false;
      return result.canvas;
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

      for (var i = 0; i < Layers.list.length; i++) {
        var l = Layers.list[i];
        if (!l.visible) continue;

        if (l.id === 'reference') {
          if (!opt.includeReference || !l.image) continue;
          ctx.save();
          ctx.globalAlpha = l.opacity;
          ctx.drawImage(l.image, 0, 0, W, H);
          ctx.restore();
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
            /* 1. pass: nehirler — göl hariç */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind !== 'lake') self_.drawRiver(ctx, l.objects[j]);
            }
            /* 2. pass: göller nehirlerin üstüne çizilir.
               Böylece nehir göl içinden geçerse göl rengiyle örtülür,
               sadece gölden çıkan uç kısmı nehir rengiyle görünür.     */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind === 'lake') self_.drawLake(ctx, l.objects[j]);
            }
          } else {
            for (var j = 0; j < l.objects.length; j++) {
              var o = l.objects[j];
              if (l.id === 'roads') this.drawRoad(ctx, o);
              else if (l.id === 'symbols') {
                if (o.kind === 'group') {
                  o.members.forEach(function(m){ Sym.draw(ctx, m.sym, m, function(){ Cv.requestRender(); }); });
                } else {
                  Sym.draw(ctx, o.sym, o, function(){ Cv.requestRender(); });
                }
              }
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
      var pts = Geo.sample(o.pts, 18);
      return Geo.meander(pts, (o.meander||0)*(o.width||12)*1.6, (o.width||12)*9);
    },

    drawRiver: function (ctx, o) {
      if (!o.pts || o.pts.length < 2) return;
      var pts = this.riverGeometry(o);
      var wEnd = o.width || 12;
      var wStart = o.taper ? Math.max(1.2, wEnd*0.18) : wEnd;
      var poly = Geo.ribbon(pts, wStart, wEnd);
      ctx.save();
      ctx.globalAlpha *= (o.opacity === undefined ? 1 : o.opacity);
      var path = Geo.polyPath(poly);
      path.closePath();
      ctx.fillStyle = o.color || '#5b8aa6';
      ctx.fill(path);
      ctx.strokeStyle = o.color || '#5b8aa6';
      ctx.globalAlpha *= 0.55;
      ctx.lineWidth = Math.max(0.7, wEnd*0.09);
      ctx.lineJoin = 'round';
      ctx.stroke(path);
      ctx.restore();
    },

    /* ---------- göl ---------- */
    drawLake: function (ctx, o) {
      if (!o.pts || o.pts.length < 3) return;
      var pts = Geo.sample(o.pts, 22);
      var col = o.color || '#5b8aa6';

      /* merkez */
      var cx = 0, cy = 0;
      for (var k = 0; k < pts.length; k++) { cx += pts[k][0]; cy += pts[k][1]; }
      cx /= pts.length; cy /= pts.length;

      function makePath() {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
      }

      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      /* --- terrain'den kıyı rengi örnekle --- */
      var shoreCol = 'rgba(195,178,140,0.80)'; /* varsayılan kum */
      var tLayer = global.Layers && Layers.get('terrain');
      if (tLayer && tLayer.canvas) {
        try {
          var tc = document.createElement('canvas'); tc.width=1; tc.height=1;
          var tx = tc.getContext('2d');
          /* gölün kenarından 30px dışarı örnekle */
          var sampleX = Math.round(pts[0][0]), sampleY = Math.round(pts[0][1]);
          tx.drawImage(tLayer.canvas, sampleX-1, sampleY-1, 3, 3, 0, 0, 1, 1);
          var px = tx.getImageData(0,0,1,1).data;
          if (px[3] > 20) {
            /* terrain var — rengini biraz açarak kıyı tonu yap */
            var lr = Math.min(255, px[0]+55), lg = Math.min(255, px[1]+45), lb = Math.min(255, px[2]+35);
            shoreCol = 'rgba('+lr+','+lg+','+lb+',0.85)';
          }
        } catch(e) {}
      }

      /* --- DIŞ kıyı bandı (göl sınırının dışında) --- */
      var shoreW = 22;
      ctx.lineWidth = shoreW * 2;
      ctx.strokeStyle = shoreCol;
      makePath();
      ctx.stroke();

      /* --- ana dolgu: tam opak --- */
      ctx.globalAlpha = 0.97;
      ctx.fillStyle = col;
      makePath();
      ctx.fill();

      /* --- derinlik gradient'i (içte, clip ile) --- */
      ctx.save();
      makePath(); ctx.clip();
      var maxR = 0;
      for (var j=0; j<pts.length; j++) {
        var d = Math.hypot(pts[j][0]-cx, pts[j][1]-cy);
        if (d > maxR) maxR = d;
      }
      var dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      dg.addColorStop(0,   'rgba(0,0,0,0.22)');
      dg.addColorStop(0.6, 'rgba(0,0,0,0.06)');
      dg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = dg;
      ctx.fillRect(cx-maxR-10, cy-maxR-10, (maxR+10)*2, (maxR+10)*2);
      ctx.restore();

      /* --- iç kıyı şeridi (göl içinde, sığ su tonu) --- */
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = shoreCol;
      ctx.lineWidth = 8;
      makePath();
      ctx.stroke();

      /* --- dış kenar ince çizgi --- */
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      makePath();
      ctx.stroke();

      ctx.restore();
    },

    lakeGeometry: function (o) { return Geo.sample(o.pts, 16); },

    /* ---------- windrose ---------- */
    windroseSize: function (wr) { return wr.size || 120; },

    windroseBounds: function (wr) {
      var r = this.windroseSize(wr) * 0.6;
      return { x: wr.x - r, y: wr.y - r, w: r*2, h: r*2 };
    },

    drawWindrose: function (ctx, wr) {
      var x = wr.x, y = wr.y, R = this.windroseSize(wr);
      var col = wr.color || '#3a2b18';
      var style = wr.style || 'classic';
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

    /* ---------- yol ---------- */
    roadGeometry: function (o) { return Geo.sample(o.pts, 14); },

    drawRoad: function (ctx, o) {
      if (!o.pts || o.pts.length < 2) return;
      var pts = this.roadGeometry(o);
      var path = Geo.polyPath(pts);
      var w = o.width || 5;
      var col = o.color || '#6b4f2a';
      ctx.save();
      ctx.globalAlpha *= (o.opacity === undefined ? 1 : o.opacity);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      /* --- alt gölge şeridi: yolun orada olduğu belli olsun --- */
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = w * 2.8;
      ctx.stroke(path);

      /* --- terrain zemin tonu (yol altı kazılmış görünüm) --- */
      ctx.strokeStyle = 'rgba(210,185,140,0.55)';
      ctx.lineWidth = w * 1.9;
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
