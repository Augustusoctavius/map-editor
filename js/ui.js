/* ============================================================
   Medieval Map Editor — ui.js  v3
   Paneller, i18n (TR/EN), katman listesi, sembol kütüphanesi,
   etiket şablonları, ölçek çubuğu, klavye.
   ============================================================ */
(function (global) {
  'use strict';

  var DICT = {
    tr: {
      new:'Yeni', open:'Aç', save:'Kaydet', parchment:'Parşömen', grid:'Izgara', shore:'Kıyı',
      t_select:'Seç', t_landmass:'Kara', t_erase:'Deniz', t_terrain:'Arazi', t_symbol:'Sembol',
      t_river:'Nehir', t_road:'Yol', t_label:'Etiket', t_pan:'Kaydır', t_eyedrop:'Örnekle',
      o_landmass:'Kara / Kıyı', o_brushsize:'Fırça boyutu', o_rough:'Kıyı sertliği',
      o_landcolor:'Kara rengi', o_shorew:'Kıyı genişliği',
      o_smooth:'Kıyıyı yumuşat', o_clearland:'Karayı temizle',
      h_landmass:'Sürükleyerek kara çiz. "Deniz" aracı hem karayı hem araziyi siler.',
      o_terrain:'Arazi boyama', o_opacity:'Opaklık', o_clip:'Sadece karaya boya',
      o_clearterrain:'Arazi katmanını temizle',
      h_terrain:'Doku her fırça vuruşunda rastgele serpilir — tekrar eden örüntü oluşmaz.',
      o_symbol:'Sembol', o_size:'Boyut', o_rot:'Dönüş', o_hue:'Renk tonu',
      o_jitter:'Yerleştirmede rastgelelik',
      h_symbol:'Kütüphaneden sembol seç, haritaya tıkla. "Seç" aracıyla taşı; Delete ile sil.',
      o_river:'Nehir', o_width:'Kalınlık', o_meander:'Kıvrım',
      o_taper:'Kaynakta incelt', o_color:'Renk',
      h_path:'Tıklayarak nokta ekle. Enter / çift tık ile bitir, Esc ile iptal.',
      o_road:'Yol / Kervan güzergâhı',
      o_label:'Etiket', o_preset:'Stil şablonu', o_curve:'Eğim', o_track:'Harf aralığı',
      h_label:'Şablon seç, metni yaz, haritaya tıkla. Seçili etikette ayarlar anında uygulanır.',
      o_eyedrop:'Doku Örnekleyici', o_eye_nosample:'Henüz örnekleme yapılmadı',
      o_eye_radius:'Örnekleme yarıçapı', o_eye_brush:'Fırça boyutu',
      o_eye_pick:'① Alan seç', o_eye_paint:'② Boyamaya başla', o_eye_clear:'Örneği temizle',
      h_eyedrop:'① Alan seç: sürükleyerek daire çiz. ② Boyamaya başla: dokuyu haritaya uygula.',
      eyeOk:'✓ Doku örneklendi', eyeFail:'Örnekleme başarısız — kara/arazi üstünde dene.',
      eyePick:'Haritada tıklayıp sürükle → daire boyutunu seç → bırak.',
      eyePaint:'Haritaya tıklayıp sürükle → doku uygulanır.',
      eyeNeed:'Önce ① Alan seç ile doku örnekle.',
      o_selection:'Seçim', o_nosel:'Seçili nesne yok', o_dup:'Çoğalt', o_del:'Sil',
      o_scalebar:'Ölçek çubuğu', o_scvis:'Haritada göster', o_sclen:'Uzunluk',
      o_scsize:'Yazı boyutu', o_scsegs:'Bölme sayısı',
      h_scale:'Ölçek çubuğunu haritada sürükleyerek taşıyabilirsin.',
      o_view:'Görünüm', o_fit:'Ekrana sığdır', o_100:'%100',
      h_pan:'Sağ tık + sürükle, orta tık, Space + sürükle veya yön tuşları ile kaydır.',
      tab_layers:'Katmanlar', tab_library:'Kütüphane', tab_history:'Geçmiş',
      ref_title:'Referans görsel', ref_export:"Export'a dahil et", ref_clear:'Referansı kaldır',
      sym_upload:'+ PNG Sembol yükle', sym_upload_done:'sembol yüklendi', sym_del:'Sil',
      st_pos:'Konum', st_zoom:'Yakınlık', st_size:'Tuval', st_tool:'Araç',
      cancel:'Vazgeç', ok:'Tamam',
      locked:'Katman kilitli veya gizli.', needtext:'Önce etiket metnini yaz.',
      exported:'Dışa aktarıldı:', saved:'Proje kaydedildi.', loaded:'Proje yüklendi.',
      badfile:'Geçersiz proje dosyası.', newmap:'Yeni harita oluşturuldu.',
      confirmNew:'Mevcut harita silinecek. Yeni tuval boyutunu seç:',
      confirmSize:'Tuval boyutunu değiştirmek mevcut katmanları ölçekler. Devam edilsin mi?',
      histStart:'Başlangıç', selNone:'Seçili nesne yok', symbols:'sembol',
      selScale:'Ölçek çubuğu seçili',
      t_lake:'Göl', o_lake:'Göl', h_lake:'Tıklayarak nokta ekle, 3+ nokta sonra Enter ile kapat.',
      o_lakecolor:'Göl rengi',
      o_symbbrush:'Fırça modu', o_symbdensity:'Yoğunluk',
      o_windrose:'Pusula Gülü', o_wrvis:'Haritada göster', o_wrsize:'Boyut',
      o_wrstyle:'Stil', o_wrcolor:'Renk', h_windrose:'Haritada sürükleyerek taşı.',
      o_snap:'Izgaraya yapış', o_snapsize:'Izgara boyutu',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    },
    en: {
      new:'New', open:'Open', save:'Save', parchment:'Parchment', grid:'Grid', shore:'Shore',
      t_select:'Select', t_landmass:'Land', t_erase:'Sea', t_terrain:'Terrain', t_symbol:'Symbol',
      t_river:'River', t_road:'Road', t_label:'Label', t_pan:'Pan', t_eyedrop:'Sample',
      o_landmass:'Landmass / Coast', o_brushsize:'Brush size', o_rough:'Coast roughness',
      o_landcolor:'Land colour', o_shorew:'Shore width',
      o_smooth:'Smooth coastline', o_clearland:'Clear landmass',
      h_landmass:'Drag to paint land. The "Sea" tool erases both land and terrain.',
      o_terrain:'Terrain painting', o_opacity:'Opacity', o_clip:'Paint on land only',
      o_clearterrain:'Clear terrain layer',
      h_terrain:'Marks scatter randomly on every stroke — no repeating pattern.',
      o_symbol:'Symbol', o_size:'Size', o_rot:'Rotation', o_hue:'Hue shift',
      o_jitter:'Randomise placement',
      h_symbol:'Pick a symbol, click the map. Use "Select" to move; Delete to remove.',
      o_river:'River', o_width:'Width', o_meander:'Meander',
      o_taper:'Taper at source', o_color:'Colour',
      h_path:'Click to add points. Enter / double-click to finish, Esc to cancel.',
      o_road:'Road / Caravan route',
      o_label:'Label', o_preset:'Style preset', o_curve:'Curve', o_track:'Letter spacing',
      h_label:'Pick a preset, type the text, click the map. Live-applies to a selected label.',
      o_eyedrop:'Texture Sampler', o_eye_nosample:'No sample yet',
      o_eye_radius:'Sample radius', o_eye_brush:'Brush size',
      o_eye_pick:'① Pick area', o_eye_paint:'② Start painting', o_eye_clear:'Clear sample',
      h_eyedrop:'① Pick area: drag a circle. ② Paint: apply the sampled texture.',
      eyeOk:'✓ Texture sampled', eyeFail:'Sampling failed — try over land/terrain.',
      eyePick:'Click and drag on the map → set circle size → release.',
      eyePaint:'Click and drag on the map → texture is applied.',
      eyeNeed:'Sample a texture with ① Pick area first.',
      o_selection:'Selection', o_nosel:'Nothing selected', o_dup:'Duplicate', o_del:'Delete',
      o_scalebar:'Scale bar', o_scvis:'Show on map', o_sclen:'Length',
      o_scsize:'Text size', o_scsegs:'Segments',
      h_scale:'Drag the scale bar on the map to reposition it.',
      o_view:'View', o_fit:'Fit to screen', o_100:'100%',
      h_pan:'Right-click drag, middle-click, Space + drag, or arrow keys to pan.',
      tab_layers:'Layers', tab_library:'Library', tab_history:'History',
      ref_title:'Reference image', ref_export:'Include in export', ref_clear:'Remove reference',
      sym_upload:'+ Upload PNG Symbol', sym_upload_done:'symbol(s) loaded', sym_del:'Delete',
      st_pos:'Pos', st_zoom:'Zoom', st_size:'Canvas', st_tool:'Tool',
      cancel:'Cancel', ok:'OK',
      locked:'Layer is locked or hidden.', needtext:'Type the label text first.',
      exported:'Exported:', saved:'Project saved.', loaded:'Project loaded.',
      badfile:'Invalid project file.', newmap:'New map created.',
      confirmNew:'The current map will be discarded. Choose a canvas size:',
      confirmSize:'Changing canvas size rescales existing layers. Continue?',
      histStart:'Start', selNone:'Nothing selected', symbols:'symbols',
      selScale:'Scale bar selected',
      t_lake:'Lake', o_lake:'Lake', h_lake:'Click to add points, 3+ points then Enter to close.',
      o_lakecolor:'Lake colour',
      o_symbbrush:'Brush mode', o_symbdensity:'Density',
      o_windrose:'Windrose', o_wrvis:'Show on map', o_wrsize:'Size',
      o_wrstyle:'Style', o_wrcolor:'Colour', h_windrose:'Drag on the map to reposition.',
      o_snap:'Snap to grid', o_snapsize:'Grid size',
      o_png2x:'PNG 2×', o_png4x:'PNG 4×'
    }
  };

  function $(id){ return document.getElementById(id); }
  function on(id, ev, fn){ var el = $(id); if (el) el.addEventListener(ev, fn); }

  var UI = {
    lang:'tr',
    editSnapshot:null,
    scaleSnapshot:null,
    msgTimer:0,

    t: function (k) { return (DICT[this.lang] && DICT[this.lang][k]) || DICT.tr[k] || k; },

    init: function () {
      this.buildTerrainSwatches();
      this.buildLabelPresets();
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
      document.documentElement.lang = this.lang;
      this.buildTerrainSwatches();
      this.buildLabelPresets();
      this.buildSymbolLibrary();
      this.refreshLayers();
      this.refreshSelection();
      this.status();
    },

    /* ================= üst toolbar ================= */
    bindTopbar: function () {
      var self = this;

      on('btn-new', 'click', function () {
        self.modal(self.t('new'),
          '<p>' + self.t('confirmNew') + '</p>' +
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

      on('chk-shore', 'change', function (e) { Cv.shore = e.target.checked; Cv.requestRender(); });
      on('chk-parchment', 'change', function (e) { Cv.parchment = e.target.checked; Cv.requestRender(); });
      on('chk-grid', 'change', function (e) { Cv.grid = e.target.checked; Cv.requestRender(); });

      on('sel-canvas-size', 'change', function (e) {
        var s = parseInt(e.target.value, 10);
        if (confirm(self.t('confirmSize'))) {
          var ratio = s / Cv.W;
          Cv.setSize(s, s, true);
          /* Ölçek çubuğunu yeni canvas boyutuna oranla */
          App.scale.x   = Math.round(App.scale.x   * ratio);
          App.scale.y   = Math.round(App.scale.y   * ratio);
          App.scale.len = Math.round(App.scale.len  * ratio);
          App.scale.size= Math.round(App.scale.size * ratio);
          /* Windrose'u da oranla */
          App.windrose.x    = Math.round(App.windrose.x    * ratio);
          App.windrose.y    = Math.round(App.windrose.y    * ratio);
          App.windrose.size = Math.round(App.windrose.size * ratio);
          History.clear();
          self.refreshAll();
        } else e.target.value = String(Cv.W);
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

    /* ================= kaydırıcı yardımcısı ================= */
    range: function (id, valId, fn, fmt) {
      var self = this, el = $(id);
      if (!el) return;
      el.addEventListener('pointerdown', function () { self.editStart(); });
      el.addEventListener('input', function () {
        var v = parseFloat(el.value);
        if (valId) $(valId).textContent = fmt ? fmt(v) : v;
        fn(v);
        Cv.requestRender();
      });
      el.addEventListener('change', function () { self.editCommit(); });
    },

    editStart: function () {
      if (this.editSnapshot || !App.selection) return;
      if (App.selection.layerId === 'scale') {
        this.scaleSnapshot = JSON.parse(JSON.stringify(App.scale));
        return;
      }
      var L = Layers.get(App.selection.layerId);
      if (!L) return;
      this.editSnapshot = { layerId:App.selection.layerId, arr:JSON.parse(JSON.stringify(L.objects)) };
    },

    editCommit: function () {
      if (this.scaleSnapshot) {
        History.pushScale(this.scaleSnapshot, JSON.parse(JSON.stringify(App.scale)), 'scale');
        this.scaleSnapshot = null;
        this.refreshHistory();
      }
      if (!this.editSnapshot) return;
      var s = this.editSnapshot;
      this.editSnapshot = null;
      if (!App.selection || App.selection.layerId !== s.layerId) return;
      Tools.commitSelectionEdit(s.arr, 'edit');
    },

    selIs: function (layerId) {
      return App.selection && App.selection.layerId === layerId;
    },

    /* ================= araç seçenekleri ================= */
    bindOptions: function () {
      var self = this;

      /* --- kara / deniz --- */
      this.range('lm-size', 'v-lm-size', function (v) { App.brush.size = v; });
      this.range('lm-rough', 'v-lm-rough', function (v) { App.brush.roughness = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('lm-color', 'input', function (e) { App.brush.color = e.target.value; });
      this.range('shore-w', 'v-shore-w', function (v) {
        Cv.shoreWidth = v; Cv.shoreDirty = true;
      });
      on('btn-smooth', 'click', function () { Tools.smoothCoast(6); });
      on('btn-clear-land', 'click', function () { Tools.clearRasterLayer('landmass'); });

      /* --- arazi --- */
      this.range('tr-size', 'v-tr-size', function (v) { App.terrain.size = v; });
      this.range('tr-op', 'v-tr-op', function (v) { App.terrain.opacity = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('tr-clip', 'change', function (e) { App.terrain.clip = e.target.checked; });
      on('btn-clear-terrain', 'click', function () { Tools.clearRasterLayer('terrain'); });

      /* --- sembol --- */
      this.range('sy-size', 'v-sy-size', function (v) {
        App.symbol.size = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ size:v });
      });
      this.range('sy-rot', 'v-sy-rot', function (v) {
        App.symbol.rot = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ rot:v });
      }, function (v) { return v + '°'; });
      this.range('sy-hue', 'v-sy-hue', function (v) {
        App.symbol.hue = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ hue:v });
      }, function (v) { return v + '°'; });
      this.range('sy-op', 'v-sy-op', function (v) {
        App.symbol.opacity = v/100;
        if (self.selIs('symbols')) Tools.applyToSelection({ opacity:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      on('sy-jitter', 'change', function (e) { App.symbol.jitter = e.target.checked; });

      /* --- nehir --- */
      this.range('rv-w', 'v-rv-w', function (v) {
        App.river.width = v;
        if (self.selIs('rivers')) Tools.applyToSelection({ width:v });
      });
      this.range('rv-m', 'v-rv-m', function (v) {
        App.river.meander = v/100;
        if (self.selIs('rivers')) Tools.applyToSelection({ meander:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      on('rv-taper', 'change', function (e) {
        App.river.taper = e.target.checked;
        self.editStart();
        if (self.selIs('rivers')) Tools.applyToSelection({ taper:e.target.checked });
        self.editCommit();
      });
      on('rv-color', 'input', function (e) {
        App.river.color = e.target.value;
        if (self.selIs('rivers')) Tools.applyToSelection({ color:e.target.value });
      });

      /* --- yol --- */
      on('rd-style', 'change', function (e) {
        App.road.style = e.target.value;
        self.editStart();
        if (self.selIs('roads')) Tools.applyToSelection({ style:e.target.value });
        self.editCommit();
      });
      this.range('rd-w', 'v-rd-w', function (v) {
        App.road.width = v;
        if (self.selIs('roads')) Tools.applyToSelection({ width:v });
      });
      on('rd-color', 'input', function (e) {
        App.road.color = e.target.value;
        if (self.selIs('roads')) Tools.applyToSelection({ color:e.target.value });
      });

      /* --- etiket --- */
      function labelEdit(props) { if (self.selIs('labels')) Tools.applyToSelection(props); }

      on('lb-text', 'input', function (e) {
        labelEdit({ text:e.target.value });
        self.drawLabelPreview();
        Cv.requestRender();
      });

      on('lb-preset', 'change', function (e) {
        self.applyPreset(e.target.value);
        self.editStart();
        if (self.selIs('labels')) {
          var p = LABEL_PRESETS[e.target.value];
          Tools.applyToSelection({
            preset:e.target.value, font:p.font, color:p.color, outline:p.outline,
            outlineColor:p.outlineColor, shadow:p.shadow, track:p.track,
            caps:p.caps, banner:p.banner, size:p.size
          });
        }
        self.editCommit();
        self.drawLabelPreview();
        Cv.requestRender();
      });

      this.range('lb-size', 'v-lb-size', function (v) { App.label.size = v; labelEdit({ size:v }); self.drawLabelPreview(); });
      this.range('lb-curve', 'v-lb-curve', function (v) { App.label.curve = v; labelEdit({ curve:v }); });
      this.range('lb-track', 'v-lb-track', function (v) { App.label.track = v; labelEdit({ track:v }); self.drawLabelPreview(); });
      this.range('lb-rot', 'v-lb-rot', function (v) { App.label.rot = v; labelEdit({ rot:v }); },
                 function (v) { return v + '°'; });
      on('lb-color', 'input', function (e) {
        App.label.color = e.target.value;
        labelEdit({ color:e.target.value });
        self.drawLabelPreview();
        Cv.requestRender();
      });

      /* --- örnekleyici --- */
      on('eye-r', 'input', function (e) {
        App.eyedrop.radius = parseFloat(e.target.value);
        $('v-eye-r').textContent = e.target.value;
      });
      on('eye-br', 'input', function (e) {
        App.eyedrop.brushRadius = parseFloat(e.target.value);
        $('v-eye-br').textContent = e.target.value;
        Cv.requestRender();
      });
      on('eye-layer', 'change', function (e) { App.eyedrop.targetLayer = e.target.value; });
      on('btn-eye-pick', 'click', function () {
        Eyedropper.active = false; Eyedropper.sample = null; Eyedropper.picking = false;
        App.eyedrop.hasSample = false; App.eyedrop.painting = false;
        self.setTool('eyedrop');
        self.refreshEyedropPanel();
        self.msg(self.t('eyePick'));
      });
      on('btn-eye-paint', 'click', function () {
        if (!Eyedropper.sample) { self.msg(self.t('eyeNeed')); return; }
        App.eyedrop.painting = true;
        App.eyedrop.hasSample = true;
        self.setTool('eyedrop');
        self.refreshEyedropPanel();
        self.msg(self.t('eyePaint'));
      });
      on('btn-eye-clear', 'click', function () {
        Eyedropper.sample = null; Eyedropper.active = false;
        App.eyedrop.hasSample = false; App.eyedrop.painting = false;
        self.refreshEyedropPanel();
        Cv.requestRender();
      });

      /* --- seçim --- */
      on('btn-del', 'click', function () { Tools.deleteSelection(); });
      on('btn-dup', 'click', function () { Tools.duplicateSelection(); });

      /* --- ölçek çubuğu --- */
      on('sc-visible', 'change', function (e) {
        var b = JSON.parse(JSON.stringify(App.scale));
        App.scale.visible = e.target.checked;
        History.pushScale(b, JSON.parse(JSON.stringify(App.scale)), 'scale:visible');
        self.refreshHistory();
        Cv.requestRender();
      });
      on('sc-label', 'input', function (e) { App.scale.label = e.target.value; Cv.requestRender(); });
      on('sc-label', 'change', function () {
        History.pushScale(App.scale, JSON.parse(JSON.stringify(App.scale)), 'scale:label');
        self.refreshHistory();
      });
      this.range('sc-len', 'v-sc-len', function (v) { App.scale.len = v; });
      this.range('sc-size', 'v-sc-size', function (v) { App.scale.size = v; });
      this.range('sc-segs', 'v-sc-segs', function (v) { App.scale.segs = Math.round(v); });

      /* --- sembol fırçası --- */
      on('sy-brush-mode', 'change', function (e) { App.symbol.brushMode = e.target.checked; });
      self.range('sy-brush-density', 'v-sy-br-den', function (v) { App.symbol.brushDensity = v/100; },
                 function (v) { return (v/100).toFixed(2); });

      /* --- göl --- */
      on('lk-color', 'input', function (e) { App.lake.color = e.target.value; });

      /* --- windrose --- */
      on('wr-visible', 'change', function (e) {
        var b = JSON.parse(JSON.stringify(App.windrose));
        App.windrose.visible = e.target.checked;
        History.pushWindrose(b, JSON.parse(JSON.stringify(App.windrose)), 'windrose:visible');
        self.refreshHistory(); Cv.requestRender();
      });
      self.range('wr-size', 'v-wr-size', function (v) { App.windrose.size = v; });
      on('wr-color', 'input', function (e) { App.windrose.color = e.target.value; Cv.requestRender(); });

      /* --- snap --- */
      on('snap-enabled', 'change', function (e) { App.snap.enabled = e.target.checked; });
      self.range('snap-size', 'v-snap-size', function (v) { App.snap.size = Math.round(v); });

      /* --- PNG export ölçeği --- */
      on('btn-export-png2', 'click', function () { Exporter.png(2); });
      on('btn-export-png4', 'click', function () { Exporter.png(4); });

      /* --- görünüm --- */
      on('btn-fit', 'click', function () { Cv.fit(); });
      on('btn-100', 'click', function () { Cv.setZoom(1); });

      /* --- referans --- */
      on('ref-file', 'change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var im = new Image();
          im.onload = function () {
            var L = Layers.get('reference');
            L.image = im; L.imageData = r.result; L.visible = true;
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

      /* --- custom PNG sembol --- */
      on('btn-sym-upload', 'click', function () { $('sym-file').click(); });
      on('sym-file', 'change', function (e) {
        var files = e.target.files;
        if (!files || !files.length) return;
        var loaded = 0, total = files.length;
        Array.prototype.forEach.call(files, function (f) {
          var r = new FileReader();
          r.onload = function () {
            var im = new Image();
            im.onload = function () {
              var id = 'cus_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
              Sym.addCustom(id, f.name.replace(/\.[^.]+$/, ''), r.result, im.naturalWidth, im.naturalHeight);
              loaded++;
              if (loaded === total) {
                self.renderCustomSymGrid();
                self.msg(total + ' ' + self.t('sym_upload_done'));
              }
            };
            im.src = r.result;
          };
          r.readAsDataURL(f);
        });
        e.target.value = '';
      });
    },

    /* ================= etiket şablonları ================= */
    buildLabelPresets: function () {
      var sel = $('lb-preset');
      if (!sel) return;
      var cur = sel.value || App.label.preset;
      sel.innerHTML = '';
      var self = this;
      Object.keys(LABEL_PRESETS).forEach(function (k) {
        var o = document.createElement('option');
        o.value = k;
        o.textContent = self.lang === 'en' ? LABEL_PRESETS[k].en : LABEL_PRESETS[k].tr;
        sel.appendChild(o);
      });
      sel.value = LABEL_PRESETS[cur] ? cur : 'region';
      this.drawLabelPreview();
    },

    applyPreset: function (key) {
      var p = LABEL_PRESETS[key];
      if (!p) return;
      App.label.preset = key;
      App.label.font = p.font;
      App.label.size = p.size;
      App.label.color = p.color;
      App.label.outline = p.outline;
      App.label.outlineColor = p.outlineColor;
      App.label.shadow = p.shadow;
      App.label.track = p.track;
      App.label.caps = p.caps;
      App.label.banner = p.banner;
      $('lb-size').value = p.size;   $('v-lb-size').textContent = p.size;
      $('lb-track').value = p.track; $('v-lb-track').textContent = p.track;
      $('lb-color').value = p.color;
    },

    drawLabelPreview: function () {
      var c = $('lb-preview');
      if (!c) return;
      var x = c.getContext('2d');
      x.clearRect(0, 0, c.width, c.height);
      x.fillStyle = '#cdbf9c';
      x.fillRect(0, 0, c.width, c.height);

      var txt = ($('lb-text') && $('lb-text').value.trim()) || 'Sideria';
      var o = {
        text:txt, x:c.width/2, y:c.height/2, font:App.label.font,
        size:20, color:App.label.color, outline:App.label.outline,
        outlineColor:App.label.outlineColor, shadow:App.label.shadow,
        curve:0, track:Math.min(6, App.label.track), rot:0,
        caps:App.label.caps, banner:App.label.banner, opacity:1
      };
      /* önizleme genişliğe sığsın */
      var save = Cv.ctx;
      Cv.ctx = x;
      var w = Cv.measureLabel(x, o);
      var maxW = c.width - (o.banner ? 46 : 16);
      if (w > maxW) o.size = Math.max(8, 20 * maxW / w);
      Cv.drawLabel(x, o);
      Cv.ctx = save;
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
        b.className = 'terrain-sw' + (App.terrain.type === key ? ' active' : '');
        var c = document.createElement('canvas');
        c.width = 90; c.height = 34;
        c.getContext('2d').drawImage(Terrain.swatch(key, 90, 34), 0, 0);
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
      sel.value = cur && Sym.SYMBOLS[cur] ? cur : 'castles';
      this.renderSymbolGrid();
    },

    renderSymbolGrid: function () {
      var grid = $('sym-grid'), cat = $('sym-cat') && $('sym-cat').value;
      if (!grid || !Sym.SYMBOLS[cat]) return;
      grid.innerHTML = '';
      var self = this;
      Sym.SYMBOLS[cat].items.forEach(function (def) {
        var cell = document.createElement('div');
        cell.className = 'sym-cell' + (App.symbol.id === def.id ? ' active' : '');
        var c = document.createElement('canvas');
        c.width = 96; c.height = 96;
        Sym.draw(c.getContext('2d'), def.id, { x:48, y:48, size:86, rot:0, hue:0, opacity:1 });
        cell.appendChild(c);
        var s = document.createElement('small');
        s.textContent = self.lang === 'en' ? def.en : def.tr;
        cell.appendChild(s);
        cell.addEventListener('click', function () {
          App.symbol.id = def.id;
          grid.querySelectorAll('.sym-cell').forEach(function (e) { e.classList.remove('active'); });
          document.querySelectorAll('#custom-sym-grid .sym-cell').forEach(function (e) { e.classList.remove('active'); });
          cell.classList.add('active');
          self.setTool('symbol');
        });
        grid.appendChild(cell);
      });
    },

    renderCustomSymGrid: function () {
      var g = $('custom-sym-grid');
      if (!g) return;
      g.innerHTML = '';
      var self = this;
      var customs = Sym.getCustomAll();
      if (!customs.length) { g.style.display = 'none'; return; }
      g.style.display = 'grid';
      customs.forEach(function (def) {
        var cell = document.createElement('div');
        cell.className = 'sym-cell' + (App.symbol.id === def.id ? ' active' : '');
        cell.style.position = 'relative';
        var cv = document.createElement('canvas');
        cv.width = 96; cv.height = 96;
        Sym.loadImg(def.dataURL, function (im) {
          if (!im) return;
          var x = cv.getContext('2d');
          x.clearRect(0, 0, 96, 96);
          x.drawImage(im, 0, 0, 96, 96);
        });
        cell.appendChild(cv);
        var s = document.createElement('small');
        s.textContent = def.tr;
        cell.appendChild(s);
        var del = document.createElement('button');
        del.className = 'sym-del';
        del.textContent = '✕';
        del.title = self.t('sym_del');
        del.addEventListener('click', function (e) {
          e.stopPropagation();
          Sym.removeCustom(def.id);
          if (App.symbol.id === def.id) App.symbol.id = 'ik_knight';
          self.renderCustomSymGrid();
        });
        cell.appendChild(del);
        cell.addEventListener('click', function () {
          App.symbol.id = def.id;
          document.querySelectorAll('.sym-cell').forEach(function (e) { e.classList.remove('active'); });
          cell.classList.add('active');
          self.setTool('symbol');
        });
        g.appendChild(cell);
      });
    },

    /* ================= katman listesi ================= */
    refreshLayers: function () {
      var ul = $('layer-list');
      if (!ul) return;
      ul.innerHTML = '';
      var self = this;
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
        vis.addEventListener('click', function (e) {
          e.stopPropagation();
          var before = Layers.meta();
          l.visible = !l.visible;
          if (l.id === 'landmass') Cv.shoreDirty = true;
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

        top.appendChild(vis); top.appendChild(lock); top.appendChild(name);
        li.appendChild(top);

        var op = document.createElement('input');
        op.type = 'range'; op.className = 'layer-op';
        op.min = 0; op.max = 100; op.value = Math.round(l.opacity * 100);
        var metaBefore = null;
        op.addEventListener('pointerdown', function () { metaBefore = Layers.meta(); });
        op.addEventListener('input', function () { l.opacity = op.value/100; Cv.requestRender(); });
        op.addEventListener('change', function () {
          if (metaBefore) History.pushMeta(metaBefore, Layers.meta(), 'opacity');
          metaBefore = null;
          self.refreshHistory();
        });
        li.appendChild(op);

        li.addEventListener('click', function () { Layers.active = l.id; self.refreshLayers(); });

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
          Layers.move(Layers.indexOf(src), Layers.indexOf(l.id));
          History.pushMeta(before, Layers.meta(), 'reorder');
          self.refreshLayers(); self.refreshHistory(); Cv.requestRender();
        });

        ul.appendChild(li);
      });
    },

    /* ================= geçmiş ================= */
    refreshHistory: function () {
      var ul = $('history-list');
      if (!ul) return;
      ul.innerHTML = '';

      var li0 = document.createElement('li');
      li0.textContent = '· ' + this.t('histStart');
      li0.className = History.index === -1 ? 'cur' : '';
      li0.addEventListener('click', function () { History.goto(-1); });
      ul.appendChild(li0);

      History.stack.forEach(function (e, i) {
        var li = document.createElement('li');
        li.textContent = (i+1) + '. ' + e.label;
        li.className = i === History.index ? 'cur' : (i > History.index ? 'future' : '');
        li.addEventListener('click', function () { History.goto(i); });
        ul.appendChild(li);
      });

      if ($('btn-undo')) $('btn-undo').disabled = !History.canUndo();
      if ($('btn-redo')) $('btn-redo').disabled = !History.canRedo();
    },

    /* ================= seçim paneli ================= */
    refreshSelection: function () {
      var box = $('sel-info');
      if (!box) return;

      if (App.selection && App.selection.layerId === 'scale') {
        box.textContent = this.t('selScale');
        Cv.requestRender();
        return;
      }

      var o = Tools.selected();
      if (!o) { box.textContent = this.t('selNone'); Cv.requestRender(); return; }

      var kind = App.selection.layerId, desc = kind;
      if (kind === 'symbols') desc += ' · ' + o.sym + ' · ' + Math.round(o.size) + 'px';
      else if (kind === 'labels') desc += ' · "' + (o.text||'').slice(0,18) + '"';
      else desc += ' · ' + o.pts.length + ' pt';
      box.textContent = desc;

      if (kind === 'symbols') {
        $('sy-size').value = o.size;  $('v-sy-size').textContent = Math.round(o.size);
        $('sy-rot').value = o.rot;    $('v-sy-rot').textContent = Math.round(o.rot)+'°';
        $('sy-hue').value = o.hue;    $('v-sy-hue').textContent = Math.round(o.hue)+'°';
        $('sy-op').value = Math.round(o.opacity*100);
        $('v-sy-op').textContent = o.opacity.toFixed(2);
      } else if (kind === 'labels') {
        $('lb-text').value = o.text;
        if (o.preset && LABEL_PRESETS[o.preset]) $('lb-preset').value = o.preset;
        $('lb-size').value = o.size;    $('v-lb-size').textContent = o.size;
        $('lb-curve').value = o.curve;  $('v-lb-curve').textContent = o.curve;
        $('lb-track').value = o.track;  $('v-lb-track').textContent = o.track;
        $('lb-rot').value = o.rot;      $('v-lb-rot').textContent = o.rot+'°';
        $('lb-color').value = o.color;
      } else if (kind === 'rivers') {
        $('rv-w').value = o.width;  $('v-rv-w').textContent = o.width;
        $('rv-m').value = Math.round(o.meander*100);
        $('v-rv-m').textContent = o.meander.toFixed(2);
      } else if (kind === 'roads') {
        $('rd-w').value = o.width;  $('v-rd-w').textContent = o.width;
        $('rd-style').value = o.style;
      }
      Cv.requestRender();
    },

    refreshScalePanel: function () {
      if (!$('sc-len')) return;
      $('sc-visible').checked = App.scale.visible;
      $('sc-label').value = App.scale.label;
      $('sc-len').value = App.scale.len;   $('v-sc-len').textContent = Math.round(App.scale.len);
      $('sc-size').value = App.scale.size; $('v-sc-size').textContent = App.scale.size;
      $('sc-segs').value = App.scale.segs; $('v-sc-segs').textContent = App.scale.segs;
    },

    refreshEyedropPanel: function () {
      var el = $('eyedrop-status');
      if (!el) return;
      var s = Eyedropper.sample;
      if (!s) {
        el.textContent = this.t('o_eye_nosample');
        el.style.color = '';
        if ($('btn-eye-paint')) $('btn-eye-paint').disabled = true;
        return;
      }
      el.textContent = (App.eyedrop.painting ? '🖌 ' : '✓ ') +
                       'r=' + Math.round(s.radius) + ' · ' + s.edges.length + ' · ' + s.baseColor;
      el.style.color = App.eyedrop.painting ? '#6f9a63' : '#c99a4b';
      if ($('btn-eye-paint')) $('btn-eye-paint').disabled = false;
    },

    refreshAll: function () {
      this.refreshLayers();
      this.refreshHistory();
      this.refreshSelection();
      this.refreshScalePanel();
      this.refreshWindrosePanel();
      this.refreshEyedropPanel();
      this.renderCustomSymGrid();
      this.status();
    },

    refreshWindrosePanel: function () {
      if (!$('wr-size')) return;
      $('wr-visible').checked = App.windrose.visible;
      $('wr-size').value = App.windrose.size; $('v-wr-size').textContent = App.windrose.size;
      $('wr-color').value = App.windrose.color || '#3a2b18';
    },

    /* ================= durum çubuğu ================= */
    status: function () {
      var p = $('st-pos'), z = $('st-zoom'), s = $('st-size'), t = $('st-tool');
      if (p) p.textContent = Math.round(Cv.mouse.x) + ', ' + Math.round(Cv.mouse.y);
      if (z) z.textContent = Math.round(Cv.zoom*100) + '%';
      if (s) s.textContent = Cv.W + ' × ' + Cv.H;
      if (t) t.textContent = this.t('t_' + App.tool);
    },

    msg: function (text) {
      var el = $('st-msg');
      if (!el) return;
      el.textContent = text;
      clearTimeout(this.msgTimer);
      this.msgTimer = setTimeout(function () { el.textContent = ''; }, 3600);
    },

    /* ================= modal ================= */
    modal: function (title, bodyHTML, onOk) {
      $('modal-title').textContent = title;
      $('modal-body').innerHTML = bodyHTML;
      var m = $('modal');
      m.classList.remove('hidden');
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
      var map = { v:'select', b:'landmass', e:'erase', t:'terrain', s:'symbol',
                  r:'river', d:'road', l:'label', h:'pan', i:'eyedrop', k:'lake' };

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
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') { ev.preventDefault(); History.redo(); return; }
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); Exporter.saveProject(); return; }
        if (typing) return;

        /* yön tuşları ile kaydırma */
        var step = ev.shiftKey ? 220 : 70;
        if (ev.key === 'ArrowLeft')  { ev.preventDefault(); Cv.panBy( step, 0); return; }
        if (ev.key === 'ArrowRight') { ev.preventDefault(); Cv.panBy(-step, 0); return; }
        if (ev.key === 'ArrowUp')    { ev.preventDefault(); Cv.panBy(0,  step); return; }
        if (ev.key === 'ArrowDown')  { ev.preventDefault(); Cv.panBy(0, -step); return; }

        if (ev.key === 'Enter') { Tools.finishPath(); return; }
        if (ev.key === 'Escape') { Tools.cancelPath(); App.selection = null; self.refreshSelection(); return; }
        if (ev.key === 'Delete' || ev.key === 'Backspace') {
          if (!Tools.undoPathPoint()) Tools.deleteSelection();
          return;
        }
        if (ev.key === '+' || ev.key === '=') { Cv.setZoom(Cv.zoom*1.15); return; }
        if (ev.key === '-') { Cv.setZoom(Cv.zoom/1.15); return; }
        if (ev.key === '0') { Cv.fit(); return; }
        /* sembol döndürme */
        if (ev.key === '[') {
          App.symbol.rot = (App.symbol.rot - 15 + 360) % 360;
          if ($('sy-rot')) { $('sy-rot').value = App.symbol.rot; $('v-sy-rot').textContent = Math.round(App.symbol.rot) + '°'; }
          if (self.selIs('symbols')) Tools.applyToSelection({ rot: App.symbol.rot });
          Cv.requestRender(); return;
        }
        if (ev.key === ']') {
          App.symbol.rot = (App.symbol.rot + 15) % 360;
          if ($('sy-rot')) { $('sy-rot').value = App.symbol.rot; $('v-sy-rot').textContent = Math.round(App.symbol.rot) + '°'; }
          if (self.selIs('symbols')) Tools.applyToSelection({ rot: App.symbol.rot });
          Cv.requestRender(); return;
        }
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
