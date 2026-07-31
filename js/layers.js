/* ============================================================
   Cartographer — layers.js
   Katman sistemi + arazi malzemeleri (prosedürel doku pattern'leri)
   Dizi sırası = çizim sırası (0 = en alt)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------
     ARAZİ MALZEMELERİ
     --------------------------------------------------------- */
  var TERRAIN = {
    steppe:   { tr: 'Bozkır',   en: 'Steppe',   base: '#d8c98d', mark: '#b8a566', kind: 'tuft' },
    forest:   { tr: 'Orman',    en: 'Forest',   base: '#7f9c66', mark: '#4f6b40', kind: 'canopy' },
    mountain: { tr: 'Dağlık',   en: 'Mountain', base: '#b6a894', mark: '#8b7c66', kind: 'chevron' },
    farmland: { tr: 'Ova',      en: 'Farmland', base: '#e2d79a', mark: '#c1b36c', kind: 'field' },
    swamp:    { tr: 'Bataklık', en: 'Swamp',    base: '#8b9a72', mark: '#5f6d4c', kind: 'reed' },
    snow:     { tr: 'Kar',      en: 'Snow',     base: '#e9eff3', mark: '#c3d2dc', kind: 'flake' },
    desert:   { tr: 'Çöl',      en: 'Desert',   base: '#e8d3a0', mark: '#cbb079', kind: 'dune' },
    tundra:   { tr: 'Tundra',   en: 'Tundra',   base: '#c3c9b4', mark: '#9aa389', kind: 'tuft' },
    volcanic: { tr: 'Volkanik', en: 'Volcanic', base: '#8e7d78', mark: '#5b4c48', kind: 'chevron' }
  };

  var patternCache = {};

  function buildTile(key) {
    var t = TERRAIN[key];
    var S = 48;
    var c = document.createElement('canvas');
    c.width = c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = t.base;
    x.fillRect(0, 0, S, S);
    x.strokeStyle = t.mark;
    x.fillStyle = t.mark;
    x.lineWidth = 1.4;
    x.lineCap = 'round';

    var i;
    switch (t.kind) {
      case 'tuft':
        for (i = 0; i < 7; i++) {
          var tx = (i * 17 % S), ty = (i * 29 % S);
          x.beginPath();
          x.moveTo(tx, ty + 5); x.lineTo(tx + 2, ty);
          x.moveTo(tx + 3, ty + 5); x.lineTo(tx + 4, ty + 1);
          x.moveTo(tx + 6, ty + 5); x.lineTo(tx + 7, ty);
          x.stroke();
        }
        break;
      case 'canopy':
        for (i = 0; i < 9; i++) {
          var cx = (i * 19 % S), cy = (i * 13 % S), r = 3 + (i % 3);
          x.beginPath(); x.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 0.95); x.stroke();
        }
        break;
      case 'chevron':
        for (i = 0; i < 6; i++) {
          var mx = (i * 23 % S), my = (i * 31 % S);
          x.beginPath(); x.moveTo(mx, my + 6); x.lineTo(mx + 5, my); x.lineTo(mx + 10, my + 6); x.stroke();
        }
        break;
      case 'field':
        x.globalAlpha = 0.55;
        for (i = 0; i < S; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke(); }
        for (i = 0; i < S; i += 16) { x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke(); }
        x.globalAlpha = 1;
        break;
      case 'reed':
        for (i = 0; i < 8; i++) {
          var rx = (i * 11 % S), ry = (i * 27 % S);
          x.beginPath(); x.moveTo(rx, ry + 7); x.lineTo(rx, ry); x.stroke();
          x.beginPath(); x.arc(rx, ry + 9, 3.2, 0, Math.PI); x.stroke();
        }
        break;
      case 'flake':
        for (i = 0; i < 12; i++) {
          var fx = (i * 13 % S), fy = (i * 17 % S);
          x.beginPath(); x.moveTo(fx - 2, fy); x.lineTo(fx + 2, fy);
          x.moveTo(fx, fy - 2); x.lineTo(fx, fy + 2); x.stroke();
        }
        break;
      case 'dune':
        for (i = 0; i < 5; i++) {
          var dy = i * 10 + 4;
          x.beginPath();
          x.moveTo(0, dy);
          x.quadraticCurveTo(S / 4, dy - 5, S / 2, dy);
          x.quadraticCurveTo(S * 0.75, dy + 5, S, dy);
          x.stroke();
        }
        break;
    }
    return c;
  }

  function pattern(ctx, key) {
    if (!patternCache[key]) patternCache[key] = buildTile(key);
    return ctx.createPattern(patternCache[key], 'repeat');
  }

  function tile(key) {
    if (!patternCache[key]) patternCache[key] = buildTile(key);
    return patternCache[key];
  }

  global.Terrain = { TERRAIN: TERRAIN, pattern: pattern, tile: tile, buildTile: buildTile };

  /* ---------------------------------------------------------
     KATMANLAR
     --------------------------------------------------------- */
  var DEFS = [
    { id: 'reference', type: 'image',  tr: 'Referans görsel', en: 'Reference image', opacity: 0.5, visible: true },
    { id: 'landmass',  type: 'raster', tr: 'Kara',            en: 'Landmass',        opacity: 1,   visible: true },
    { id: 'terrain',   type: 'raster', tr: 'Arazi',           en: 'Terrain',         opacity: 1,   visible: true },
    { id: 'rivers',    type: 'vector', tr: 'Nehirler',        en: 'Rivers',          opacity: 1,   visible: true },
    { id: 'roads',     type: 'vector', tr: 'Yollar',          en: 'Roads',           opacity: 1,   visible: true },
    { id: 'symbols',   type: 'vector', tr: 'Semboller',       en: 'Symbols',         opacity: 1,   visible: true },
    { id: 'labels',    type: 'vector', tr: 'Etiketler',       en: 'Labels',          opacity: 1,   visible: true },
    { id: 'overlay',   type: 'overlay',tr: 'Kaplama',         en: 'Overlay',         opacity: 1,   visible: true }
  ];

  var Layers = {
    list: [],
    active: 'landmass',

    init: function (w, h) {
      this.list = DEFS.map(function (d) {
        var l = {
          id: d.id, type: d.type, tr: d.tr, en: d.en,
          visible: d.visible, locked: false, opacity: d.opacity,
          canvas: null, ctx: null, objects: [], image: null
        };
        if (d.type === 'raster') {
          l.canvas = document.createElement('canvas');
          l.canvas.width = w; l.canvas.height = h;
          l.ctx = l.canvas.getContext('2d', { willReadFrequently: false });
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

    /* --- meta (görünürlük/kilit/opaklık/sıra) anlık görüntüsü --- */
    meta: function () {
      return this.list.map(function (l) {
        return { id: l.id, visible: l.visible, locked: l.locked, opacity: l.opacity };
      });
    },

    applyMeta: function (m) {
      var self = this;
      var ordered = [];
      m.forEach(function (e) {
        var l = self.get(e.id);
        if (!l) return;
        l.visible = e.visible; l.locked = e.locked; l.opacity = e.opacity;
        ordered.push(l);
      });
      if (ordered.length === this.list.length) this.list = ordered;
    },

    /* --- proje serileştirme --- */
    serialize: function (includeRefImage) {
      return this.list.map(function (l) {
        var o = { id: l.id, type: l.type, visible: l.visible, locked: l.locked, opacity: l.opacity };
        if (l.type === 'raster') o.data = l.canvas.toDataURL('image/png');
        if (l.type === 'vector') o.objects = l.objects;
        if (l.type === 'image' && l.image && includeRefImage !== false) o.data = l.imageData || null;
        return o;
      });
    },

    deserialize: function (arr) {
      var self = this;
      var jobs = [];
      var ordered = [];
      arr.forEach(function (e) {
        var l = self.get(e.id);
        if (!l) return;
        l.visible = e.visible; l.locked = e.locked; l.opacity = e.opacity;
        if (l.type === 'vector') l.objects = e.objects || [];
        if (l.type === 'raster' && e.data) {
          jobs.push(new Promise(function (res) {
            var im = new Image();
            im.onload = function () {
              l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
              l.ctx.drawImage(im, 0, 0);
              res();
            };
            im.onerror = function () { res(); };
            im.src = e.data;
          }));
        } else if (l.type === 'raster') {
          l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
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
