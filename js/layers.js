/* ============================================================
   Cartographer — layers.js  v3
   Katman sistemi + PROSEDÜREL arazi işaretleri.
   Artık repeat-pattern (clone stamp) YOK: her fırça vuruşunda
   işaretler rastgele konum/açı/ölçek ile serpilir.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------
     ARAZİ MALZEMELERİ
     base   : zemin rengi
     mark   : ana işaret rengi
     mark2  : ikincil işaret rengi
     kind   : işaret üreteci
     density: işaret yoğunluğu çarpanı
     --------------------------------------------------------- */
  var TERRAIN = {
    steppe:   { tr:'Bozkır',   en:'Steppe',    base:'#d9c98c', mark:'#a68f55', mark2:'#c2ae74', kind:'tuft',    density:1.00 },
    grass:    { tr:'Çayır',    en:'Grassland', base:'#c3ce8e', mark:'#7f9550', mark2:'#a3b46e', kind:'tuft',    density:1.15 },
    forest:   { tr:'Orman',    en:'Forest',    base:'#7e9c63', mark:'#3f5c2c', mark2:'#5b7a41', kind:'canopy',  density:1.10 },
    taiga:    { tr:'Tayga',    en:'Taiga',     base:'#6f8a68', mark:'#2f4a30', mark2:'#4a6544', kind:'conifer', density:1.00 },
    mountain: { tr:'Dağlık',   en:'Mountain',  base:'#b6a894', mark:'#7d6d57', mark2:'#9a8a72', kind:'chevron', density:0.85 },
    farmland: { tr:'Ova',      en:'Farmland',  base:'#e0d698', mark:'#b8a660', mark2:'#cbbd7c', kind:'field',   density:0.70 },
    swamp:    { tr:'Bataklık', en:'Swamp',     base:'#89986f', mark:'#54633c', mark2:'#6b7c52', kind:'reed',    density:1.05 },
    snow:     { tr:'Kar',      en:'Snow',      base:'#e9eff3', mark:'#b9cad6', mark2:'#d2dee6', kind:'flake',   density:0.75 },
    desert:   { tr:'Çöl',      en:'Desert',    base:'#e7d29e', mark:'#c4a870', mark2:'#d6c089', kind:'dune',    density:0.60 },
    tundra:   { tr:'Tundra',   en:'Tundra',    base:'#c3c9b4', mark:'#8e9880', mark2:'#a8b09a', kind:'tundra',  density:0.85 },
    volcanic: { tr:'Volkanik', en:'Volcanic',  base:'#8b7a74', mark:'#4e403c', mark2:'#6a5a55', kind:'crack',   density:0.90 },
    badlands: { tr:'Kayalık',  en:'Badlands',  base:'#c39a76', mark:'#8a6446', mark2:'#a87e5c', kind:'rock',    density:0.90 }
  };

  /* ---------------------------------------------------------
     TEK İŞARET ÇİZİCİ
     Birim uzayda (~ -7..7) çizer; çağıran ölçekler/döndürür.
     --------------------------------------------------------- */
  function mark(ctx, kind, R) {
    switch (kind) {

      case 'tuft':                       /* ot tutamı */
        ctx.beginPath();
        ctx.moveTo(-3, 3); ctx.quadraticCurveTo(-2.4, -1, -3.6, -4);
        ctx.moveTo(0, 3.4); ctx.quadraticCurveTo(0.4, -1.4, -0.4, -5);
        ctx.moveTo(3, 3); ctx.quadraticCurveTo(2.6, -1, 3.8, -4);
        ctx.stroke();
        break;

      case 'canopy':                     /* yaprak kubbesi */
        ctx.beginPath();
        ctx.arc(0, 1, 4.2, Math.PI * 1.06, Math.PI * 1.94);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-2.2, 1.6, 2.4, Math.PI * 1.05, Math.PI * 1.95);
        ctx.moveTo(4.6, 1.6);
        ctx.arc(2.2, 1.6, 2.4, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
        break;

      case 'conifer':                    /* iğne yapraklı */
        ctx.beginPath();
        ctx.moveTo(0, -5.5); ctx.lineTo(-3, 2.5); ctx.lineTo(3, 2.5); ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 2.5); ctx.lineTo(0, 4.6);
        ctx.stroke();
        break;

      case 'chevron':                    /* dağ sırtı */
        ctx.beginPath();
        ctx.moveTo(-4.6, 3); ctx.lineTo(0, -3.4); ctx.lineTo(4.6, 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-2.4, 3.4); ctx.lineTo(0, 0.2); ctx.lineTo(2.4, 3.4);
        ctx.stroke();
        break;

      case 'field':                      /* tarla parseli */
        ctx.beginPath();
        ctx.rect(-5, -3.4, 10, 6.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-2.2, -3.4); ctx.lineTo(-2.2, 3.4);
        ctx.moveTo(1.2, -3.4); ctx.lineTo(1.2, 3.4);
        ctx.stroke();
        break;

      case 'reed':                       /* saz / kamış */
        ctx.beginPath();
        ctx.moveTo(-2.6, 4); ctx.lineTo(-2.6, -2.6);
        ctx.moveTo(0.4, 4.4); ctx.lineTo(0.4, -4);
        ctx.moveTo(3.2, 4); ctx.lineTo(3.2, -1.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0.4, 5.2, 3.2, Math.PI * 0.08, Math.PI * 0.92);
        ctx.stroke();
        break;

      case 'flake':                      /* kar */
        ctx.beginPath();
        ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
        ctx.moveTo(0, -3); ctx.lineTo(0, 3);
        ctx.moveTo(-2.1, -2.1); ctx.lineTo(2.1, 2.1);
        ctx.moveTo(2.1, -2.1); ctx.lineTo(-2.1, 2.1);
        ctx.stroke();
        break;

      case 'dune':                       /* kum tepesi */
        ctx.beginPath();
        ctx.moveTo(-6.5, 1.6);
        ctx.quadraticCurveTo(-2.6, -2.6, 0.6, 0.6);
        ctx.quadraticCurveTo(3.6, 3.4, 6.5, 0);
        ctx.stroke();
        break;

      case 'tundra':                     /* seyrek ot + çakıl */
        ctx.beginPath();
        ctx.moveTo(-2.4, 2.6); ctx.lineTo(-1.6, -1.6);
        ctx.moveTo(0.6, 3); ctx.lineTo(1.2, -1);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(3.2, 2.6, 1.9, 1.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'crack':                      /* volkanik çatlak */
        ctx.beginPath();
        ctx.moveTo(-5.4, -2); ctx.lineTo(-1.4, 0.6);
        ctx.lineTo(1.2, -1.4); ctx.lineTo(5, 1.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-1.4, 0.6); ctx.lineTo(-2.4, 3.6);
        ctx.stroke();
        break;

      case 'rock':                       /* kaya kümesi */
        ctx.beginPath();
        ctx.moveTo(-4.6, 3); ctx.lineTo(-2.6, -1.4); ctx.lineTo(-0.4, 1.2);
        ctx.lineTo(1.6, -2.6); ctx.lineTo(4.6, 3);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  /* ---------------------------------------------------------
     RASTGELE SERPME — ana boyama fonksiyonu
     Tools.stamp() bunu çağırır. Hiç tile/pattern kullanılmaz.
     --------------------------------------------------------- */
  function scatter(ctx, key, cx, cy, radius, opacity, seedJitter) {
    var t = TERRAIN[key];
    if (!t) return;
    var R = radius;

    /* --- yumuşak kenarlı zemin --- */
    ctx.save();
    var g = ctx.createRadialGradient(cx, cy, R * 0.30, cx, cy, R);
    g.addColorStop(0.00, t.base);
    g.addColorStop(0.62, t.base);
    g.addColorStop(1.00, hexA(t.base, 0));
    ctx.globalAlpha = opacity;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* --- serpilmiş işaretler --- */
    var n = Math.round(R * 0.17 * (t.density || 1));
    n = Math.max(2, Math.min(46, n));
    var unit = Math.max(3, R * 0.115);          /* işaret temel boyu */

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (var i = 0; i < n; i++) {
      /* alan-üniform rastgele konum, merkeze hafif ağırlıklı */
      var a = Math.random() * Math.PI * 2;
      var rr = Math.sqrt(Math.random()) * R * 0.94;
      var mx = cx + Math.cos(a) * rr;
      var my = cy + Math.sin(a) * rr;

      /* kenara yaklaştıkça soluklaş */
      var edge = 1 - Math.pow(rr / R, 2.2);
      var alpha = opacity * (0.42 + Math.random() * 0.48) * edge;
      if (alpha < 0.03) continue;

      var sc = unit / 6 * (0.68 + Math.random() * 0.78);
      var rot = (Math.random() - 0.5) * (t.kind === 'field' ? 0.5 : 0.85);
      if (t.kind === 'dune' || t.kind === 'chevron') rot *= 0.35;

      var col = Math.random() < 0.5 ? t.mark : t.mark2;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(mx, my);
      ctx.rotate(rot);
      ctx.scale(sc, sc);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = Math.max(0.5, 1.5 / Math.max(0.35, sc));
      mark(ctx, t.kind, R);
      ctx.restore();
    }
    ctx.restore();
  }

  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }

  /* ---------------------------------------------------------
     PALET ÖNİZLEME — sol paneldeki küçük kareler
     --------------------------------------------------------- */
  var swatchCache = {};
  function swatch(key, w, h) {
    var ck = key + '|' + w + 'x' + h;
    if (swatchCache[ck]) return swatchCache[ck];
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    var t = TERRAIN[key];
    x.fillStyle = t.base;
    x.fillRect(0, 0, w, h);
    x.lineCap = 'round'; x.lineJoin = 'round';
    var n = Math.round(w * h / 190 * (t.density || 1));
    for (var i = 0; i < n; i++) {
      var mx = Math.random() * w, my = Math.random() * h;
      var sc = 0.44 * (0.7 + Math.random() * 0.7);
      x.save();
      x.globalAlpha = 0.45 + Math.random() * 0.45;
      x.translate(mx, my);
      x.rotate((Math.random() - 0.5) * 0.7);
      x.scale(sc, sc);
      x.strokeStyle = Math.random() < 0.5 ? t.mark : t.mark2;
      x.fillStyle = x.strokeStyle;
      x.lineWidth = 1.6 / sc;
      mark(x, t.kind, 20);
      x.restore();
    }
    swatchCache[ck] = c;
    return c;
  }

  global.Terrain = { TERRAIN: TERRAIN, scatter: scatter, swatch: swatch, mark: mark };

  /* =========================================================
     KATMANLAR
     ========================================================= */
  var DEFS = [
    { id:'reference', type:'image',  tr:'Referans görsel', en:'Reference image', opacity:0.5, visible:true },
    { id:'landmass',  type:'raster', tr:'Kara',            en:'Landmass',        opacity:1,   visible:true },
    { id:'terrain',   type:'raster', tr:'Arazi',           en:'Terrain',         opacity:1,   visible:true },
    { id:'rivers',    type:'vector', tr:'Nehirler',        en:'Rivers',          opacity:1,   visible:true },
    { id:'roads',     type:'vector', tr:'Yollar',          en:'Roads',           opacity:1,   visible:true },
    { id:'symbols',   type:'vector', tr:'Semboller',       en:'Symbols',         opacity:1,   visible:true },
    { id:'labels',    type:'vector', tr:'Etiketler',       en:'Labels',          opacity:1,   visible:true },
    { id:'overlay',   type:'overlay',tr:'Kaplama',         en:'Overlay',         opacity:1,   visible:true }
  ];

  var Layers = {
    list: [],
    active: 'landmass',

    init: function (w, h) {
      this.list = DEFS.map(function (d) {
        var l = {
          id:d.id, type:d.type, tr:d.tr, en:d.en,
          visible:d.visible, locked:false, opacity:d.opacity,
          canvas:null, ctx:null, objects:[], image:null, imageData:null
        };
        if (d.type === 'raster') {
          l.canvas = document.createElement('canvas');
          l.canvas.width = w; l.canvas.height = h;
          l.ctx = l.canvas.getContext('2d');
        }
        return l;
      });
    },

    resize: function (w, h, keep) {
      this.list.forEach(function (l) {
        if (l.type !== 'raster') return;
        var old = l.canvas;
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var x = c.getContext('2d');
        if (keep && old.width) x.drawImage(old, 0, 0, old.width, old.height, 0, 0, w, h);
        l.canvas = c; l.ctx = x;
      });
    },

    get: function (id) {
      for (var i = 0; i < this.list.length; i++) if (this.list[i].id === id) return this.list[i];
      return null;
    },

    indexOf: function (id) {
      for (var i = 0; i < this.list.length; i++) if (this.list[i].id === id) return i;
      return -1;
    },

    move: function (fromIdx, toIdx) {
      if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
      var item = this.list.splice(fromIdx, 1)[0];
      this.list.splice(toIdx, 0, item);
    },

    name: function (l, lang) { return lang === 'en' ? l.en : l.tr; },

    clearRaster: function (id) {
      var l = this.get(id);
      if (l && l.ctx) l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
    },

    meta: function () {
      return this.list.map(function (l) {
        return { id:l.id, visible:l.visible, locked:l.locked, opacity:l.opacity };
      });
    },

    applyMeta: function (m) {
      var self = this, ordered = [];
      m.forEach(function (e) {
        var l = self.get(e.id);
        if (!l) return;
        l.visible = e.visible; l.locked = e.locked; l.opacity = e.opacity;
        ordered.push(l);
      });
      if (ordered.length === this.list.length) this.list = ordered;
    },

    serialize: function (includeRefImage) {
      return this.list.map(function (l) {
        var o = { id:l.id, type:l.type, visible:l.visible, locked:l.locked, opacity:l.opacity };
        if (l.type === 'raster') o.data = l.canvas.toDataURL('image/png');
        if (l.type === 'vector') o.objects = l.objects;
        if (l.type === 'image' && l.imageData && includeRefImage !== false) o.data = l.imageData;
        return o;
      });
    },

    deserialize: function (arr) {
      var self = this, jobs = [], ordered = [];
      arr.forEach(function (e) {
        var l = self.get(e.id);
        if (!l) return;
        l.visible = e.visible; l.locked = e.locked; l.opacity = e.opacity;
        if (l.type === 'vector') l.objects = e.objects || [];
        if (l.type === 'raster') {
          l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
          if (e.data) {
            jobs.push(new Promise(function (res) {
              var im = new Image();
              im.onload = function () { l.ctx.drawImage(im, 0, 0); res(); };
              im.onerror = function () { res(); };
              im.src = e.data;
            }));
          }
        }
        if (l.type === 'image') {
          if (e.data) {
            jobs.push(new Promise(function (res) {
              var im = new Image();
              im.onload = function () { l.image = im; l.imageData = e.data; res(); };
              im.onerror = function () { res(); };
              im.src = e.data;
            }));
          } else { l.image = null; l.imageData = null; }
        }
        ordered.push(l);
      });
      if (ordered.length === this.list.length) this.list = ordered;
      return Promise.all(jobs);
    }
  };

  global.Layers = Layers;
})(window);
