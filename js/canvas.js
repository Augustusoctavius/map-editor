/* ============================================================
   Cartographer — canvas.js
   Görünüm yönetimi (zoom / pan), tam harita render'ı, minimap,
   nehir / yol / etiket çizim rutinleri.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- geometri yardımcıları ---------------- */
  var Geo = {
    /* Catmull-Rom örnekleme: pts=[[x,y],...] -> düzleştirilmiş nokta dizisi */
    sample: function (pts, perSeg) {
      if (!pts || pts.length < 2) return (pts || []).slice();
      if (pts.length === 2) {
        var out = [], n = perSeg || 16;
        for (var k = 0; k <= n; k++) {
          var t = k / n;
          out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t]);
        }
        return out;
      }
      var res = [], n2 = perSeg || 16;
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
        for (var j = 0; j < n2; j++) {
          var s = j / n2, s2 = s * s, s3 = s2 * s;
          var x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * s +
                  (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 +
                  (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3);
          var y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * s +
                  (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 +
                  (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3);
          res.push([x, y]);
        }
      }
      res.push(pts[pts.length - 1].slice());
      return res;
    },

    /* meander: örneklenmiş yolu normal boyunca sinüsle kaydır */
    meander: function (pts, amount, wavelength) {
      if (!amount) return pts;
      var out = [], acc = 0;
      for (var i = 0; i < pts.length; i++) {
        var prev = pts[i - 1] || pts[i], next = pts[i + 1] || pts[i];
        var dx = next[0] - prev[0], dy = next[1] - prev[1];
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len, ny = dx / len;
        if (i > 0) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        var w = wavelength || 140;
        var o = Math.sin(acc / w * Math.PI * 2) * amount + Math.sin(acc / (w * 0.37) * Math.PI * 2) * amount * 0.35;
        out.push([pts[i][0] + nx * o, pts[i][1] + ny * o]);
      }
      return out;
    },

    length: function (pts) {
      var L = 0;
      for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      return L;
    },

    /* değişken kalınlıklı poligon (nehir) */
    ribbon: function (pts, wStart, wEnd) {
      var left = [], right = [], n = pts.length;
      for (var i = 0; i < n; i++) {
        var prev = pts[i - 1] || pts[i], next = pts[i + 1] || pts[i];
        var dx = next[0] - prev[0], dy = next[1] - prev[1];
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len, ny = dx / len;
        var t = n > 1 ? i / (n - 1) : 1;
        var hw = (wStart + (wEnd - wStart) * t) / 2;
        left.push([pts[i][0] + nx * hw, pts[i][1] + ny * hw]);
        right.push([pts[i][0] - nx * hw, pts[i][1] - ny * hw]);
      }
      return left.concat(right.reverse());
    },

    distToPolyline: function (px, py, pts) {
      var best = Infinity;
      for (var i = 1; i < pts.length; i++) {
        var x1 = pts[i - 1][0], y1 = pts[i - 1][1], x2 = pts[i][0], y2 = pts[i][1];
        var dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
        var t = L2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L2)) : 0;
        var d = Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
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

  /* ---------------- yazı tipleri ---------------- */
  var FONTS = {
    fantasy: '"Papyrus","Luminari","Trattatello",fantasy',
    serif: 'Georgia,"Iowan Old Style","Times New Roman",serif',
    sans: '"Segoe UI",Helvetica,Arial,sans-serif',
    mono: '"SFMono-Regular",Consolas,monospace'
  };

  /* ---------------- doku üreticileri ---------------- */
  var oceanTile = null, parchTile = null;

  function ctxPattern(ctx, tile) {
    return ctx.createPattern(tile, 'repeat');
  }

  function makeOceanTile() {
    var S = 128, c = document.createElement('canvas');
    c.width = c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = '#9cc0cf';
    x.fillRect(0, 0, S, S);
    x.strokeStyle = 'rgba(90,140,160,0.45)';
    x.lineWidth = 1.2;
    for (var i = 0; i < 4; i++) {
      var y = 18 + i * 32;
      x.beginPath();
      x.moveTo(-4, y);
      for (var k = 0; k <= S + 8; k += 16) x.quadraticCurveTo(k + 4, y - 5, k + 8, y);
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
      d[i] += n; d[i + 1] += n * 0.9; d[i + 2] += n * 0.7;
    }
    x.putImageData(img, 0, 0);
    x.globalAlpha = 0.16;
    x.strokeStyle = '#7a6338';
    for (var k = 0; k < 26; k++) {
      x.lineWidth = Math.random() * 2 + 0.4;
      x.beginPath();
      var sx = Math.random() * S, sy = Math.random() * S;
      x.moveTo(sx, sy);
      x.bezierCurveTo(sx + 40, sy + 20, sx + 10, sy + 60, sx + 60, sy + 80);
      x.stroke();
    }
    x.globalAlpha = 1;
    return c;
  }

  /* ---------------- Cv ---------------- */
  var Cv = {
    W: 2048, H: 2048,
    zoom: 1, panX: 0, panY: 0,
    dpr: 1,
    view: null, ctx: null,
    mini: null, mctx: null,
    grid: false, gridSize: 128,
    parchment: false,
    mouse: { x: 0, y: 0, over: false },
    _raf: 0, _miniAt: 0,

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
      this.fit();
    },

    fit: function () {
      var s = Math.min(this.vw / this.W, this.vh / this.H) * 0.92;
      this.zoom = s;
      this.panX = (this.vw - this.W * s) / 2;
      this.panY = (this.vh - this.H * s) / 2;
      this.requestRender();
    },

    setZoom: function (z, cx, cy) {
      z = Math.max(0.1, Math.min(4, z));
      if (cx === undefined) { cx = this.vw / 2; cy = this.vh / 2; }
      var mx = (cx - this.panX) / this.zoom, my = (cy - this.panY) / this.zoom;
      this.zoom = z;
      this.panX = cx - mx * z;
      this.panY = cy - my * z;
      this.requestRender();
      if (global.UI) UI.status();
    },

    screenToMap: function (sx, sy) { return { x: (sx - this.panX) / this.zoom, y: (sy - this.panY) / this.zoom }; },
    mapToScreen: function (mx, my) { return { x: mx * this.zoom + this.panX, y: my * this.zoom + this.panY }; },

    requestRender: function () {
      var self = this;
      if (this._raf) return;
      this._raf = requestAnimationFrame(function () { self._raf = 0; self.render(); });
    },

    /* ---------- ana render ---------- */
    render: function () {
      var ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.view.width, this.view.height);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      /* harita gölgesi */
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 30 / this.zoom;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.restore();

      this.renderMap(ctx, { includeReference: true, forExport: false });

      /* kenarlık */
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1 / this.zoom;
      ctx.strokeRect(0, 0, this.W, this.H);

      /* ızgara */
      if (this.grid) this.drawGrid(ctx);

      /* aktif çizim önizlemesi + seçim */
      if (global.Tools) Tools.drawOverlay(ctx);

      ctx.restore();

      /* fırça imleci (ekran uzayında) */
      this.drawCursor(ctx);

      /* minimap kısıtlı sıklıkta */
      var now = performance.now();
      if (now - this._miniAt > 180) { this._miniAt = now; this.renderMini(); }
      if (global.UI) UI.status();
    },

    /* ---------- tam harita (view / minimap / export ortak) ---------- */
    renderMap: function (ctx, opt) {
      opt = opt || {};
      var W = this.W, H = this.H;

      /* okyanus */
      ctx.save();
      var op = ctxPattern(ctx, oceanTile);
      ctx.fillStyle = op || '#9cc0cf';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

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
          for (var j = 0; j < l.objects.length; j++) {
            var o = l.objects[j];
            if (l.id === 'rivers') this.drawRiver(ctx, o);
            else if (l.id === 'roads') this.drawRoad(ctx, o);
            else if (l.id === 'symbols') Sym.draw(ctx, o.sym, o, function(){ Cv.requestRender(); });
            else if (l.id === 'labels') this.drawLabel(ctx, o);
          }
          ctx.restore();
          continue;
        }

        if (l.type === 'overlay') {
          if (this.parchment) {
            ctx.save();
            ctx.globalAlpha = 0.55 * l.opacity;
            ctx.globalCompositeOperation = 'multiply';
            var pp = ctxPattern(ctx, parchTile);
            ctx.fillStyle = pp || 'rgba(217,199,154,0.5)';
            ctx.fillRect(0, 0, W, H);
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = 0.35 * l.opacity;
            var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(60,40,15,0.75)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
          }
        }
      }
    },

    /* ---------- nehir ---------- */
    riverGeometry: function (o) {
      var pts = Geo.sample(o.pts, 18);
      pts = Geo.meander(pts, (o.meander || 0) * (o.width || 12) * 1.6, (o.width || 12) * 9);
      return pts;
    },

    drawRiver: function (ctx, o) {
      if (!o.pts || o.pts.length < 2) return;
      var pts = this.riverGeometry(o);
      var wEnd = o.width || 12;
      var wStart = o.taper ? Math.max(1.2, wEnd * 0.18) : wEnd;
      var poly = Geo.ribbon(pts, wStart, wEnd);
      ctx.save();
      ctx.globalAlpha *= (o.opacity === undefined ? 1 : o.opacity);
      var path = Geo.polyPath(poly);
      path.closePath();
      ctx.fillStyle = o.color || '#5b8aa6';
      ctx.fill(path);
      ctx.strokeStyle = Sym.shift(o.color || '#5b8aa6', 0);
      ctx.globalAlpha *= 0.55;
      ctx.lineWidth = Math.max(0.7, wEnd * 0.09);
      ctx.lineJoin = 'round';
      ctx.stroke(path);
      ctx.restore();
    },

    /* ---------- yol ---------- */
    roadGeometry: function (o) { return Geo.sample(o.pts, 14); },

    drawRoad: function (ctx, o) {
      if (!o.pts || o.pts.length < 2) return;
      var pts = this.roadGeometry(o);
      var path = Geo.polyPath(pts);
      var w = o.width || 5;
      ctx.save();
      ctx.globalAlpha *= (o.opacity === undefined ? 1 : o.opacity);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.color || '#6b4f2a';

      if (o.style === 'dashed') {
        ctx.setLineDash([w * 2.6, w * 2.0]);
        ctx.lineWidth = w;
        ctx.stroke(path);
      } else if (o.style === 'dotted') {
        ctx.setLineDash([w * 0.35, w * 2.1]);
        ctx.lineWidth = w;
        ctx.stroke(path);
      } else if (o.style === 'double') {
        ctx.setLineDash([]);
        ctx.lineWidth = w * 1.9;
        ctx.stroke(path);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = w * 0.7;
        ctx.stroke(path);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.setLineDash([]);
        ctx.lineWidth = w;
        ctx.stroke(path);
      }
      ctx.setLineDash([]);
      ctx.restore();
    },

    /* ---------- etiket ---------- */
    labelFont: function (o) {
      return '600 ' + (o.size || 32) + 'px ' + (FONTS[o.font] || FONTS.serif);
    },

    measureLabel: function (ctx, o) {
      ctx.save();
      ctx.font = this.labelFont(o);
      var tr = o.track || 0, w = 0, t = o.text || '';
      for (var i = 0; i < t.length; i++) w += ctx.measureText(t[i]).width + tr;
      ctx.restore();
      return w;
    },

    drawLabel: function (ctx, o) {
      var text = o.text || '';
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
      if (o.rot) ctx.rotate(o.rot * Math.PI / 180);

      if (o.shadow) {
        ctx.shadowColor = 'rgba(40,25,5,0.45)';
        ctx.shadowBlur = Math.max(2, (o.size || 32) * 0.12);
        ctx.shadowOffsetY = Math.max(1, (o.size || 32) * 0.05);
      }

      var arc = (o.curve || 0) * Math.PI / 180;
      var self = this;

      function paint(ch, cx) {
        if (o.outline) {
          ctx.strokeStyle = o.outlineColor || '#f5ecd8';
          ctx.lineWidth = Math.max(1.5, (o.size || 32) * 0.16);
          ctx.strokeText(ch, cx, 0);
        }
        ctx.fillStyle = o.color || '#3a2b18';
        ctx.fillText(ch, cx, 0);
      }

      if (!arc || Math.abs(arc) < 0.01) {
        var x = -total / 2, tr = o.track || 0;
        for (var i = 0; i < text.length; i++) {
          var cw = ctx.measureText(text[i]).width;
          paint(text[i], x + cw / 2);
          x += cw + tr;
        }
      } else {
        var R = total / arc;
        var sign = R < 0 ? -1 : 1;
        ctx.translate(0, R);
        var a = -arc / 2;
        var tr2 = o.track || 0;
        for (var j = 0; j < text.length; j++) {
          var w2 = ctx.measureText(text[j]).width + tr2;
          var mid = a + (w2 / 2) / R;
          ctx.save();
          ctx.rotate(mid);
          ctx.translate(0, -R);
          ctx.rotate(sign > 0 ? 0 : Math.PI);
          paint(text[j], 0);
          ctx.restore();
          a += w2 / R;
        }
      }
      ctx.restore();
    },

    labelBounds: function (o) {
      var ctx = this.ctx;
      var w = this.measureLabel(ctx, o);
      var h = (o.size || 32) * 1.25;
      var extra = Math.abs(o.curve || 0) * (o.size || 32) * 0.01 * 8;
      return { x: o.x - w / 2, y: o.y - h / 2 - extra / 2, w: w, h: h + extra };
    },

    /* ---------- ızgara ---------- */
    drawGrid: function (ctx) {
      var g = this.gridSize;
      ctx.save();
      ctx.strokeStyle = 'rgba(30,40,30,0.28)';
      ctx.lineWidth = 1 / this.zoom;
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
      if (t === 'landmass' || t === 'erase') r = App.brush.size / 2;
      else if (t === 'terrain') r = App.terrain.size / 2;
      else if (t === 'symbol') r = App.symbol.size / 2;
      if (!r) return;
      var s = this.mapToScreen(this.mouse.x, this.mouse.y);
      ctx.save();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * this.zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * this.zoom + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },

    /* ---------- minimap ---------- */
    renderMini: function () {
      var m = this.mctx, S = this.mini.width;
      var s = S / Math.max(this.W, this.H);
      m.setTransform(1, 0, 0, 1, 0, 0);
      m.clearRect(0, 0, S, S);
      m.save();
      m.scale(s, s);
      this.renderMap(m, { includeReference: false });
      m.restore();

      /* görünüm dikdörtgeni */
      var tl = this.screenToMap(0, 0), br = this.screenToMap(this.vw, this.vh);
      m.strokeStyle = '#c99a4b';
      m.lineWidth = 1.5;
      m.strokeRect(tl.x * s, tl.y * s, (br.x - tl.x) * s, (br.y - tl.y) * s);
    },

    centerOn: function (mx, my) {
      this.panX = this.vw / 2 - mx * this.zoom;
      this.panY = this.vh / 2 - my * this.zoom;
      this.requestRender();
    }
  };

  global.Geo = Geo;
  global.FONTS = FONTS;
  global.Cv = Cv;
})(window);
