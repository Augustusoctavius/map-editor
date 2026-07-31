/* ============================================================
   Cartographer — app.js
   Uygulama durumu + başlatıcı. En son yüklenen dosyadır.
   ============================================================ */
(function (global) {
  'use strict';

  var App = {
    tool: 'landmass',
    selection: null,
    exportReference: false,

    brush:   { size: 120, roughness: 0.35, color: '#ded0ac' },
    terrain: { type: 'steppe', size: 160, opacity: 0.85, clip: true },
    symbol:  { id: 'mnt_peak', size: 72, rot: 0, hue: 0, opacity: 1, jitter: false },
    river:   { width: 16, meander: 0.30, taper: true, color: '#5b8aa6' },
    road:    { width: 6, style: 'dashed', color: '#6b4f2a' },
    label:   { font: 'serif', size: 42, color: '#3a2b18', outline: true,
               outlineColor: '#f5ecd8', shadow: true, curve: 0, track: 2, rot: 0 },

    init: function () {
      var size = 2048;

      Layers.init(size, size);
      Cv.init(size, size);
      Tools.bind();

      History.limit = 50;
      History.onChange = function () { if (global.UI) UI.refreshHistory(); };

      UI.init();
      Cv.fit();

      UI.msg('Cartographer · ' + Sym.count() + ' ' + UI.t('symbols'));
      console.log('[Cartographer] hazır — ' + Sym.count() + ' sembol, tuval ' + size + '×' + size);
    }
  };

  global.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.init(); });
  } else {
    App.init();
  }
})(window);
