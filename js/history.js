/* ============================================================
   Cartographer — history.js
   50 adımlık geri al / ileri al.
   Raster işlemler bbox yaması (PNG dataURL) olarak saklanır,
   vektör işlemler JSON anlık görüntüsü olarak.
   ============================================================ */
(function (global) {
  'use strict';

  var imgCache = {};

  function loadImage(url) {
    if (imgCache[url]) return Promise.resolve(imgCache[url]);
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { imgCache[url] = im; res(im); };
      im.onerror = rej;
      im.src = url;
    });
  }

  function cropDataURL(srcCanvas, x, y, w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    var cx = c.getContext('2d');
    cx.drawImage(srcCanvas, Math.round(x), Math.round(y), c.width, c.height, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  var History = {
    stack: [],
    index: -1,
    limit: 50,
    busy: false,
    onChange: null,

    clear: function () {
      this.stack = [];
      this.index = -1;
      imgCache = {};
      this._changed();
    },

    _changed: function () { if (this.onChange) this.onChange(); },

    push: function (entry) {
      if (this.busy) return;
      this.stack.length = this.index + 1;
      this.stack.push(entry);
      if (this.stack.length > this.limit) this.stack.shift();
      this.index = this.stack.length - 1;
      this._changed();
    },

    /* ---- raster yaması ---- */
    pushRaster: function (layerId, beforeCanvas, afterCanvas, box, label) {
      var x = Math.max(0, Math.floor(box.x)), y = Math.max(0, Math.floor(box.y));
      var w = Math.min(afterCanvas.width - x, Math.ceil(box.w));
      var h = Math.min(afterCanvas.height - y, Math.ceil(box.h));
      if (w <= 0 || h <= 0) return;
      this.push({
        kind: 'raster', layerId: layerId, label: label || 'raster',
        x: x, y: y, w: w, h: h,
        before: cropDataURL(beforeCanvas, x, y, w, h),
        after: cropDataURL(afterCanvas, x, y, w, h)
      });
    },

    /* ---- vektör anlık görüntüsü ---- */
    pushVector: function (layerId, beforeArr, afterArr, label) {
      this.push({
        kind: 'vector', layerId: layerId, label: label || 'vector',
        before: JSON.stringify(beforeArr), after: JSON.stringify(afterArr)
      });
    },

    /* ---- katman meta ---- */
    pushMeta: function (beforeMeta, afterMeta, label) {
      this.push({
        kind: 'meta', label: label || 'meta',
        before: JSON.stringify(beforeMeta), after: JSON.stringify(afterMeta)
      });
    },

    _apply: function (entry, dir) {
      var self = this;
      var data = dir === 'undo' ? entry.before : entry.after;

      if (entry.kind === 'raster') {
        var layer = Layers.get(entry.layerId);
        if (!layer || !layer.canvas) return Promise.resolve();
        return loadImage(data).then(function (im) {
          var cx = layer.ctx;
          cx.save();
          cx.setTransform(1, 0, 0, 1, 0, 0);
          cx.globalCompositeOperation = 'source-over';
          cx.globalAlpha = 1;
          cx.clearRect(entry.x, entry.y, entry.w, entry.h);
          cx.drawImage(im, entry.x, entry.y);
          cx.restore();
        });
      }

      if (entry.kind === 'vector') {
        var l = Layers.get(entry.layerId);
        if (l) l.objects = JSON.parse(data);
        if (global.App) App.selection = null;
        return Promise.resolve();
      }

      if (entry.kind === 'meta') {
        Layers.applyMeta(JSON.parse(data));
        return Promise.resolve();
      }
      return Promise.resolve();
    },

    undo: function () {
      if (this.index < 0 || this.busy) return Promise.resolve(false);
      var e = this.stack[this.index];
      var self = this;
      this.busy = true;
      return this._apply(e, 'undo').then(function () {
        self.index--;
        self.busy = false;
        self._changed();
        Cv.requestRender();
        if (global.UI) UI.refreshAll();
        return true;
      });
    },

    redo: function () {
      if (this.index >= this.stack.length - 1 || this.busy) return Promise.resolve(false);
      var e = this.stack[this.index + 1];
      var self = this;
      this.busy = true;
      return this._apply(e, 'redo').then(function () {
        self.index++;
        self.busy = false;
        self._changed();
        Cv.requestRender();
        if (global.UI) UI.refreshAll();
        return true;
      });
    },

    /* geçmiş panelinden belirli bir adıma atla */
    goto: function (target) {
      var self = this;
      function step() {
        if (self.index === target) return Promise.resolve();
        if (self.index > target) return self.undo().then(step);
        return self.redo().then(step);
      }
      return step();
    },

    canUndo: function () { return this.index >= 0; },
    canRedo: function () { return this.index < this.stack.length - 1; }
  };

  global.History = History;
})(window);
