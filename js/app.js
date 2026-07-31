/* ============================================================
   Medieval Map Editor — app.js
   Uygulama durumu + başlatıcı. En son yüklenen dosyadır.
   ============================================================ */
(function (global) {
  'use strict';

  var App = {
    tool: 'landmass',
    selection: null,
    exportReference: false,

    brush:   { size:120, roughness:0.35, color:'#ded0ac' },
    terrain: { type:'grassland', size:160, opacity:0.85, clip:true },
    symbol:  { id:'mnt_peak', size:72, rot:0, hue:0, opacity:1, jitter:false },
    river:   { width:16, meander:0.30, taper:true, color:'#5b8aa6' },
    road:    { width:6, style:'dashed', color:'#6b4f2a' },
    label:   { preset:'region', font:'serif', size:46, color:'#5a4326', outline:true,
               outlineColor:'#f5ecd8', shadow:true, curve:0, track:8, rot:0,
               caps:true, banner:null },
    eyedrop: { radius:60, brushRadius:80, targetLayer:'terrain', hasSample:false, painting:false },
    scale:   { visible:true, x:120, y:1880, len:420, size:26, segs:4, label:'200 fersah' },

    init: function () {
      var size = 2048;

      Layers.init(size, size);
      Cv.init(size, size);
      Tools.bind();

      /* ölçek çubuğunu tuvalin sol altına yerleştir */
      this.scale.x = Math.round(size * 0.06);
      this.scale.y = Math.round(size * 0.92);

      History.limit = 50;
      History.onChange = function () { if (global.UI) UI.refreshHistory(); };

      UI.init();
      Cv.fit();

      UI.msg('Medieval Map Editor · ' + Sym.count() + ' ' + UI.t('symbols'));
      console.log('[MME] hazır — ' + Sym.count() + ' sembol, tuval ' + size + '×' + size);
    }
  };

  global.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.init(); });
  } else {
    App.init();
  }
})(window);
