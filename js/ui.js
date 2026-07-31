/* ============================================================
   Cartographer — ui.js
   Panel/toolbar mantığı, i18n, katman listesi, sembol kütüphanesi,
   klavye kısayolları, durum çubuğu.
   ============================================================ */
(function (global) {
  'use strict';

  var DICT = {
    tr: {
      new: 'Yeni', open: 'Aç', save: 'Kaydet', parchment: 'Parşömen', grid: 'Izgara',
      t_select: 'Seç', t_landmass: 'Kara', t_erase: 'Deniz', t_terrain: 'Arazi', t_symbol: 'Sembol',
      t_river: 'Nehir', t_road: 'Yol', t_label: 'Etiket', t_pan: 'Kaydır',
      o_landmass: 'Kara / Kıyı', o_brushsize: 'Fırça boyutu', o_rough: 'Kıyı sertliği',
      o_landcolor: 'Kara rengi', o_smooth: 'Kıyıyı yumuşat', o_clearland: 'Karayı temizle',
      h_landmass: 'Sürükleyerek kara çiz. "Deniz" aracı karayı siler.',
      o_terrain: 'Arazi boyama', o_opacity: 'Opaklık', o_clip: 'Sadece karaya boya',
      o_clearterrain: 'Arazi katmanını temizle',
      o_symbol: 'Sembol', o_size: 'Boyut', o_rot: 'Dönüş', o_hue: 'Renk tonu',
      o_jitter: 'Yerleştirmede rastgelelik',
      h_symbol: 'Kütüphaneden sembol seç, haritaya tıkla. "Seç" aracıyla taşı; Delete ile sil.',
      o_river: 'Nehir', o_width: 'Kalınlık', o_meander: 'Kıvrım (meander)',
      o_taper: 'Kaynakta incelt', o_color: 'Renk',
      h_path: 'Tıklayarak nokta ekle. Enter / çift tık ile bitir, Esc ile iptal et.',
      o_road: 'Yol / Kervan güzergâhı', rs_solid: 'Ana yol (düz)', rs_dashed: 'Patika (kesik)',
      rs_double: 'Çift çizgi', rs_dotted: 'Kervan izi (noktalı)',
      o_label: 'Etiket', o_curve: 'Eğim (curved)', o_track: 'Harf aralığı',
      o_outline: 'Kontur', o_hasoutline: 'Kontur uygula', o_shadow: 'Gölge',
      h_label: 'Metni yaz, sonra haritaya tıkla. Seçili etiket varsa ayarlar anında uygulanır.',
      o_selection: 'Seçim', o_nosel: 'Seçili nesne yok', o_dup: 'Çoğalt', o_del: 'Sil',
      o_view: 'Görünüm', o_fit: 'Ekrana sığdır', o_100: '%100',
      h_pan: 'Space + sürükle veya orta tık ile her araçta kaydırabilirsin.',
      tab_layers: 'Katmanlar', tab_library: 'Kütüphane', tab_history: 'Geçmiş',
      ref_title: 'Referans görsel', ref_export: "Export'a dahil et", ref_clear: 'Referansı kaldır',
      st_pos: 'Konum', st_zoom: 'Yakınlık', st_size: 'Tuval', st_tool: 'Araç',
      cancel: 'Vazgeç', ok: 'Tamam',
      locked: 'Katman kilitli veya gizli.', needtext: 'Önce etiket metnini yaz.',
      exported: 'Dışa aktarıldı:', saved: 'Proje kaydedildi.', loaded: 'Proje yüklendi.',
      badfile: 'Geçersiz proje dosyası.', newmap: 'Yeni harita oluşturuldu.',
      confirmNew: 'Mevcut harita silinecek. Yeni tuval boyutunu seç:',
      confirmSize: 'Tuval boyutunu değiştirmek mevcut katmanları ölçekler. Devam edilsin mi?',
      histEmpty: 'Geçmiş boş.', histStart: 'Başlangıç',
      selNone: 'Seçili nesne yok', symbols: 'sembol'
    },
    en: {
      new: 'New', open: 'Open', save: 'Save', parchment: 'Parchment', grid: 'Grid',
      t_select: 'Select', t_landmass: 'Land', t_erase: 'Sea', t_terrain: 'Terrain', t_symbol: 'Symbol',
      t_river: 'River', t_road: 'Road', t_label: 'Label', t_pan: 'Pan',
      o_landmass: 'Landmass / Coast', o_brushsize: 'Brush size', o_rough: 'Coast roughness',
      o_landcolor: 'Land colour', o_smooth: 'Smooth coastline', o_clearland: 'Clear landmass',
      h_landmass: 'Drag to paint land. The "Sea" tool erases it.',
      o_terrain: 'Terrain painting', o_opacity: 'Opacity', o_clip: 'Paint on land only',
      o_clearterrain: 'Clear terrain layer',
      o_symbol: 'Symbol', o_size: 'Size', o_rot: 'Rotation', o_hue: 'Hue shift',
      o_jitter: 'Randomise placement',
      h_symbol: 'Pick a symbol, click the map. Use "Select" to move; Delete to remove.',
      o_river: 'River', o_width: 'Width', o_meander: 'Meander',
      o_taper: 'Taper at source', o_color: 'Colour',
      h_path: 'Click to add points. Enter / double-click to finish, Esc to cancel.',
      o_road: 'Road / Caravan route', rs_solid: 'Highway (solid)', rs_dashed: 'Trail (dashed)',
      rs_double: 'Double line', rs_dotted: 'Caravan track (dotted)',
      o_label: 'Label', o_curve: 'Curve', o_track: 'Letter spacing',
      o_outline: 'Outline', o_hasoutline: 'Apply outline', o_shadow: 'Shadow',
      h_label: 'Type the text, then click the map. Settings apply live to a selected label.',
      o_selection: 'Selection', o_nosel: 'Nothing selected', o_dup: 'Duplicate', o_del: 'Delete',
      o_view: 'View', o_fit: 'Fit to screen', o_100: '100%',
      h_pan: 'Space + drag or middle-click pans with any tool active.',
      tab_layers: 'Layers', tab_library: 'Library', tab_history: 'History',
      ref_title: 'Reference image', ref_export: 'Include in export', ref_clear: 'Remove reference',
      st_pos: 'Pos', st_zoom: 'Zoom', st_size: 'Canvas', st_tool: 'Tool',
      cancel: 'Cancel', ok: 'OK',
      locked: 'Layer is locked or hidden.', needtext: 'Type the label text first.',
      exported: 'Exported:', saved: 'Project saved.', loaded: 'Project loaded.',
      badfile: 'Invalid project file.', newmap: 'New map created.',
      confirmNew: 'The current map will be discarded. Choose a canvas size:',
      confirmSize: 'Changing canvas size rescales existing layers. Continue?',
      histEmpty: 'History is empty.', histStart: 'Start',
      selNone: 'Nothing selected', symbols: 'symbols'
    }
  };

  function $(id) { return document.getElementById(id); }
  function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }

  var UI = {
    lang: 'tr',
    editSnapshot: null,
    msgTimer: 0,

    t: function (k) { return (DICT[this.lang] && DICT[this.lang][k]) || DICT.tr[k] || k; },

    /* ================= başlangıç ================= */
    init: function () {
      this.buildTerrainSwatches();
      this.buildSymbolLibrary();
      this.bindTopbar();
      this.bindTools();
      this.bindOptions();
      this.bindPanels();
      this.bindKeys();
      this.applyLang();
      this.refreshAll();
      this.setTool('landmass');
    },

    /* ================= dil ================= */
    applyLang: function () {
      var self = this;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.textContent = self.t(el.getAttribute('data-i18n'));
      });
      document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        el.title = self.t(el.getAttribute('data-i18n-title'));
      });
      document.documentElement.lang = this.lang;
      this.buildTerrainSwatches();
      this.buildSymbolLibrary();
      this.refreshLayers();
      this.refreshSelection();
      this.status();
    },

    /* ================= üst toolbar ================= */
    bindTopbar: function () {
      var self = this;

      on('btn-new', 'click', function () {
        self.modal(self.t('new'), '<p>' + self.t('confirmNew') + '</p>' +
          '<select id="modal-size" class="sel"><option value="2048">2048 × 2048</option>' +
          '<option value="4096">4096 × 4096</option><option value="8192">8192 × 8192</option></select>',
          function () {
            var s = parseInt($('modal-size').value, 10) || 2048;
            $('sel-canvas-size').value = String(s);
            Exporter.newProject(s);
          });
      });

      on('btn-open', 'click', function () { $('file-open').click(); });
      on('file-open', 'change', function (e) {
        if (e.target.files && e.target.files[0]) Exporter.loadProject(e.target.files[0]);
        e.target.value = '';
      });
      on('btn-save', 'click', function () { Exporter.saveProject(); });
      on('btn-undo', 'click', function () { History.undo(); });
      on('btn-redo', 'click', function () { History.redo(); });
      on('btn-export-png', 'click', function () { Exporter.png(1); });
      on('btn-export-svg', 'click', function () { Exporter.svg(); });

      on('chk-parchment', 'change', function (e) { Cv.parchment = e.target.checked; Cv.requestRender(); });
      on('chk-grid', 'change', function (e) { Cv.grid = e.target.checked; Cv.requestRender(); });

      on('sel-canvas-size', 'change', function (e) {
        var s = parseInt(e.target.value, 10);
        if (confirm(self.t('confirmSize'))) {
          Cv.setSize(s, s, true);
          History.clear();
          self.refreshAll();
        } else {
          e.target.value = String(Cv.W);
        }
      });

      on('btn-lang', 'click', function () {
        self.lang = self.lang === 'tr' ? 'en' : 'tr';
        self.applyLang();
      });
    },

    /* ================= araç seçimi ================= */
    bindTools: function () {
      var self = this;
      document.querySelectorAll('.tool').forEach(function (b) {
        b.addEventListener('click', function () { self.setTool(b.getAttribute('data-tool')); });
      });
    },

    setTool: function (name) {
      App.tool = name;
      Tools.cancelPath();
      document.querySelectorAll('.tool').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-tool') === name);
      });
      document.querySelectorAll('.opt-group').forEach(function (g) {
        g.classList.toggle('show', g.getAttribute('data-for').split(' ').indexOf(name) >= 0);
      });
      Cv.view.className = (name === 'pan') ? 'pan' : (name === 'select' ? 'pick' : '');
      if (name === 'symbol') this.showTab('library');
      this.status();
      Cv.requestRender();
    },

    /* ================= araç seçenekleri ================= */
    range: function (id, valId, fn, fmt) {
      var self = this;
      var el = $(id);
      if (!el) return;
      el.addEventListener('pointerdown', function () { self.editStart(); });
      el.addEventListener('input', function () {
        var v = parseFloat(el.value);
        if (valId) $(valId).textContent = fmt ? fmt(v) : v;
        fn(v, false);
        Cv.requestRender();
      });
      el.addEventListener('change', function () { fn(parseFloat(el.value), true); self.editCommit(); });
    },

    editStart: function () {
      if (this.editSnapshot || !App.selection) return;
      var L = Layers.get(App.selection.layerId);
      this.editSnapshot = { layerId: App.selection.layerId, arr: JSON.parse(JSON.stringify(L.objects)) };
    },

    editCommit: function () {
      if (!this.editSnapshot) return;
      var s = this.editSnapshot;
      this.editSnapshot = null;
      if (!App.selection || App.selection.layerId !== s.layerId) return;
      Tools.commitSelectionEdit(s.arr, 'edit');
    },

    bindOptions: function () {
      var self = this;

      /* --- landmass --- */
      this.range('lm-size', 'v-lm-size', function (v) { App.brush.size = v; });
      this.range('lm-rough', 'v-lm-rough', function (v) { App.brush.roughness = v / 100; },
        function (v) { return (v / 100).toFixed(2); });
      on('lm-color', 'input', function (e) { App.brush.color = e.target.value; });
      on('btn-smooth', 'click', function () { Tools.smoothCoast(6); });
      on('btn-clear-land', 'click', function () { Tools.clearRasterLayer('landmass'); });

      /* --- terrain --- */
      this.range('tr-size', 'v-tr-size', function (v) { App.terrain.size = v; });
      this.range('tr-op', 'v-tr-op', function (v) { App.terrain.opacity = v / 100; },
        function (v) { return (v / 100).toFixed(2); });
      on('tr-clip', 'change', function (e) { App.terrain.clip = e.target.checked; });
      on('btn-clear-terrain', 'click', function () { Tools.clearRasterLayer('terrain'); });

      /* --- symbol --- */
      this.range('sy-size', 'v-sy-size', function (v) {
        App.symbol.size = v;
        if (App.selection && App.selection.layerId === 'symbols') Tools.applyToSelection({ size: v });
      });
      this.range('sy-rot', 'v-sy-rot', function (v) {
        App.symbol.rot = v;
        if (App.selection && App.selection.layerId === 'symbols') Tools.applyToSelection({ rot: v });
      }, function (v) { return v + '°'; });
      this.range('sy-hue', 'v-sy-hue', function (v) {
        App.symbol.hue = v;
        if (App.selection && App.selection.layerId === 'symbols') Tools.applyToSelection({ hue: v });
      }, function (v) { return v + '°'; });
      this.range('sy-op', 'v-sy-op', function (v) {
        App.symbol.opacity = v / 100;
        if (App.selection && App.selection.layerId === 'symbols') Tools.applyToSelection({ opacity: v / 100 });
      }, function (v) { return (v / 100).toFixed(2); });
      on('sy-jitter', 'change', function (e) { App.symbol.jitter = e.target.checked; });

      /* --- river --- */
      this.range('rv-w', 'v-rv-w', function (v) {
        App.river.width = v;
        if (App.selection && App.selection.layerId === 'rivers') Tools.applyToSelection({ width: v });
      });
      this.range('rv-m', 'v-rv-m', function (v) {
        App.river.meander = v / 100;
        if (App.selection && App.selection.layerId === 'rivers') Tools.applyToSelection({ meander: v / 100 });
      }, function (v) { return (v / 100).toFixed(2); });
      on('rv-taper', 'change', function (e) {
        App.river.taper = e.target.checked;
        self.editStart();
        if (App.selection && App.selection.layerId === 'rivers') Tools.applyToSelection({ taper: e.target.checked });
        self.editCommit();
      });
      on('rv-color', 'input', function (e) {
        App.river.color = e.target.value;
        if (App.selection && App.selection.layerId === 'rivers') Tools.applyToSelection({ color: e.target.value });
      });

      /* --- road --- */
      on('rd-style', 'change', function (e) {
        App.road.style = e.target.value;
        self.editStart();
        if (App.selection && App.selection.layerId === 'roads') Tools.applyToSelection({ style: e.target.value });
        self.editCommit();
      });
      this.range('rd-w', 'v-rd-w', function (v) {
        App.road.width = v;
        if (App.selection && App.selection.layerId === 'roads') Tools.applyToSelection({ width: v });
      });
      on('rd-color', 'input', function (e) {
        App.road.color = e.target.value;
        if (App.selection && App.selection.layerId === 'roads') Tools.applyToSelection({ color: e.target.value });
      });

      /* --- label --- */
      function labelEdit(props) {
        if (App.selection && App.selection.layerId === 'labels') Tools.applyToSelection(props);
      }
      on('lb-text', 'input', function (e) { labelEdit({ text: e.target.value }); Cv.requestRender(); });
      on('lb-font', 'change', function (e) { App.label.font = e.target.value; labelEdit({ font: e.target.value }); Cv.requestRender(); });
      this.range('lb-size', 'v-lb-size', function (v) { App.label.size = v; labelEdit({ size: v }); });
      this.range('lb-curve', 'v-lb-curve', function (v) { App.label.curve = v; labelEdit({ curve: v }); });
      this.range('lb-track', 'v-lb-track', function (v) { App.label.track = v; labelEdit({ track: v }); });
      this.range('lb-rot', 'v-lb-rot', function (v) { App.label.rot = v; labelEdit({ rot: v }); },
        function (v) { return v + '°'; });
      on('lb-color', 'input', function (e) { App.label.color = e.target.value; labelEdit({ color: e.target.value }); Cv.requestRender(); });
      on('lb-outline', 'input', function (e) { App.label.outlineColor = e.target.value; labelEdit({ outlineColor: e.target.value }); Cv.requestRender(); });
      on('lb-hasoutline', 'change', function (e) { App.label.outline = e.target.checked; labelEdit({ outline: e.target.checked }); Cv.requestRender(); });
      on('lb-shadow', 'change', function (e) { App.label.shadow = e.target.checked; labelEdit({ shadow: e.target.checked }); Cv.requestRender(); });

      /* --- selection --- */
      on('btn-del', 'click', function () { Tools.deleteSelection(); });
      on('btn-dup', 'click', function () { Tools.duplicateSelection(); });

      /* --- view --- */
      on('btn-fit', 'click', function () { Cv.fit(); });
      on('btn-100', 'click', function () { Cv.setZoom(1); });

      /* --- reference --- */
      on('ref-file', 'change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var im = new Image();
          im.onload = function () {
            var L = Layers.get('reference');
            L.image = im;
            L.imageData = r.result;
            L.visible = true;
            self.refreshLayers();
            Cv.requestRender();
          };
          im.src = r.result;
        };
        r.readAsDataURL(f);
        e.target.value = '';
      });
      on('ref-export', 'change', function (e) { App.exportReference = e.target.checked; });
      on('btn-ref-clear', 'click', function () {
        var L = Layers.get('reference');
        L.image = null; L.imageData = null;
        Cv.requestRender();
      });
    },

    /* ================= sağ panel ================= */
    bindPanels: function () {
      var self = this;
      document.querySelectorAll('.tab').forEach(function (t) {
        t.addEventListener('click', function () { self.showTab(t.getAttribute('data-tab')); });
      });
      on('sym-cat', 'change', function () { self.renderSymbolGrid(); });
    },

    showTab: function (name) {
      document.querySelectorAll('.tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === name);
      });
      document.querySelectorAll('.tab-body').forEach(function (b) {
        b.classList.toggle('hidden', b.getAttribute('data-tab') !== name);
      });
    },

    /* ================= arazi paleti ================= */
    buildTerrainSwatches: function () {
      var g = $('terrain-grid');
      if (!g) return;
      g.innerHTML = '';
      var self = this;
      Object.keys(Terrain.TERRAIN).forEach(function (key) {
        var t = Terrain.TERRAIN[key];
        var b = document.createElement('button');
        b.className = 'terrain-sw' + (App && App.terrain && App.terrain.type === key ? ' active' : '');
        b.setAttribute('data-terrain', key);
        var c = document.createElement('canvas');
        c.width = 90; c.height = 34;
        var x = c.getContext('2d');
        x.fillStyle = x.createPattern(Terrain.tile(key), 'repeat');
        x.fillRect(0, 0, 90, 34);
        b.appendChild(c);
        var s = document.createElement('span');
        s.textContent = self.lang === 'en' ? t.en : t.tr;
        b.appendChild(s);
        b.addEventListener('click', function () {
          App.terrain.type = key;
          g.querySelectorAll('.terrain-sw').forEach(function (e) { e.classList.remove('active'); });
          b.classList.add('active');
          self.setTool('terrain');
        });
        g.appendChild(b);
      });
    },

    /* ================= sembol kütüphanesi ================= */
    buildSymbolLibrary: function () {
      var sel = $('sym-cat');
      if (!sel) return;
      var cur = sel.value;
      sel.innerHTML = '';
      var self = this;
      Object.keys(Sym.SYMBOLS).forEach(function (k) {
        var o = document.createElement('option');
        o.value = k;
        o.textContent = (self.lang === 'en' ? Sym.SYMBOLS[k].en : Sym.SYMBOLS[k].tr) +
                        ' (' + Sym.SYMBOLS[k].items.length + ')';
        sel.appendChild(o);
      });
      sel.value = cur && Sym.SYMBOLS[cur] ? cur : 'mountains';
      this.renderSymbolGrid();
    },

    renderSymbolGrid: function () {
      var grid = $('sym-grid'), cat = $('sym-cat').value;
      if (!grid || !Sym.SYMBOLS[cat]) return;
      grid.innerHTML = '';
      var self = this;
      Sym.SYMBOLS[cat].items.forEach(function (def) {
        var cell = document.createElement('div');
        cell.className = 'sym-cell' + (App.symbol.id === def.id ? ' active' : '');
        var c = document.createElement('canvas');
        c.width = 96; c.height = 96;
        var x = c.getContext('2d');
        Sym.draw(x, def.id, { x: 48, y: 48, size: 84, rot: 0, hue: App.symbol.hue, opacity: 1 });
        cell.appendChild(c);
        var s = document.createElement('small');
        s.textContent = self.lang === 'en' ? def.en : def.tr;
        cell.appendChild(s);
        cell.addEventListener('click', function () {
          App.symbol.id = def.id;
          grid.querySelectorAll('.sym-cell').forEach(function (e) { e.classList.remove('active'); });
          cell.classList.add('active');
          self.setTool('symbol');
        });
        grid.appendChild(cell);
      });
    },

    /* ================= katman listesi ================= */
    refreshLayers: function () {
      var ul = $('layer-list');
      if (!ul) return;
      ul.innerHTML = '';
      var self = this;
      /* üstteki katman listenin başında görünsün */
      var order = Layers.list.slice().reverse();

      order.forEach(function (l) {
        var li = document.createElement('li');
        li.className = 'layer-item' + (Layers.active === l.id ? ' active' : '');
        li.draggable = true;
        li.setAttribute('data-id', l.id);

        var top = document.createElement('div');
        top.className = 'layer-top';

        var vis = document.createElement('button');
        vis.className = 'li-btn' + (l.visible ? '' : ' off');
        vis.textContent = l.visible ? '◉' : '○';
        vis.title = 'visible';
        vis.addEventListener('click', function (e) {
          e.stopPropagation();
          var before = Layers.meta();
          l.visible = !l.visible;
          History.pushMeta(before, Layers.meta(), 'visibility');
          self.refreshLayers(); self.refreshHistory(); Cv.requestRender();
        });

        var lock = document.createElement('button');
        lock.className = 'li-btn' + (l.locked ? '' : ' off');
        lock.textContent = l.locked ? '🔒' : '🔓';
        lock.addEventListener('click', function (e) {
          e.stopPropagation();
          var before = Layers.meta();
          l.locked = !l.locked;
          History.pushMeta(before, Layers.meta(), 'lock');
          self.refreshLayers(); self.refreshHistory();
        });

        var name = document.createElement('span');
        name.className = 'layer-name';
        name.textContent = Layers.name(l, self.lang);

        top.appendChild(vis);
        top.appendChild(lock);
        top.appendChild(name);
        li.appendChild(top);

        var op = document.createElement('input');
        op.type = 'range'; op.className = 'layer-op';
        op.min = 0; op.max = 100; op.value = Math.round(l.opacity * 100);
        var metaBefore = null;
        op.addEventListener('pointerdown', function () { metaBefore = Layers.meta(); });
        op.addEventListener('input', function () { l.opacity = op.value / 100; Cv.requestRender(); });
        op.addEventListener('change', function () {
          if (metaBefore) History.pushMeta(metaBefore, Layers.meta(), 'opacity');
          metaBefore = null;
          self.refreshHistory();
        });
        li.appendChild(op);

        li.addEventListener('click', function () {
          Layers.active = l.id;
          self.refreshLayers();
        });

        li.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/plain', l.id);
          e.dataTransfer.effectAllowed = 'move';
        });
        li.addEventListener('dragover', function (e) { e.preventDefault(); li.classList.add('drag-over'); });
        li.addEventListener('dragleave', function () { li.classList.remove('drag-over'); });
        li.addEventListener('drop', function (e) {
          e.preventDefault();
          li.classList.remove('drag-over');
          var src = e.dataTransfer.getData('text/plain');
          if (!src || src === l.id) return;
          var before = Layers.meta();
          var from = Layers.indexOf(src), to = Layers.indexOf(l.id);
          Layers.move(from, to);
          History.pushMeta(before, Layers.meta(), 'reorder');
          self.refreshLayers(); self.refreshHistory(); Cv.requestRender();
        });

        ul.appendChild(li);
      });
    },

    /* ================= geçmiş listesi ================= */
    refreshHistory: function () {
      var ul = $('history-list');
      if (!ul) return;
      ul.innerHTML = '';
      var self = this;

      var li0 = document.createElement('li');
      li0.textContent = '· ' + this.t('histStart');
      li0.className = History.index === -1 ? 'cur' : '';
      li0.addEventListener('click', function () { History.goto(-1); });
      ul.appendChild(li0);

      History.stack.forEach(function (e, i) {
        var li = document.createElement('li');
        li.textContent = (i + 1) + '. ' + e.label;
        li.className = i === History.index ? 'cur' : (i > History.index ? 'future' : '');
        li.addEventListener('click', function () { History.goto(i); });
        ul.appendChild(li);
      });

      $('btn-undo').disabled = !History.canUndo();
      $('btn-redo').disabled = !History.canRedo();
    },

    /* ================= seçim paneli ================= */
    refreshSelection: function () {
      var box = $('sel-info');
      if (!box) return;
      var o = Tools.selected();
      if (!o) { box.textContent = this.t('selNone'); Cv.requestRender(); return; }
      var kind = App.selection.layerId;
      var desc = kind;
      if (kind === 'symbols') desc += ' · ' + o.sym + ' · ' + Math.round(o.size) + 'px';
      else if (kind === 'labels') desc += ' · "' + (o.text || '').slice(0, 18) + '"';
      else desc += ' · ' + o.pts.length + ' pt';
      box.textContent = desc;

      /* seçili nesnenin değerlerini kaydırıcılara yansıt */
      if (kind === 'symbols') {
        $('sy-size').value = o.size; $('v-sy-size').textContent = Math.round(o.size);
        $('sy-rot').value = o.rot; $('v-sy-rot').textContent = Math.round(o.rot) + '°';
        $('sy-hue').value = o.hue; $('v-sy-hue').textContent = Math.round(o.hue) + '°';
        $('sy-op').value = Math.round(o.opacity * 100); $('v-sy-op').textContent = o.opacity.toFixed(2);
      } else if (kind === 'labels') {
        $('lb-text').value = o.text;
        $('lb-font').value = o.font;
        $('lb-size').value = o.size; $('v-lb-size').textContent = o.size;
        $('lb-curve').value = o.curve; $('v-lb-curve').textContent = o.curve;
        $('lb-track').value = o.track; $('v-lb-track').textContent = o.track;
        $('lb-rot').value = o.rot; $('v-lb-rot').textContent = o.rot + '°';
        $('lb-color').value = o.color;
      } else if (kind === 'rivers') {
        $('rv-w').value = o.width; $('v-rv-w').textContent = o.width;
        $('rv-m').value = Math.round(o.meander * 100); $('v-rv-m').textContent = o.meander.toFixed(2);
      } else if (kind === 'roads') {
        $('rd-w').value = o.width; $('v-rd-w').textContent = o.width;
        $('rd-style').value = o.style;
      }
      Cv.requestRender();
    },

    refreshAll: function () {
      this.refreshLayers();
      this.refreshHistory();
      this.refreshSelection();
      this.status();
    },

    /* ================= durum çubuğu ================= */
    status: function () {
      var p = $('st-pos'), z = $('st-zoom'), s = $('st-size'), t = $('st-tool');
      if (p) p.textContent = Math.round(Cv.mouse.x) + ', ' + Math.round(Cv.mouse.y);
      if (z) z.textContent = Math.round(Cv.zoom * 100) + '%';
      if (s) s.textContent = Cv.W + ' × ' + Cv.H;
      if (t) t.textContent = this.t('t_' + App.tool);
    },

    msg: function (text) {
      var el = $('st-msg');
      if (!el) return;
      el.textContent = text;
      clearTimeout(this.msgTimer);
      this.msgTimer = setTimeout(function () { el.textContent = ''; }, 3200);
    },

    /* ================= modal ================= */
    modal: function (title, bodyHTML, onOk) {
      $('modal-title').textContent = title;
      $('modal-body').innerHTML = bodyHTML;
      $('modal').classList.remove('hidden');
      var m = $('modal');
      function close() {
        m.classList.add('hidden');
        $('modal-ok').removeEventListener('click', ok);
        $('modal-cancel').removeEventListener('click', close);
      }
      function ok() { if (onOk) onOk(); close(); }
      $('modal-ok').addEventListener('click', ok);
      $('modal-cancel').addEventListener('click', close);
    },

    /* ================= klavye ================= */
    bindKeys: function () {
      var self = this;
      var map = { v: 'select', b: 'landmass', e: 'erase', t: 'terrain', s: 'symbol',
                  r: 'river', d: 'road', l: 'label', h: 'pan' };

      window.addEventListener('keydown', function (ev) {
        var tag = (ev.target.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || tag === 'select';

        if (ev.code === 'Space' && !typing) {
          Tools.spaceDown = true;
          Cv.view.classList.add('pan');
          ev.preventDefault();
          return;
        }

        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
          ev.preventDefault();
          if (ev.shiftKey) History.redo(); else History.undo();
          return;
        }
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') {
          ev.preventDefault(); History.redo(); return;
        }
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
          ev.preventDefault(); Exporter.saveProject(); return;
        }
        if (typing) return;

        if (ev.key === 'Enter') { Tools.finishPath(); return; }
        if (ev.key === 'Escape') { Tools.cancelPath(); App.selection = null; self.refreshSelection(); return; }
        if (ev.key === 'Delete' || ev.key === 'Backspace') {
          if (!Tools.undoPathPoint()) Tools.deleteSelection();
          return;
        }
        if (ev.key === '+' || ev.key === '=') { Cv.setZoom(Cv.zoom * 1.15); return; }
        if (ev.key === '-') { Cv.setZoom(Cv.zoom / 1.15); return; }
        if (ev.key === '0') { Cv.fit(); return; }
        if (map[ev.key.toLowerCase()]) self.setTool(map[ev.key.toLowerCase()]);
      });

      window.addEventListener('keyup', function (ev) {
        if (ev.code === 'Space') {
          Tools.spaceDown = false;
          if (App.tool !== 'pan') Cv.view.classList.remove('pan');
        }
      });
    }
  };

  global.UI = UI;
})(window);
