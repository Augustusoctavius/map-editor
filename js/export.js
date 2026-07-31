/* ============================================================
   Cartographer — export.js
   PNG / SVG dışa aktarma, .json proje kaydet-yükle
   ============================================================ */
(function (global) {
  'use strict';

  function download(blobOrUrl, filename) {
    var a = document.createElement('a');
    a.download = filename;
    a.href = (typeof blobOrUrl === 'string') ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      if (typeof blobOrUrl !== 'string') URL.revokeObjectURL(a.href);
    }, 400);
  }

  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var Exporter = {

    /* ---------------- PNG ---------------- */
    png: function (scale) {
      scale = scale || 1;
      var w = Math.round(Cv.W * scale), h = Math.round(Cv.H * scale);
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var x = c.getContext('2d');
      x.save();
      x.scale(scale, scale);
      Cv.renderMap(x, { includeReference: App.exportReference, forExport: true });
      x.restore();
      c.toBlob(function (b) {
        download(b, 'harita-' + stamp() + '.png');
        UI.msg(UI.t('exported') + ' PNG ' + w + '×' + h);
      }, 'image/png');
    },

    /* ---------------- SVG ---------------- */
    svg: function () {
      var W = Cv.W, H = Cv.H;
      var s = [];
      s.push('<?xml version="1.0" encoding="UTF-8"?>');
      s.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
             'width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">');
      s.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#9cc0cf"/>');

      Layers.list.forEach(function (l) {
        if (!l.visible) return;

        if (l.id === 'reference') {
          if (!App.exportReference || !l.imageData) return;
          s.push('<image x="0" y="0" width="' + W + '" height="' + H + '" opacity="' + l.opacity +
                 '" xlink:href="' + l.imageData + '"/>');
          return;
        }

        if (l.type === 'raster') {
          s.push('<image x="0" y="0" width="' + W + '" height="' + H + '" opacity="' + l.opacity +
                 '" xlink:href="' + l.canvas.toDataURL('image/png') + '"/>');
          return;
        }

        if (l.type === 'vector') {
          s.push('<g opacity="' + l.opacity + '">');
          l.objects.forEach(function (o) {
            if (l.id === 'rivers') {
              var pts = Cv.riverGeometry(o);
              var wEnd = o.width || 12;
              var wStart = o.taper ? Math.max(1.2, wEnd * 0.18) : wEnd;
              var poly = Geo.ribbon(pts, wStart, wEnd);
              s.push('<path d="' + Geo.svgPolyD(poly, true) + '" fill="' + (o.color || '#5b8aa6') +
                     '" stroke="' + (o.color || '#5b8aa6') + '" stroke-opacity="0.55" stroke-width="' +
                     Math.max(0.7, wEnd * 0.09).toFixed(2) + '" stroke-linejoin="round"/>');
            } else if (l.id === 'roads') {
              var rp = Cv.roadGeometry(o), w = o.width || 5;
              var dash = '';
              if (o.style === 'dashed') dash = ' stroke-dasharray="' + (w * 2.6) + ',' + (w * 2) + '"';
              if (o.style === 'dotted') dash = ' stroke-dasharray="' + (w * 0.35) + ',' + (w * 2.1) + '"';
              if (o.style === 'double') {
                s.push('<path d="' + Geo.svgPolyD(rp) + '" fill="none" stroke="' + (o.color || '#6b4f2a') +
                       '" stroke-width="' + (w * 1.9) + '" stroke-linecap="round" stroke-linejoin="round"/>');
                s.push('<path d="' + Geo.svgPolyD(rp) + '" fill="none" stroke="#9cc0cf" stroke-width="' +
                       (w * 0.7) + '" stroke-linecap="round" stroke-linejoin="round"/>');
              } else {
                s.push('<path d="' + Geo.svgPolyD(rp) + '" fill="none" stroke="' + (o.color || '#6b4f2a') +
                       '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + dash + '/>');
              }
            } else if (l.id === 'symbols') {
              s.push(Sym.toSVG(o.sym, o));
            } else if (l.id === 'labels') {
              s.push(Exporter.labelSVG(o));
            }
          });
          s.push('</g>');
        }
      });

      if (Cv.parchment) {
        s.push('<rect x="0" y="0" width="' + W + '" height="' + H +
               '" fill="#d9c79a" opacity="0.28" style="mix-blend-mode:multiply"/>');
      }
      s.push('</svg>');

      download(new Blob([s.join('\n')], { type: 'image/svg+xml' }), 'harita-' + stamp() + '.svg');
      UI.msg(UI.t('exported') + ' SVG');
    },

    labelSVG: function (o) {
      var fam = (FONTS[o.font] || FONTS.serif).replace(/"/g, "'");
      var common = 'font-family="' + esc(fam) + '" font-size="' + (o.size || 32) +
                   '" font-weight="600" letter-spacing="' + (o.track || 0) +
                   '" fill="' + (o.color || '#3a2b18') + '"' +
                   (o.outline ? ' stroke="' + (o.outlineColor || '#f5ecd8') + '" stroke-width="' +
                     Math.max(1.5, (o.size || 32) * 0.16) + '" paint-order="stroke"' : '');
      var rot = o.rot ? ' transform="rotate(' + o.rot + ' ' + o.x + ' ' + o.y + ')"' : '';

      if (!o.curve) {
        return '<text x="' + o.x + '" y="' + o.y + '" text-anchor="middle" dominant-baseline="middle" ' +
               common + rot + '>' + esc(o.text) + '</text>';
      }
      /* eğimli metin: yardımcı yay + textPath */
      var total = Cv.measureLabel(Cv.ctx, o);
      var arc = o.curve * Math.PI / 180;
      var R = Math.abs(total / arc);
      var sweep = o.curve > 0 ? 1 : 0;
      var half = Math.abs(arc) / 2;
      var cx = o.x, cy = o.y + (o.curve > 0 ? R : -R);
      var x1 = cx - Math.sin(half) * R, x2 = cx + Math.sin(half) * R;
      var y1 = cy - Math.cos(half) * R * (o.curve > 0 ? 1 : -1);
      var y2 = y1;
      var pid = 'lp' + o.id;
      return '<defs><path id="' + pid + '" d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
             ' A' + R.toFixed(1) + ' ' + R.toFixed(1) + ' 0 0 ' + sweep + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
             '" fill="none"/></defs>' +
             '<text ' + common + rot + '><textPath xlink:href="#' + pid +
             '" startOffset="50%" text-anchor="middle">' + esc(o.text) + '</textPath></text>';
    },

    /* ---------------- proje kaydet ---------------- */
    saveProject: function () {
      var data = {
        app: 'cartographer', version: 1,
        W: Cv.W, H: Cv.H,
        customSymbols: Sym.serializeCustom(),
        parchment: Cv.parchment, grid: Cv.grid,
        exportReference: App.exportReference,
        layers: Layers.serialize(true)
      };
      download(new Blob([JSON.stringify(data)], { type: 'application/json' }), 'harita-' + stamp() + '.json');
      UI.msg(UI.t('saved'));
    },

    /* ---------------- proje yükle ---------------- */
    loadProject: function (file) {
      var r = new FileReader();
      r.onload = function () {
        var d;
        try { d = JSON.parse(r.result); }
        catch (e) { UI.msg(UI.t('badfile')); return; }
        if (!d || d.app !== 'cartographer') { UI.msg(UI.t('badfile')); return; }

        Cv.setSize(d.W || 2048, d.H || 2048, false);
        Cv.parchment = !!d.parchment;
        Cv.grid = !!d.grid;
        App.exportReference = !!d.exportReference;
        document.getElementById('chk-parchment').checked = Cv.parchment;
        document.getElementById('chk-grid').checked = Cv.grid;
        document.getElementById('ref-export').checked = App.exportReference;
        document.getElementById('sel-canvas-size').value = String(d.W || 2048);

        if(d.customSymbols) Sym.deserializeCustom(d.customSymbols);
        Layers.deserialize(d.layers || []).then(function () {
          History.clear();
          App.selection = null;
          UI.refreshAll();
          Cv.fit();
          UI.msg(UI.t('loaded'));
        });
      };
      r.readAsText(file);
    },

    /* ---------------- yeni proje ---------------- */
    newProject: function (size) {
      Cv.setSize(size, size, false);
      Layers.init(size, size);
      History.clear();
      App.selection = null;
      Tools.cancelPath();
      UI.refreshAll();
      Cv.fit();
      UI.msg(UI.t('newmap'));
    }
  };

  global.Exporter = Exporter;
  global.downloadFile = download;
})(window);
