/* ============================================================
   Wayborne Map Editor — app.js  v0.11
   ============================================================ */
(function (global) {
  'use strict';

  var App = {
    tool: 'landmass',
    selection: null,
    exportReference: false,

    brush:   { size:120, roughness:0.35, color:'#ded0ac' },
    terrain: { type:'grassland', size:160, opacity:0.85, clip:true },
    symbol:  { id:'ik_knight', size:72, rot:0, hue:0, opacity:1, wear:0, jitter:false,
               brushMode:false, brushDensity:0.5, clipToLand:true },
    river:   { width:16, meander:0.30, taper:true, color:'#5b8aa6' },
    road:    { width:6, style:'dashed', color:'#6b4f2a' },
    lake:    { color:'#5b8aa6', opacity:0.88 },
    territory: { color:'#8a5a3a', opacity:0.30, borderColor:'#5a3a20', borderWidth:2 },
    elevation: { brushSize:220, strength:0.5, lower:false,
                 showHillshade:true, showContours:false, contourInterval:32 },
    label:   { preset:'region', font:'serif', size:46, color:'#5a4326', outline:true,
               outlineColor:'#f5ecd8', shadow:true, curve:0, track:8, rot:0,
               caps:true, banner:null, snapPath:false },
    eyedrop: { radius:60, brushRadius:80, targetLayer:'terrain', hasSample:false, painting:false },
    scale:   { visible:true, x:120, y:1880, len:420, size:26, segs:4, label:'200 fersah' },
    windrose:{ visible:false, x:0, y:0, size:120, style:'classic', color:'#3a2b18' },
    snap:    { enabled:false, size:64 },

    init: function () {
      var size = 2048;
      Layers.init(size, size);
      Cv.init(size, size);
      Tools.bind();

      this.scale.x = Math.round(size * 0.06);
      this.scale.y = Math.round(size * 0.92);
      this.windrose.x = Math.round(size * 0.88);
      this.windrose.y = Math.round(size * 0.12);

      History.limit = 50;
      History.onChange = function () { if (global.UI) UI.refreshHistory(); };

      UI.init();
      Cv.fit();

      UI.msg('Wayborne Map Editor · ' + Sym.count() + ' ' + UI.t('symbols'));
      console.log('[WME] hazır — ' + Sym.count() + ' sembol, tuval ' + size + '×' + size);
    }
  };

  global.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.init(); });
  } else {
    App.init();
  }
})(window);
