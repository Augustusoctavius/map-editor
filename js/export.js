/* ============================================================
   Medieval Map Editor — export.js
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
    return d.getFullYear() + p(d.getMonth()+1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  var Exporter = {

    png: function (scale) {
      scale = scale || 1;
      var w = Math.round(Cv.W*scale), h = Math.round(Cv.H*scale);
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var x = c.getContext('2d');
      x.save();
      x.scale(scale, scale);
      Cv.renderMap(x, { includeReference: App.exportReference });
      x.restore();
      c.toBlob(function (b) {
        download(b, 'harita-' + stamp() + (scale > 1 ? '-' + scale + 'x' : '') + '.png');
        UI.msg(UI.t('exported') + ' PNG ' + w + '×' + h);
      }, 'image/png');
    },

    svg: function () {
      var W = Cv.W, H = Cv.H, s = [];
      s.push('<?xml version="1.0" encoding="UTF-8"?>');
      s.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
             'width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">');
      s.push('<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#7ba8bd"/>');

      /* kıyı efekti */
      if (Cv.shore) {
        if (Cv.shoreDirty || !Cv.shoreCanvas) Cv.buildShore();
        if (Cv.shoreCanvas) {
          s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" opacity="0.9" xlink:href="' +
                 Cv.shoreCanvas.toDataURL('image/png') + '"/>');
        }
      }

      Layers.list.forEach(function (l) {
        if (!l.visible) return;

        if (l.id === 'reference') {
          if (!App.exportReference || !l.imageData) return;
          s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" opacity="'+l.opacity+
                 '" xlink:href="'+l.imageData+'"/>');
          return;
        }

        if (l.type === 'raster') {
          s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" opacity="'+l.opacity+
                 '" xlink:href="'+l.canvas.toDataURL('image/png')+'"/>');
          return;
        }

        if (l.type === 'vector') {
          s.push('<g opacity="'+l.opacity+'">');
          l.objects.forEach(function (o) {
            if (l.id === 'rivers' && o.kind === 'lake') {
              /* göl SVG */
              var lpts = Geo.sample(o.pts, 16);
              s.push('<path d="' + Geo.svgPolyD(lpts, true) + '" fill="' + (o.color||'#5b8aa6') +
                     '" opacity="' + (o.opacity||0.88) + '" stroke="' + (o.color||'#5b8aa6') +
                     '" stroke-width="2" stroke-opacity="0.5" stroke-linejoin="round"/>');
            } else if (l.id === 'rivers') {
              var pts = Cv.riverGeometry(o);
              var wEnd = o.width || 12;
              var wStart = o.taper ? Math.max(1.2, wEnd*0.18) : wEnd;
              var poly = Geo.ribbon(pts, wStart, wEnd);
              s.push('<path d="'+Geo.svgPolyD(poly,true)+'" fill="'+(o.color||'#5b8aa6')+
                     '" stroke="'+(o.color||'#5b8aa6')+'" stroke-opacity="0.55" stroke-width="'+
                     Math.max(0.7, wEnd*0.09).toFixed(2)+'" stroke-linejoin="round"/>');
            } else if (l.id === 'roads') {
              var rp = Cv.roadGeometry(o), w = o.width || 5, dash = '';
              if (o.style === 'dashed') dash = ' stroke-dasharray="'+(w*2.6)+','+(w*2)+'"';
              if (o.style === 'dotted') dash = ' stroke-dasharray="'+(w*0.35)+','+(w*2.1)+'"';
              if (o.style === 'double') {
                s.push('<path d="'+Geo.svgPolyD(rp)+'" fill="none" stroke="'+(o.color||'#6b4f2a')+
                       '" stroke-width="'+(w*1.9)+'" stroke-linecap="round" stroke-linejoin="round"/>');
                s.push('<path d="'+Geo.svgPolyD(rp)+'" fill="none" stroke="#7ba8bd" stroke-width="'+
                       (w*0.7)+'" stroke-linecap="round" stroke-linejoin="round"/>');
              } else {
                s.push('<path d="'+Geo.svgPolyD(rp)+'" fill="none" stroke="'+(o.color||'#6b4f2a')+
                       '" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"'+dash+'/>');
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
        s.push('<rect x="0" y="0" width="'+W+'" height="'+H+
               '" fill="#d9c79a" opacity="0.28" style="mix-blend-mode:multiply"/>');
      }

      if (App.scale && App.scale.visible) s.push(Exporter.scaleSVG(App.scale));
      if (App.windrose && App.windrose.visible) s.push(Exporter.windroseSVG(App.windrose));

      s.push('</svg>');
      download(new Blob([s.join('\n')], { type:'image/svg+xml' }), 'harita-' + stamp() + '.svg');
      UI.msg(UI.t('exported') + ' SVG');
    },

    windroseSVG: function (wr) {
      if (!wr || !wr.visible) return '';
      var x = wr.x, y = wr.y, R = wr.size || 120;
      var col = esc(wr.color || '#3a2b18');
      var o = ['<g transform="translate('+x+','+y+')" font-family="Georgia,serif">'];
      /* dış daire */
      o.push('<circle r="'+(R*0.52).toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="'+(R*0.025).toFixed(1)+'" opacity="0.55"/>');
      /* 8 ok */
      var dirs = [0,45,90,135,180,225,270,315];
      dirs.forEach(function(deg) {
        var isCard = deg % 90 === 0;
        var tip = isCard ? R*0.50 : R*0.32;
        var base = isCard ? R*0.13 : R*0.08;
        var side = isCard ? R*0.10 : R*0.06;
        var op = isCard ? '1' : '0.65';
        o.push('<g transform="rotate('+deg+')" opacity="'+op+'">');
        o.push('<path d="M0 '+(-tip).toFixed(1)+' L'+side.toFixed(1)+' '+(-base).toFixed(1)+
               ' L0 0 L'+(-side).toFixed(1)+' '+(-base).toFixed(1)+' Z" fill="'+col+
               '" stroke="'+col+'" stroke-width="'+(R*0.018).toFixed(1)+'"/>');
        o.push('</g>');
      });
      /* merkez */
      o.push('<circle r="'+(R*0.06).toFixed(1)+'" fill="#f5ecd8" stroke="'+col+'" stroke-width="'+(R*0.025).toFixed(1)+'"/>');
      /* N */
      o.push('<text x="0" y="'+(-R*0.70).toFixed(1)+'" font-size="'+(R*0.22).toFixed(1)+
             '" font-weight="bold" fill="'+col+'" text-anchor="middle" dominant-baseline="middle">N</text>');
      o.push('</g>');
      return o.join('');
    },

    scaleSVG: function (sc) {
      var segs = Math.max(2, sc.segs|0), segW = sc.len/segs, barH = sc.size*0.62;
      var o = ['<g transform="translate('+sc.x+','+sc.y+')">'];
      o.push('<rect x="0" y="0" width="'+sc.len+'" height="'+barH+'" fill="#f2e6c8" stroke="#3a2b18" stroke-width="'+
             Math.max(1, sc.size*0.10)+'"/>');
      for (var i = 0; i < segs; i += 2) {
        o.push('<rect x="'+(i*segW)+'" y="0" width="'+segW+'" height="'+barH+'" fill="#3a2b18"/>');
      }
      o.push('<rect x="0" y="0" width="'+sc.len+'" height="'+barH+'" fill="none" stroke="#3a2b18" stroke-width="'+
             Math.max(1, sc.size*0.10)+'"/>');
      o.push('<path d="M0 '+(-sc.size*0.34)+' L0 0 M'+sc.len+' '+(-sc.size*0.34)+' L'+sc.len+
             ' 0 M'+(sc.len/2)+' '+(-sc.size*0.22)+' L'+(sc.len/2)+' 0" stroke="#3a2b18" stroke-width="'+
             Math.max(1, sc.size*0.10)+'" fill="none"/>');
      var fam = FONTS.serif.replace(/"/g, "'");
      o.push('<text x="0" y="'+(barH+sc.size*0.24)+'" font-family="'+esc(fam)+'" font-size="'+sc.size+
             '" font-weight="600" fill="#3a2b18" dominant-baseline="hanging">0</text>');
      o.push('<text x="'+sc.len+'" y="'+(barH+sc.size*0.24)+'" font-family="'+esc(fam)+'" font-size="'+sc.size+
             '" font-weight="600" fill="#3a2b18" text-anchor="end" dominant-baseline="hanging">'+
             esc(sc.label||'')+'</text>');
      o.push('</g>');
      return o.join('');
    },

    labelSVG: function (o) {
      var text = o.caps ? (o.text||'').toUpperCase() : (o.text||'');
      var fam = (FONTS[o.font] || FONTS.serif).replace(/"/g, "'");
      var total = Cv.measureLabel(Cv.ctx, o);
      var out = [];
      var rot = o.rot ? ' transform="rotate('+o.rot+' '+o.x+' '+o.y+')"' : '';

      /* kapıt */
      if (o.banner) {
        var bw = total + (o.size||32)*1.25;
        var bh = (o.size||32)*1.62;
        var paths = Cv.bannerPaths(o.banner, bw, bh);
        out.push('<g transform="translate('+o.x+','+o.y+')'+(o.rot?' rotate('+o.rot+')':'')+'">');
        paths.forEach(function (bp) {
          out.push('<path d="'+bp.d+'" fill="'+(bp.fill||'none')+'"'+
                   (bp.stroke ? ' stroke="'+bp.stroke+'" stroke-width="'+bp.lw+'"' : '')+
                   ' stroke-linejoin="round"/>');
        });
        out.push('</g>');
      }

      var common = 'font-family="'+esc(fam)+'" font-size="'+(o.size||32)+
                   '" font-weight="600" letter-spacing="'+(o.track||0)+
                   '" fill="'+(o.color||'#3a2b18')+'"' +
                   (o.outline ? ' stroke="'+(o.outlineColor||'#f5ecd8')+'" stroke-width="'+
                     Math.max(1.5,(o.size||32)*0.16)+'" paint-order="stroke"' : '');

      if (!o.curve) {
        out.push('<text x="'+o.x+'" y="'+o.y+'" text-anchor="middle" dominant-baseline="middle" '+
                 common+rot+'>'+esc(text)+'</text>');
        return out.join('');
      }

      var arc = o.curve*Math.PI/180;
      var R = Math.abs(total/arc);
      var sweep = o.curve > 0 ? 1 : 0;
      var half = Math.abs(arc)/2;
      var cx = o.x, cy = o.y + (o.curve > 0 ? R : -R);
      var x1 = cx - Math.sin(half)*R, x2 = cx + Math.sin(half)*R;
      var y1 = cy - Math.cos(half)*R*(o.curve > 0 ? 1 : -1), y2 = y1;
      var pid = 'lp' + o.id;
      out.push('<defs><path id="'+pid+'" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+
               ' A'+R.toFixed(1)+' '+R.toFixed(1)+' 0 0 '+sweep+' '+x2.toFixed(1)+' '+y2.toFixed(1)+
               '" fill="none"/></defs>');
      out.push('<text '+common+rot+'><textPath xlink:href="#'+pid+
               '" startOffset="50%" text-anchor="middle">'+esc(text)+'</textPath></text>');
      return out.join('');
    },

    saveProject: function () {
      var data = {
        app:'cartographer', version:3,
        W:Cv.W, H:Cv.H,
        parchment:Cv.parchment, grid:Cv.grid,
        shore:Cv.shore, shoreWidth:Cv.shoreWidth,
        exportReference:App.exportReference,
        scale:App.scale,
        customSymbols: Sym.serializeCustom(),
        layers: Layers.serialize(true)
      };
      download(new Blob([JSON.stringify(data)], { type:'application/json' }), 'harita-'+stamp()+'.json');
      UI.msg(UI.t('saved'));
    },

    loadProject: function (file) {
      var r = new FileReader();
      r.onload = function () {
        var d;
        try { d = JSON.parse(r.result); }
        catch (e) { UI.msg(UI.t('badfile')); return; }
        if (!d || d.app !== 'cartographer') { UI.msg(UI.t('badfile')); return; }

        Cv.setSize(d.W||2048, d.H||2048, false);
        Cv.parchment = !!d.parchment;
        Cv.grid = !!d.grid;
        Cv.shore = d.shore !== false;
        Cv.shoreWidth = d.shoreWidth || 26;
        App.exportReference = !!d.exportReference;
        if (d.scale) App.scale = d.scale;

        document.getElementById('chk-parchment').checked = Cv.parchment;
        document.getElementById('chk-grid').checked = Cv.grid;
        document.getElementById('chk-shore').checked = Cv.shore;
        document.getElementById('ref-export').checked = App.exportReference;
        document.getElementById('sel-canvas-size').value = String(d.W||2048);
        document.getElementById('shore-w').value = Cv.shoreWidth;
        document.getElementById('v-shore-w').textContent = Cv.shoreWidth;

        if (d.customSymbols) Sym.deserializeCustom(d.customSymbols);

        Layers.deserialize(d.layers||[]).then(function () {
          History.clear();
          App.selection = null;
          Cv.shoreDirty = true;
          UI.refreshAll();
          Cv.fit();
          UI.msg(UI.t('loaded'));
        });
      };
      r.readAsText(file);
    },

    newProject: function (size) {
      Layers.init(size, size);
      Cv.setSize(size, size, false);
      App.scale.x = Math.round(size*0.06);
      App.scale.y = Math.round(size*0.92);
      History.clear();
      App.selection = null;
      Tools.cancelPath();
      Cv.shoreDirty = true;
      Cv.shoreCanvas = null;
      UI.refreshAll();
      Cv.fit();
      UI.msg(UI.t('newmap'));
    }
  };

  global.Exporter = Exporter;
  global.downloadFile = download;
})(window);
