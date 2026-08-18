/* ============================================================
   Cartographer — tools.js  v3
   Araç mantığı: kara/deniz fırçası (silgi arazi katmanını da
   siler), prosedürel arazi serpme, sembol, nehir, yol, etiket,
   doku örnekleyici, seçim, ölçek çubuğu, sağ tık pan.
   ============================================================ */
(function (global) {
  'use strict';

  function uid(){return 'o'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);}
  function $(id){return document.getElementById(id);}
  function snap(c){ var t=document.createElement('canvas'); t.width=c.width; t.height=c.height;
                    t.getContext('2d').drawImage(c,0,0); return t; }

  /* Fırça vuruşu sırasında (stampTerrain/eyedropStamp) tekrar tekrar canvas
     oluşturmamak için tek seferlik, sadece büyüyen bir scratch canvas havuzu. */
  var _scratchPool = {};
  function scratchCanvas(key, w, h) {
    var s = _scratchPool[key];
    if (!s) { s = document.createElement('canvas'); _scratchPool[key] = s; }
    if (s.width < w) s.width = w;
    if (s.height < h) s.height = h;
    var ctx = s.getContext('2d');
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, s.width, s.height);
    return s;
  }

  /* ====================================================================
     DOKU ÖRNEKLEYİCİ
     ==================================================================== */
  var Eyedropper = {
    active:false, sample:null, picking:false, pickPos:null, pickR:60,

    analyze: function (cx, cy, radius) {
      var W = Cv.W, H = Cv.H;
      var tmp = document.createElement('canvas');
      tmp.width = W; tmp.height = H;
      var tx = tmp.getContext('2d', { willReadFrequently:true });
      try { Cv.renderMap(tx, { includeReference:false }); }
      catch (e) {
        Layers.list.forEach(function (l) {
          if (l.type === 'raster' && l.visible && l.canvas) tx.drawImage(l.canvas, 0, 0);
        });
      }

      var r = Math.max(4, Math.round(radius));
      var x0 = Math.max(0, Math.round(cx-r)), y0 = Math.max(0, Math.round(cy-r));
      var x1 = Math.min(W, Math.round(cx+r)), y1 = Math.min(H, Math.round(cy+r));
      var w = x1-x0, h = y1-y0;
      if (w < 2 || h < 2) return null;

      var id, d;
      try { id = tx.getImageData(x0, y0, w, h); d = id.data; }
      catch (e) { console.warn('getImageData:', e); return null; }

      var rSum=0,gSum=0,bSum=0,cnt=0;
      for (var py=0; py<h; py++) for (var px=0; px<w; px++) {
        var dx=px-w/2, dy=py-h/2;
        if (dx*dx+dy*dy > r*r) continue;
        var i4=(py*w+px)*4;
        rSum+=d[i4]; gSum+=d[i4+1]; bSum+=d[i4+2]; cnt++;
      }
      if (!cnt) return null;
      var ar=Math.round(rSum/cnt), ag=Math.round(gSum/cnt), ab=Math.round(bSum/cnt);
      var baseColor='#'+[ar,ag,ab].map(function(v){return('0'+v.toString(16)).slice(-2);}).join('');

      var gray = new Float32Array(w*h);
      for (var g=0; g<w*h; g++) {
        var g4=g*4;
        gray[g]=(d[g4]*0.299+d[g4+1]*0.587+d[g4+2]*0.114)/255;
      }
      var edges=[], step=Math.max(1, Math.round(r/9));
      for (var qy=1; qy<h-1; qy+=step) for (var qx=1; qx<w-1; qx+=step) {
        var ex=qx-w/2, ey=qy-h/2;
        if (ex*ex+ey*ey > r*r) continue;
        var gx=(-gray[(qy-1)*w+(qx-1)]+gray[(qy-1)*w+(qx+1)]
                -2*gray[qy*w+(qx-1)]+2*gray[qy*w+(qx+1)]
                -gray[(qy+1)*w+(qx-1)]+gray[(qy+1)*w+(qx+1)]);
        var gy=(-gray[(qy-1)*w+(qx-1)]-2*gray[(qy-1)*w+qx]-gray[(qy-1)*w+(qx+1)]
                +gray[(qy+1)*w+(qx-1)]+2*gray[(qy+1)*w+qx]+gray[(qy+1)*w+(qx+1)]);
        var mag=Math.hypot(gx,gy);
        if (mag > 0.06) edges.push({ angle:Math.atan2(gy,gx), strength:Math.min(1,mag*2) });
      }
      edges.sort(function(a,b){return b.strength-a.strength;});
      edges = edges.slice(0, 26);

      var vr=0, vc=0;
      for (var vy=0; vy<h; vy+=step) for (var vx=0; vx<w; vx+=step) {
        var wx=vx-w/2, wy=vy-h/2;
        if (wx*wx+wy*wy > r*r) continue;
        var v4=(vy*w+vx)*4;
        vr += Math.abs(d[v4]-ar)+Math.abs(d[v4+1]-ag)+Math.abs(d[v4+2]-ab);
        vc++;
      }
      var variance = vc ? Math.min(60, vr/vc/3) : 10;

      return { r:ar, g:ag, b:ab, baseColor:baseColor, edges:edges,
               variance:variance, cx:cx, cy:cy, radius:radius };
    },

    paint: function (ctx, mx, my, brushRadius) {
      var s = this.sample;
      if (!s) return;
      ctx.save();
      var grad = ctx.createRadialGradient(mx, my, brushRadius*0.35, mx, my, brushRadius);
      grad.addColorStop(0, 'rgba('+s.r+','+s.g+','+s.b+',0.88)');
      grad.addColorStop(0.7, 'rgba('+s.r+','+s.g+','+s.b+',0.72)');
      grad.addColorStop(1, 'rgba('+s.r+','+s.g+','+s.b+',0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(mx, my, brushRadius, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      if (!s.edges.length) return;
      var n = Math.max(3, Math.round(brushRadius*0.20));
      n = Math.min(52, n);
      ctx.save();
      ctx.lineCap = 'round';
      for (var i=0; i<n; i++) {
        var e = s.edges[Math.floor(Math.random()*s.edges.length)];
        var a = Math.random()*Math.PI*2;
        var rr = Math.sqrt(Math.random())*brushRadius*0.92;
        var px = mx+Math.cos(a)*rr, py = my+Math.sin(a)*rr;
        var edgeFade = 1-Math.pow(rr/brushRadius, 2.2);
        var ang = e.angle + (Math.random()-0.5)*0.9;
        var len = brushRadius*(0.05+Math.random()*0.16)*e.strength;
        var jr = clamp255(s.r+(Math.random()-0.5)*s.variance);
        var jg = clamp255(s.g+(Math.random()-0.5)*s.variance);
        var jb = clamp255(s.b+(Math.random()-0.5)*s.variance);
        ctx.strokeStyle = 'rgb('+jr+','+jg+','+jb+')';
        ctx.lineWidth = Math.max(0.6, brushRadius*0.022*e.strength*(0.5+Math.random()*0.9));
        ctx.globalAlpha = (0.25+Math.random()*0.5)*e.strength*edgeFade;
        ctx.beginPath();
        ctx.moveTo(px-Math.cos(ang)*len, py-Math.sin(ang)*len);
        ctx.lineTo(px+Math.cos(ang)*len, py+Math.sin(ang)*len);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  function clamp255(v){ return Math.max(0, Math.min(255, Math.round(v))); }

  /* ====================================================================
     TOOLS
     ==================================================================== */
  var Tools = {
    painting:false, panning:false, spaceDown:false,
    panStart:null, last:null, box:null,
    beforeMain:null, beforeAux:null,
    pathPts:[], pathHover:null,
    dragging:null, activeLayerId:null,
    eyeStartPos:null,
    scaleDrag:null,
    rubberBand:null,
    windroseDrag:null,
    handleDrag:null,
    symBrushLast:null,
    symBrushBefore:null,

    bind: function () {
      var v = Cv.view, self = this;
      v.addEventListener('pointerdown', function (e) { self.onDown(e); });
      v.addEventListener('pointermove', function (e) { self.onMove(e); });
      window.addEventListener('pointerup', function (e) { self.onUp(e); });
      v.addEventListener('pointerleave', function () { Cv.mouse.over = false; Cv.requestRender(); });
      v.addEventListener('pointerenter', function () { Cv.mouse.over = true; });
      v.addEventListener('dblclick', function (e) { e.preventDefault(); self.finishPath(); });

      /* sağ tık: pan (bekleyen yol varsa yolu bitir) */
      v.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      v.addEventListener('wheel', function (e) {
        e.preventDefault();
        var r = v.getBoundingClientRect();
        var f = e.deltaY < 0 ? 1.12 : 1/1.12;
        Cv.setZoom(Cv.zoom*f, e.clientX-r.left, e.clientY-r.top);
      }, { passive:false });

      Cv.mini.addEventListener('pointerdown', function (e) {
        var r = Cv.mini.getBoundingClientRect();
        var s = Cv.mini.width/Math.max(Cv.W, Cv.H);
        Cv.centerOn((e.clientX-r.left)/s, (e.clientY-r.top)/s);
      });
    },

    pos: function (e) {
      var r = Cv.view.getBoundingClientRect();
      return Cv.screenToMap(e.clientX-r.left, e.clientY-r.top);
    },

    /* ================= POINTER DOWN ================= */
    onDown: function (e) {
      var p = this.pos(e);
      Cv.mouse.x = p.x; Cv.mouse.y = p.y; Cv.mouse.over = true;

      /* sağ tık / orta tık / space / pan aracı → kaydır */
      if (e.button === 1 || e.button === 2 || this.spaceDown || App.tool === 'pan') {
        this.panning = true;
        this.panStart = { x:e.clientX, y:e.clientY, px:Cv.panX, py:Cv.panY };
        Cv.view.classList.add('panning');
        return;
      }
      if (e.button !== 0) return;
      Cv.view.setPointerCapture(e.pointerId);

      /* windrose tutamağı */
      if (App.windrose && App.windrose.visible && this.hitWindrose(p)) {
        var wb = JSON.parse(JSON.stringify(App.windrose));
        this.windroseDrag = { sx:p.x, sy:p.y, ox:App.windrose.x, oy:App.windrose.y, before:wb };
        return;
      }

      /* ölçek çubuğu tutamağı (her araçta) */
      if (App.scale && App.scale.visible && this.hitScale(p)) {
        var b = JSON.parse(JSON.stringify(App.scale));
        this.scaleDrag = { sx:p.x, sy:p.y, ox:App.scale.x, oy:App.scale.y, before:b };
        App.selection = { layerId:'scale', id:'scale' };
        UI.refreshSelection();
        return;
      }

      if (App.tool === 'eyedrop') {
        if (App.eyedrop.painting && Eyedropper.sample) this.startEyedropPaint(p);
        else {
          Eyedropper.picking = true;
          this.eyeStartPos = { x:p.x, y:p.y };
          App.eyedrop.radius = 10;
        }
        return;
      }

      /* bezier tutamacı sürüklemeye başla (seçili nehir/yol/göl/bölge) */
      if (App.tool === 'select') {
        var hh = this.hitTestHandle(p);
        if (hh) {
          var Lh = Layers.get(App.selection.layerId);
          this.handleDrag = { obj:hh.obj, index:hh.index, dir:hh.dir, closed:hh.closed,
                               before: JSON.parse(JSON.stringify(Lh.objects)) };
          return;
        }
      }

      switch (App.tool) {
        case 'landmass': this.startRaster('landmass', p, 'paint'); break;
        case 'erase':    this.startRaster('landmass', p, 'erase'); break;
        case 'terrain':  this.startRaster('terrain',  p, 'terrain'); break;
        case 'elevation': this.startRaster('elevation', p, 'elevation'); break;
        case 'symbol':
          if (App.symbol.brushMode) this.startSymbolBrush(p);
          else this.placeSymbol(p);
          break;
        case 'lake':
        case 'river':
        case 'road':
        case 'territory': this.addPathPoint(p); break;
        case 'label':    this.placeLabel(p); break;
        case 'select':   this.startSelect(p, e.shiftKey); break;
      }
      Cv.requestRender();
    },

    /* ================= POINTER MOVE ================= */
    onMove: function (e) {
      var p = this.pos(e);
      Cv.mouse.x = p.x; Cv.mouse.y = p.y; Cv.mouse.over = true;

      if (this.panning && this.panStart) {
        Cv.panX = this.panStart.px + (e.clientX-this.panStart.x);
        Cv.panY = this.panStart.py + (e.clientY-this.panStart.y);
        Cv.requestRender();
        return;
      }

      if (this.windroseDrag) {
        App.windrose.x = this.windroseDrag.ox + (p.x-this.windroseDrag.sx);
        App.windrose.y = this.windroseDrag.oy + (p.y-this.windroseDrag.sy);
        Cv.requestRender();
        return;
      }

      if (this.scaleDrag) {
        App.scale.x = this.scaleDrag.ox + (p.x-this.scaleDrag.sx);
        App.scale.y = this.scaleDrag.oy + (p.y-this.scaleDrag.sy);
        Cv.requestRender();
        return;
      }

      if (this.handleDrag) {
        var hd = this.handleDrag, ho = hd.obj;
        if (!ho.handles) ho.handles = {};
        var hp = ho.pts[hd.index];
        var hdx = p.x - hp[0], hdy = p.y - hp[1];
        var hcur = ho.handles[hd.index] || Geo.autoHandle(ho.pts, hd.index, hd.closed);
        var hnext = { ix:hcur.ix, iy:hcur.iy, ox:hcur.ox, oy:hcur.oy };
        if (hd.dir === 'out') {
          hnext.ox = hdx; hnext.oy = hdy;
          if (!e.altKey) { hnext.ix = -hdx; hnext.iy = -hdy; }
        } else {
          hnext.ix = hdx; hnext.iy = hdy;
          if (!e.altKey) { hnext.ox = -hdx; hnext.oy = -hdy; }
        }
        ho.handles[hd.index] = hnext;
        Cv.requestRender();
        return;
      }

      if (App.tool === 'eyedrop' && Eyedropper.picking && this.eyeStartPos) {
        var ed = Math.hypot(p.x-this.eyeStartPos.x, p.y-this.eyeStartPos.y);
        App.eyedrop.radius = Math.max(8, ed);
        var el = $('eye-r'); if (el) el.value = Math.min(400, Math.round(ed));
        var vl = $('v-eye-r'); if (vl) vl.textContent = Math.min(400, Math.round(ed));
        Cv.requestRender();
        return;
      }

      if (this.painting) {
        if (this.mode === 'eyedrop') this.eyedropStrokeTo(p);
        else this.strokeTo(p);
        Cv.requestRender();
        return;
      }

      if (this.mode === 'symbolBrush' && this.symBrushLast) {
        this.symbolBrushTo(p);
        Cv.requestRender();
        return;
      }

      if (this.rubberBand) {
        this.rubberBand.x1 = p.x; this.rubberBand.y1 = p.y;
        Cv.requestRender(); return;
      }

      if (this.dragging) {
        var dx = p.x-this.dragging.sx, dy = p.y-this.dragging.sy;
        /* multi drag */
        if (this.dragging.multi) {
          this.dragging.objs.forEach(function(item){ item.o.x=item.ox+dx; item.o.y=item.oy+dy; });
          Cv.requestRender(); return;
        }
        var o = this.dragging.obj;
        if (o.pts) {
          for (var i=0; i<o.pts.length; i++) {
            o.pts[i][0] = this.dragging.orig[i][0]+dx;
            o.pts[i][1] = this.dragging.orig[i][1]+dy;
          }
        } else { o.x = this.dragging.ox+dx; o.y = this.dragging.oy+dy; }
        Cv.requestRender();
        return;
      }

      if (this.pathPts.length) { this.pathHover = p; Cv.requestRender(); return; }
      Cv.requestRender();
    },

    /* ================= POINTER UP ================= */
    onUp: function () {
      if (this.panning) { this.panning = false; Cv.view.classList.remove('panning'); return; }

      if (this.windroseDrag) {
        History.pushWindrose(this.windroseDrag.before, JSON.parse(JSON.stringify(App.windrose)), 'windrose:move');
        this.windroseDrag = null;
        UI.refreshHistory();
        return;
      }

      if (this.scaleDrag) {
        History.pushScale(this.scaleDrag.before, JSON.parse(JSON.stringify(App.scale)), 'scale:move');
        this.scaleDrag = null;
        UI.refreshHistory();
        return;
      }

      if (this.handleDrag) {
        var hd2 = this.handleDrag; this.handleDrag = null;
        var Lh2 = Layers.get(App.selection.layerId);
        History.pushVector(App.selection.layerId, hd2.before, JSON.parse(JSON.stringify(Lh2.objects)), 'handle');
        UI.refreshHistory();
        return;
      }

      if (App.tool === 'eyedrop' && Eyedropper.picking) {
        Eyedropper.picking = false;
        var ep = this.eyeStartPos;
        if (ep && App.eyedrop.radius > 8) {
          var s = Eyedropper.analyze(ep.x, ep.y, App.eyedrop.radius);
          if (s) {
            Eyedropper.sample = s;
            Eyedropper.active = true;
            App.eyedrop.hasSample = true;
            App.eyedrop.painting = false;
            UI.msg(UI.t('eyeOk') + ' r=' + Math.round(App.eyedrop.radius));
            UI.refreshEyedropPanel();
          } else UI.msg(UI.t('eyeFail'));
        }
        this.eyeStartPos = null;
        Cv.requestRender();
        return;
      }

      if (this.mode === 'symbolBrush') {
        this.endSymbolBrush();
        return;
      }

      if (this.painting) this.endRaster();

      if (this.rubberBand) {
        var rb = this.rubberBand; this.rubberBand = null;
        var rx0=Math.min(rb.x0,rb.x1), rx1=Math.max(rb.x0,rb.x1);
        var ry0=Math.min(rb.y0,rb.y1), ry1=Math.max(rb.y0,rb.y1);
        if (rx1-rx0 > 4 || ry1-ry0 > 4) {
          /* içindeki sembolleri ve etiketleri seç */
          var hits = []; var lobjs = [];
          ['symbols','labels'].forEach(function(lid){
            var LL = Layers.get(lid); if (!LL||!LL.visible) return;
            LL.objects.forEach(function(obj){
              var b = lid==='symbols' ? Sym.bounds(obj) : Cv.labelBounds(obj);
              var cx2 = b.x+b.w/2, cy2 = b.y+b.h/2;
              if (cx2>=rx0&&cx2<=rx1&&cy2>=ry0&&cy2<=ry1) {
                hits.push(obj.id); lobjs.push(obj);
              }
            });
          });
          if (hits.length === 1) {
            App.selection = { layerId:'symbols', id:hits[0] };
          } else if (hits.length > 1) {
            App.selection = { multi:true, layerId:'symbols', ids:hits, objs:lobjs };
          } else {
            App.selection = null;
          }
          UI.refreshSelection(); Cv.requestRender();
        }
        return;
      }

      if (this.dragging && this.dragging.multi) {
        var dm = this.dragging; this.dragging = null;
        var Lsym = Layers.get('symbols');
        History.pushVector('symbols', dm.before, JSON.parse(JSON.stringify(Lsym.objects)), 'multi:move');
        UI.refreshHistory(); return;
      }

      if (this.dragging) {
        var d = this.dragging;
        this.dragging = null;
        var layer = Layers.get(d.layerId);
        History.pushVector(d.layerId, d.before, JSON.parse(JSON.stringify(layer.objects)), 'move');
        UI.refreshHistory();
      }
    },

    /* ================= RASTER FIRÇALAR ================= */
    startRaster: function (layerId, p, mode) {
      var layer = Layers.get(layerId);
      if (!layer || layer.locked || !layer.visible) { UI.msg(UI.t('locked')); return; }

      this.painting = true;
      this.mode = mode;
      this.activeLayerId = layerId;
      this.last = p;
      this.box = { x0:p.x, y0:p.y, x1:p.x, y1:p.y };

      this.beforeMain = snap(layer.canvas);
      this.beforeAux = null;

      /* silgi arazi katmanını da siler → ikinci anlık görüntü */
      if (mode === 'erase') {
        var T = Layers.get('terrain');
        if (T && !T.locked) this.beforeAux = snap(T.canvas);
      }

      this.stamp(p.x, p.y);
    },

    strokeTo: function (p) {
      if (!this.last) { this.last = p; return; }
      var r = (this.mode === 'terrain' ? App.terrain.size :
                this.mode === 'elevation' ? App.elevation.brushSize : App.brush.size)/2;
      var step = Math.max(1.5, r * 0.26);
      var dx = p.x-this.last.x, dy = p.y-this.last.y;
      var n = Math.max(1, Math.ceil(Math.hypot(dx,dy)/step));
      for (var i=1; i<=n; i++) this.stamp(this.last.x+dx*i/n, this.last.y+dy*i/n);
      this.last = p;
    },

    stampTerrain: function (x, y) {
      var layer = Layers.get('terrain');
      if (!layer) return;
      var ctx = layer.ctx;
      var r = App.terrain.size/2;
      var Lm = Layers.get('landmass');
      if (Lm && Lm.canvas) {
        var pad2 = Math.ceil(r * 1.12) + 6;
        var bx2 = Math.max(0, Math.floor(x - pad2));
        var by2 = Math.max(0, Math.floor(y - pad2));
        var bw2 = Math.min(layer.canvas.width  - bx2, Math.ceil(pad2*2));
        var bh2 = Math.min(layer.canvas.height - by2, Math.ceil(pad2*2));
        var tmp2 = scratchCanvas('terrain', bw2, bh2);
        var tmpCtx2 = tmp2.getContext('2d');
        tmpCtx2.translate(-bx2, -by2);
        Terrain.scatter(tmpCtx2, App.terrain.type, x, y, r, App.terrain.opacity);
        tmpCtx2.setTransform(1,0,0,1,0,0);
        tmpCtx2.globalCompositeOperation = 'destination-in';
        tmpCtx2.drawImage(Lm.canvas, bx2, by2, bw2, bh2, 0, 0, bw2, bh2);
        tmpCtx2.globalCompositeOperation = 'source-over';
        ctx.drawImage(tmp2, 0, 0, bw2, bh2, bx2, by2, bw2, bh2);
      } else {
        Terrain.scatter(ctx, App.terrain.type, x, y, r, App.terrain.opacity);
      }
      this.expandBox(x, y, r + pad2);
    },

    expandBox: function (x, y, r) {
      var b = this.box; if (!b) return;
      b.x0 = Math.min(b.x0, x-r); b.y0 = Math.min(b.y0, y-r);
      b.x1 = Math.max(b.x1, x+r); b.y1 = Math.max(b.y1, y+r);
    },

    stamp: function (x, y) {
      var layer = Layers.get(this.activeLayerId);
      var ctx = layer.ctx;

      /* ---- ARAZİ: prosedürel serpme (tile yok) ---- */
      if (this.mode === 'terrain') {
        this.stampTerrain(x, y);
        return;
      }

      /* ---- YÜKSELTİ: yükselt/alçalt fırçası ----
         'lighten'/'darken' composite ile her darbe sadece o yöndeki
         piksel değerini iter — üst üste geçiş doğal bir yığılma
         (dağ/tepe) hissi verir, aşırı doygunluğa gitmez. */
      if (this.mode === 'elevation') {
        var er = App.elevation.brushSize/2;
        var lower = App.elevation.lower;
        var lvl = Math.round(128 + (lower ? -1 : 1) * App.elevation.strength * 127);
        ctx.save();
        ctx.globalCompositeOperation = lower ? 'darken' : 'lighten';
        var eg = ctx.createRadialGradient(x, y, 0, x, y, er);
        var col = 'rgb('+lvl+','+lvl+','+lvl+')';
        eg.addColorStop(0, col);
        eg.addColorStop(0.7, col);
        eg.addColorStop(1, 'rgba('+lvl+','+lvl+','+lvl+',0)');
        ctx.fillStyle = eg;
        ctx.beginPath(); ctx.arc(x, y, er, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        Cv.elevationDirty = true;
        this.expandBox(x, y, er + 4);
        return;
      }

      var rr = App.brush.size/2, rough = App.brush.roughness;

      /* ---- DENİZ (silgi): kara + arazi birlikte ---- */
      if (this.mode === 'erase') {
        var T = Layers.get('terrain');
        var targets = [ctx];
        if (T && !T.locked && this.beforeAux) targets.push(T.ctx);
        for (var t=0; t<targets.length; t++) {
          var c = targets[t];
          c.save();
          c.globalCompositeOperation = 'destination-out';
          c.fillStyle = '#000';
          c.beginPath(); c.arc(x, y, rr*(1-rough*0.20), 0, Math.PI*2); c.fill();
          if (rough > 0.02) {
            var eb = 3+Math.round(rough*7);
            for (var k=0; k<eb; k++) {
              var ea = Math.random()*Math.PI*2;
              var ed = rr*(0.55+Math.random()*0.5)*(0.4+rough*0.9);
              var er = rr*(0.22+Math.random()*0.45)*(0.5+rough);
              c.beginPath();
              c.arc(x+Math.cos(ea)*ed, y+Math.sin(ea)*ed, er, 0, Math.PI*2);
              c.fill();
            }
          }
          c.restore();
        }
        Cv.shoreDirty = true;
        this.expandBox(x, y, rr*1.9+4);
        return;
      }

      /* ---- KARA ---- */
      ctx.save();
      ctx.fillStyle = App.brush.color;
      ctx.beginPath(); ctx.arc(x, y, rr*(1-rough*0.22), 0, Math.PI*2); ctx.fill();
      if (rough > 0.02) {
        var blobs = 3+Math.round(rough*7);
        for (var b2=0; b2<blobs; b2++) {
          var a = Math.random()*Math.PI*2;
          var d = rr*(0.55+Math.random()*0.5)*(0.4+rough*0.9);
          var br = rr*(0.22+Math.random()*0.45)*(0.5+rough);
          ctx.beginPath();
          ctx.arc(x+Math.cos(a)*d, y+Math.sin(a)*d, br, 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.restore();
      Cv.shoreDirty = true;
      this.expandBox(x, y, rr*1.9+4);
    },

    endRaster: function () {
      this.painting = false;
      var b = this.box;
      if (!b) { this.last = null; return; }

      var pad = 6;
      var box = {
        x: Math.max(0, b.x0-pad), y: Math.max(0, b.y0-pad),
        w: Math.min(Cv.W, b.x1+pad) - Math.max(0, b.x0-pad),
        h: Math.min(Cv.H, b.y1+pad) - Math.max(0, b.y0-pad)
      };

      var layer = Layers.get(this.activeLayerId);

      if (this.mode === 'terrain') this.maskToLand(box);

      if (this.mode === 'erase' && this.beforeAux) {
        var T = Layers.get('terrain');
        History.pushRasterMulti([
          { layerId:'landmass', beforeCanvas:this.beforeMain, afterCanvas:layer.canvas },
          { layerId:'terrain',  beforeCanvas:this.beforeAux,  afterCanvas:T.canvas }
        ], box, 'erase');
      } else {
        History.pushRaster(this.activeLayerId, this.beforeMain, layer.canvas, box,
          this.mode === 'terrain' ? 'terrain:'+App.terrain.type
          : this.mode === 'eyedrop' ? 'sample-paint' : this.mode);
      }

      this.box = null; this.last = null;
      this.beforeMain = null; this.beforeAux = null;
      Cv.shoreDirty = true;
      UI.refreshHistory();
      Cv.requestRender();
    },

    maskToLand: function (box) {
      var T = Layers.get('terrain'), L = Layers.get('landmass');
      var w = Math.max(1, Math.ceil(box.w)), h = Math.max(1, Math.ceil(box.h));
      var x = Math.floor(box.x), y = Math.floor(box.y);
      var t = document.createElement('canvas'); t.width = w; t.height = h;
      var tx = t.getContext('2d');
      tx.drawImage(T.canvas, x, y, w, h, 0, 0, w, h);
      tx.globalCompositeOperation = 'destination-in';
      tx.drawImage(L.canvas, x, y, w, h, 0, 0, w, h);
      T.ctx.clearRect(x, y, w, h);
      T.ctx.drawImage(t, x, y);
    },

    /* ---- örnekleyici boyama ---- */
    startEyedropPaint: function (p) {
      var lid = App.eyedrop.targetLayer || 'terrain';
      var layer = Layers.get(lid);
      if (!layer || layer.locked || !layer.visible) { UI.msg(UI.t('locked')); return; }
      this.painting = true;
      this.mode = 'eyedrop';
      this.activeLayerId = lid;
      this.last = p;
      this.box = { x0:p.x, y0:p.y, x1:p.x, y1:p.y };
      this.beforeMain = snap(layer.canvas);
      this.beforeAux = null;
      this.eyedropStamp(p.x, p.y);
    },

    eyedropStamp: function (x, y) {
      var layer = Layers.get(this.activeLayerId);
      if (!layer) return;
      var r = App.eyedrop.brushRadius || 80;

      /* Landmass maskesine clip et: önce geçici canvas'a çiz, sonra
         destination-in ile landmass alpha'sını uygula, ardından hedef
         katmana aktar. Böylece kara dışına taşmaz.               */
      var L = Layers.get('landmass');
      if (L && L.canvas && this.activeLayerId !== 'landmass') {
        /* Sadece fırça bbox'ı kadar geçici canvas — kara dışına taşmayı engelle */
        var epad = Math.ceil(r) + 4;
        var ebx = Math.max(0, Math.floor(x - epad));
        var eby = Math.max(0, Math.floor(y - epad));
        var ebw = Math.min(layer.canvas.width  - ebx, Math.ceil(epad*2));
        var ebh = Math.min(layer.canvas.height - eby, Math.ceil(epad*2));
        var tmp = scratchCanvas('eyedrop', ebw, ebh);
        var tmpCtx = tmp.getContext('2d');
        tmpCtx.translate(-ebx, -eby);
        Eyedropper.paint(tmpCtx, x, y, r);
        tmpCtx.setTransform(1,0,0,1,0,0);
        tmpCtx.globalCompositeOperation = 'destination-in';
        tmpCtx.drawImage(L.canvas, ebx, eby, ebw, ebh, 0, 0, ebw, ebh);
        tmpCtx.globalCompositeOperation = 'source-over';
        layer.ctx.drawImage(tmp, 0, 0, ebw, ebh, ebx, eby, ebw, ebh);
      } else {
        Eyedropper.paint(layer.ctx, x, y, r);
      }

      if (this.activeLayerId === 'landmass') Cv.shoreDirty = true;
      this.expandBox(x, y, r+3);
    },

    eyedropStrokeTo: function (p) {
      if (!this.last) { this.last = p; return; }
      var r = App.eyedrop.brushRadius || 80;
      var step = Math.max(2, r*0.30);
      var dx = p.x-this.last.x, dy = p.y-this.last.y;
      var n = Math.max(1, Math.ceil(Math.hypot(dx,dy)/step));
      for (var i=1; i<=n; i++) this.eyedropStamp(this.last.x+dx*i/n, this.last.y+dy*i/n);
      this.last = p;
    },

    /* ---- kıyı yumuşatma ---- */
    smoothCoast: function (strength) {
      var L = Layers.get('landmass');
      if (L.locked) { UI.msg(UI.t('locked')); return; }
      var w = L.canvas.width, h = L.canvas.height;
      var before = snap(L.canvas);

      var t = document.createElement('canvas'); t.width = w; t.height = h;
      var tx = t.getContext('2d', { willReadFrequently:true });
      tx.filter = 'blur('+(strength||6)+'px)';
      tx.drawImage(L.canvas, 0, 0);
      tx.filter = 'none';

      /* Blur sonrası sadece alpha threshold uygula — RGB renklere dokunma.
         Böylece farklı renklerdeki kara bölgeleri kendi renklerini korur. */
      var id = tx.getImageData(0, 0, w, h), d = id.data;
      for (var i=0; i<d.length; i+=4) {
        d[i+3] = d[i+3] > 128 ? 255 : 0;
      }
      tx.putImageData(id, 0, 0);

      /* Orijinal renkleri koru: blur şeklini maske olarak kullan,
         üstüne orijinal kara canvas'ını çiz (source-in). */
      tx.globalCompositeOperation = 'source-in';
      tx.drawImage(before, 0, 0);
      tx.globalCompositeOperation = 'source-over';

      L.ctx.clearRect(0, 0, w, h);
      L.ctx.drawImage(t, 0, 0);

      History.pushRaster('landmass', before, L.canvas, {x:0,y:0,w:w,h:h}, 'smooth');
      Cv.shoreDirty = true;
      UI.refreshHistory();
      Cv.requestRender();
    },

    clearRasterLayer: function (id) {
      var L = Layers.get(id);
      if (L.locked) { UI.msg(UI.t('locked')); return; }
      var w = L.canvas.width, h = L.canvas.height;
      var before = snap(L.canvas);
      L.ctx.clearRect(0, 0, w, h);
      History.pushRaster(id, before, L.canvas, {x:0,y:0,w:w,h:h}, 'clear:'+id);
      if (id === 'landmass') Cv.shoreDirty = true;
      if (id === 'elevation') Cv.elevationDirty = true;
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ================= SEMBOL FIRÇASI ================= */
    startSymbolBrush: function (p) {
      var L = Layers.get('symbols');
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      this.mode = 'symbolBrush';
      this.symBrushLast = p;
      this.symBrushBefore = JSON.parse(JSON.stringify(L.objects));
      /* aynı vuruş içinde birbirine çok yakın sembol yığılmasını önlemek için
         bu vuruşta yerleştirilen noktaların minimum mesafe kontrolü */
      this.symBrushPlaced = [];
      this.symbolBrushStamp(p);
    },

    symbolBrushStamp: function (p) {
      var L = Layers.get('symbols');
      var s = App.symbol;
      var density = App.symbol.brushDensity || 0.5;
      var spread = s.size * (1.2 + density * 1.5);
      var count = Math.max(1, Math.round(density * 3));
      var minGap = s.size * (0.55 - density * 0.25); /* yoğunluk arttıkça izin verilen minimum aralık daralır */
      var placed = this.symBrushPlaced || (this.symBrushPlaced = []);
      var clip = s.clipToLand;
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var dist  = Math.random() * spread * 0.5;
        var snp = Cv.snapPoint ? { x: p.x, y: p.y } : p;
        var x = snp.x + Math.cos(angle) * dist * (s.jitter ? 1 : 0);
        var y = snp.y + Math.sin(angle) * dist * (s.jitter ? 1 : 0);

        if (clip && global.Cv && !Cv.isOnLand(x, y)) continue;

        var tooClose = false;
        for (var k = 0; k < placed.length; k++) {
          var dx = placed[k][0]-x, dy = placed[k][1]-y;
          if (dx*dx + dy*dy < minGap*minGap) { tooClose = true; break; }
        }
        if (tooClose) continue;
        placed.push([x, y]);

        var o = {
          id: uid(), sym: s.id,
          x: x, y: y, clip: clip,
          size: s.size * (0.78 + Math.random() * 0.44 * (s.jitter ? 1 : 0.2)),
          rot:  s.rot + (Math.random() - 0.5) * 60 * (s.jitter ? 1 : 0.1),
          hue: s.hue, opacity: s.opacity, wear: s.wear || 0
        };
        L.objects.push(o);
      }
    },

    symbolBrushTo: function (p) {
      if (!this.symBrushLast) return;
      var r = App.symbol.size * (0.8 + (App.symbol.brushDensity||0.5));
      var step = Math.max(r * 0.6, 20);
      var dx = p.x - this.symBrushLast.x, dy = p.y - this.symBrushLast.y;
      var dist = Math.hypot(dx, dy);
      if (dist < step) return;
      var n = Math.ceil(dist / step);
      for (var i = 1; i <= n; i++) {
        this.symbolBrushStamp({ x: this.symBrushLast.x + dx*i/n, y: this.symBrushLast.y + dy*i/n });
      }
      this.symBrushLast = p;
    },

    endSymbolBrush: function () {
      if (!this.symBrushBefore) return;
      var L = Layers.get('symbols');
      History.pushVector('symbols', this.symBrushBefore, JSON.parse(JSON.stringify(L.objects)), 'symbol:brush');
      this.symBrushLast = null;
      this.symBrushBefore = null;
      this.symBrushPlaced = null;
      this.mode = null;
      App.selection = null;
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ================= SEMBOL ================= */
    placeSymbol: function (p) {
      var L = Layers.get('symbols');
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      var before = JSON.parse(JSON.stringify(L.objects));
      var s = App.symbol, j = s.jitter ? 1 : 0;
      var o = {
        id:uid(), sym:s.id,
        x:p.x+(Math.random()-0.5)*s.size*0.25*j,
        y:p.y+(Math.random()-0.5)*s.size*0.25*j,
        size:s.size*(1+(Math.random()-0.5)*0.28*j),
        rot:s.rot+(Math.random()-0.5)*10*j,
        hue:s.hue, opacity:s.opacity, wear:s.wear || 0
      };
      L.objects.push(o);
      App.selection = { layerId:'symbols', id:o.id };
      History.pushVector('symbols', before, JSON.parse(JSON.stringify(L.objects)), 'symbol');
      UI.refreshHistory(); UI.refreshSelection();
    },

    /* ================= ETİKET ================= */
    placeLabel: function (p) {
      var L = Layers.get('labels');
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      var txt = $('lb-text').value.trim();
      if (!txt) { UI.msg(UI.t('needtext')); return; }
      var before = JSON.parse(JSON.stringify(L.objects));
      var s = App.label;
      var o = {
        id:uid(), text:txt, x:p.x, y:p.y,
        preset:s.preset, font:s.font, size:s.size, color:s.color,
        outline:s.outline, outlineColor:s.outlineColor, shadow:s.shadow,
        curve:s.curve, track:s.track, rot:s.rot, caps:s.caps,
        banner:s.banner, opacity:1
      };

      if (s.snapPath) {
        var hit = this.findNearestPath(p, 70);
        if (hit) {
          o.pathPts = hit.pts;
          o.pathCenter = hit.len;
          var ctr = Geo.pointAtLength(hit.pts, hit.len);
          o.x = ctr.x; o.y = ctr.y;
        } else {
          UI.msg(UI.t('nopathnear'));
        }
      }

      L.objects.push(o);
      App.selection = { layerId:'labels', id:o.id };
      History.pushVector('labels', before, JSON.parse(JSON.stringify(L.objects)), 'label');
      UI.refreshHistory(); UI.refreshSelection();
    },

    /* tıklanan noktaya en yakın nehir/yol'u bulur (etiketi yola oturtmak için) */
    findNearestPath: function (p, maxDist) {
      var best = null;
      ['rivers', 'roads'].forEach(function (lid) {
        var L = Layers.get(lid);
        if (!L || !L.visible) return;
        L.objects.forEach(function (o) {
          if (o.kind === 'lake') return;
          var pts = lid === 'rivers' ? Cv.riverGeometry(o) : Cv.roadGeometry(o);
          if (!pts || pts.length < 2) return;
          var n = Geo.nearestOnPolyline(pts, p.x, p.y);
          if (n.dist <= maxDist && (!best || n.dist < best.dist)) {
            best = { pts:pts, len:n.len, dist:n.dist };
          }
        });
      });
      return best;
    },

    /* ================= NEHİR / YOL / BÖLGE ================= */
    pathLayerId: function (tool) {
      if (tool === 'river' || tool === 'lake') return 'rivers';
      if (tool === 'territory') return 'territories';
      return 'roads';
    },

    addPathPoint: function (p) {
      var snp = Cv.snapPoint(p);
      var lid = this.pathLayerId(App.tool);
      var L = Layers.get(lid);
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      this.pathPts.push([snp.x, snp.y]);
      this.pathHover = snp;
    },

    finishPath: function () {
      var isLake      = App.tool === 'lake';
      var isTerritory = App.tool === 'territory';
      var isRiver     = App.tool === 'river';
      var minPts = (isLake || isTerritory) ? 3 : 2;
      if (this.pathPts.length < minPts) { this.pathPts = []; Cv.requestRender(); return; }
      var lid = this.pathLayerId(App.tool);
      var L = Layers.get(lid);
      var before = JSON.parse(JSON.stringify(L.objects));
      var o;
      if (isLake) {
        o = { id:uid(), kind:'lake', pts:this.pathPts.slice(),
              color:App.lake.color, opacity:App.lake.opacity };
      } else if (isTerritory) {
        o = { id:uid(), pts:this.pathPts.slice(), color:App.territory.color,
              opacity:App.territory.opacity, borderColor:App.territory.borderColor,
              borderWidth:App.territory.borderWidth };
      } else if (isRiver) {
        o = { id:uid(), pts:this.pathPts.slice(), width:App.river.width, meander:App.river.meander,
              taper:App.river.taper, color:App.river.color, opacity:1 };
      } else {
        o = { id:uid(), pts:this.pathPts.slice(), width:App.road.width, style:App.road.style,
              color:App.road.color, opacity:1 };
      }
      L.objects.push(o);
      this.pathPts = []; this.pathHover = null;
      App.selection = { layerId:lid, id:o.id };
      History.pushVector(lid, before, JSON.parse(JSON.stringify(L.objects)), lid);
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    cancelPath: function () { this.pathPts = []; this.pathHover = null; Cv.requestRender(); },

    undoPathPoint: function () {
      if (this.pathPts.length) { this.pathPts.pop(); Cv.requestRender(); return true; }
      return false;
    },

    /* ================= SEÇİM ================= */
    hitWindrose: function (p) {
      if (!App.windrose || !App.windrose.visible) return false;
      var b = Cv.windroseBounds(App.windrose);
      var m = App.windrose.size * 0.15;
      return p.x >= b.x-m && p.x <= b.x+b.w+m && p.y >= b.y-m && p.y <= b.y+b.h+m;
    },

    hitScale: function (p) {
      if (!App.scale || !App.scale.visible) return false;
      var b = Cv.scaleBounds(App.scale);
      var m = App.scale.size*0.6;
      return p.x >= b.x-m && p.x <= b.x+b.w+m && p.y >= b.y-m && p.y <= b.y+b.h+m;
    },

    hitTest: function (p) {
      var order = ['labels','symbols','roads','rivers','territories'];
      for (var i=0; i<order.length; i++) {
        var L = Layers.get(order[i]);
        if (!L.visible || L.locked) continue;
        for (var j=L.objects.length-1; j>=0; j--) {
          var o = L.objects[j];
          if (order[i] === 'symbols') {
            var b = Sym.bounds(o);
            if (p.x>=b.x && p.x<=b.x+b.w && p.y>=b.y && p.y<=b.y+b.h)
              return { layerId:'symbols', id:o.id, obj:o };
          } else if (order[i] === 'labels') {
            var lb = Cv.labelBounds(o);
            if (p.x>=lb.x-6 && p.x<=lb.x+lb.w+6 && p.y>=lb.y-6 && p.y<=lb.y+lb.h+6)
              return { layerId:'labels', id:o.id, obj:o };
          } else if (order[i] === 'territories') {
            if (o.pts && o.pts.length >= 3 && Cv._pointInPoly(p.x, p.y, Cv.lakeSmoothPts(o, 24)))
              return { layerId:'territories', id:o.id, obj:o };
          } else {
            var pts = order[i]==='rivers' ? Cv.riverGeometry(o) : Cv.roadGeometry(o);
            if (Geo.distToPolyline(p.x, p.y, pts) < Math.max(8, (o.width||6)*0.9))
              return { layerId:order[i], id:o.id, obj:o };
          }
        }
      }
      return null;
    },

    startSelect: function (p, shiftKey) {
      var hit = this.hitTest(p);

      if (!hit) {
        /* rubber band başlat */
        if (!shiftKey) App.selection = null;
        this.rubberBand = { x0:p.x, y0:p.y, x1:p.x, y1:p.y };
        UI.refreshSelection();
        Cv.requestRender();
        return;
      }

      /* Shift+tık: çoklu seçime ekle/çıkar */
      if (shiftKey) {
        var sel = App.selection;
        /* mevcut multi seçim varsa */
        if (sel && sel.multi) {
          var idx = sel.ids.indexOf(hit.id);
          var nids = sel.ids.slice();
          var nobjs = sel.objs.slice();
          if (idx >= 0) { nids.splice(idx,1); nobjs.splice(idx,1); }
          else { nids.push(hit.id); nobjs.push(hit.obj); }
          App.selection = nids.length === 1
            ? { layerId:'symbols', id:nids[0] }
            : { multi:true, layerId:'symbols', ids:nids, objs:nobjs };
        } else if (sel && sel.layerId === 'symbols' && hit.layerId === 'symbols') {
          /* tekli → multi */
          App.selection = { multi:true, layerId:'symbols',
            ids:[sel.id, hit.id], objs:[this.findObj('symbols', sel.id), hit.obj] };
        } else {
          App.selection = { layerId:hit.layerId, id:hit.id };
        }
        UI.refreshSelection(); Cv.requestRender(); return;
      }

      /* normal tek seçim */
      /* eğer multi seçimde bir nesneye tıklandıysa — grubu taşı */
      if (App.selection && App.selection.multi && App.selection.ids.indexOf(hit.id) >= 0) {
        var L0 = Layers.get('symbols');
        this.dragging = {
          multi:true, sx:p.x, sy:p.y,
          objs: App.selection.objs.map(function(o){ return {o:o, ox:o.x, oy:o.y}; }),
          before: JSON.parse(JSON.stringify(L0.objects))
        };
        return;
      }

      App.selection = { layerId:hit.layerId, id:hit.id };
      var L = Layers.get(hit.layerId);
      this.dragging = {
        layerId:hit.layerId, obj:hit.obj, sx:p.x, sy:p.y,
        ox:hit.obj.x, oy:hit.obj.y,
        orig:hit.obj.pts ? JSON.parse(JSON.stringify(hit.obj.pts)) : null,
        before:JSON.parse(JSON.stringify(L.objects))
      };
      UI.refreshSelection();
    },

    findObj: function(layerId, id) {
      var L = Layers.get(layerId); if (!L) return null;
      for (var i=0; i<L.objects.length; i++) if (L.objects[i].id === id) return L.objects[i];
      return null;
    },

    selected: function () {
      if (!App.selection) return null;
      if (App.selection.layerId === 'scale') return App.scale;
      var L = Layers.get(App.selection.layerId);
      if (!L) return null;
      for (var i=0; i<L.objects.length; i++) if (L.objects[i].id === App.selection.id) return L.objects[i];
      return null;
    },

    deleteSelection: function () {
      var s = App.selection;
      if (!s || s.layerId === 'scale') return;
      if (s.multi) {
        var ids = s.ids.slice();
        /* semboller ve etiketler karışık olabilir — symbols layer'ından sil */
        var Ls = Layers.get('symbols');
        var bef = JSON.parse(JSON.stringify(Ls.objects));
        Ls.objects = Ls.objects.filter(function(o){ return ids.indexOf(o.id) < 0; });
        History.pushVector('symbols', bef, JSON.parse(JSON.stringify(Ls.objects)), 'multi:delete');
        App.selection = null;
        UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender(); return;
      }
      var L = Layers.get(s.layerId);
      var before = JSON.parse(JSON.stringify(L.objects));
      L.objects = L.objects.filter(function (o) { return o.id !== s.id; });
      App.selection = null;
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'delete');
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    duplicateSelection: function () {
      if (!App.selection || App.selection.layerId === 'scale') return;
      var o = this.selected(); if (!o) return;
      var L = Layers.get(App.selection.layerId);
      var before = JSON.parse(JSON.stringify(L.objects));
      var c = JSON.parse(JSON.stringify(o));
      c.id = uid();
      var off = 40;
      if (c.pts) c.pts = c.pts.map(function (p) { return [p[0]+off, p[1]+off]; });
      else { c.x += off; c.y += off; }
      L.objects.push(c);
      App.selection = { layerId:App.selection.layerId, id:c.id };
      History.pushVector(App.selection.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'duplicate');
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    bringForward: function () {
      var s = App.selection; if (!s || s.multi || s.layerId === 'scale') return;
      var L = Layers.get(s.layerId); if (!L) return;
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(o){ return o.id === s.id; });
      if (idx < L.objects.length-1) {
        var tmp = L.objects[idx]; L.objects[idx] = L.objects[idx+1]; L.objects[idx+1] = tmp;
      }
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'zorder');
      UI.refreshHistory(); Cv.requestRender();
    },

    sendBackward: function () {
      var s = App.selection; if (!s || s.multi || s.layerId === 'scale') return;
      var L = Layers.get(s.layerId); if (!L) return;
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(o){ return o.id === s.id; });
      if (idx > 0) {
        var tmp = L.objects[idx]; L.objects[idx] = L.objects[idx-1]; L.objects[idx-1] = tmp;
      }
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'zorder');
      UI.refreshHistory(); Cv.requestRender();
    },

    bringToFront: function () {
      var s = App.selection; if (!s || s.multi || s.layerId === 'scale') return;
      var L = Layers.get(s.layerId); if (!L) return;
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(o){ return o.id === s.id; });
      if (idx >= 0) { var o = L.objects.splice(idx,1)[0]; L.objects.push(o); }
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'zorder');
      UI.refreshHistory(); Cv.requestRender();
    },

    sendToBack: function () {
      var s = App.selection; if (!s || s.multi || s.layerId === 'scale') return;
      var L = Layers.get(s.layerId); if (!L) return;
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(o){ return o.id === s.id; });
      if (idx > 0) { var o = L.objects.splice(idx,1)[0]; L.objects.unshift(o); }
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'zorder');
      UI.refreshHistory(); Cv.requestRender();
    },

    groupSelection: function () {
      var s = App.selection; if (!s || !s.multi) return;
      var L = Layers.get('symbols');
      var before = JSON.parse(JSON.stringify(L.objects));
      var members = s.ids.map(function(id){
        return JSON.parse(JSON.stringify(Tools.findObj('symbols', id)));
      }).filter(Boolean);
      if (!members.length) return;
      /* üyeleri sil */
      L.objects = L.objects.filter(function(o){ return s.ids.indexOf(o.id) < 0; });
      /* grup objesi ekle */
      var grp = { id:uid(), kind:'group', members:members };
      L.objects.push(grp);
      App.selection = { layerId:'symbols', id:grp.id };
      History.pushVector('symbols', before, JSON.parse(JSON.stringify(L.objects)), 'group');
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    ungroupSelection: function () {
      var s = App.selection; if (!s || s.multi) return;
      var o = this.selected(); if (!o || o.kind !== 'group') return;
      var L = Layers.get('symbols');
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(ob){ return ob.id === o.id; });
      var members = o.members || [];
      L.objects.splice(idx, 1, ...members);
      App.selection = members.length > 0
        ? { multi:true, layerId:'symbols', ids:members.map(function(m){return m.id;}), objs:members }
        : null;
      History.pushVector('symbols', before, JSON.parse(JSON.stringify(L.objects)), 'ungroup');
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    applyToSelection: function (props) {
      var o = this.selected(); if (!o) return false;
      Object.keys(props).forEach(function (k) { o[k] = props[k]; });
      Cv.requestRender();
      return true;
    },

    commitSelectionEdit: function (beforeArr, label) {
      if (!App.selection || App.selection.layerId === 'scale') return;
      var L = Layers.get(App.selection.layerId);
      History.pushVector(App.selection.layerId, beforeArr, JSON.parse(JSON.stringify(L.objects)), label||'edit');
      UI.refreshHistory();
    },

    /* ================= ÜST KATMAN ================= */
    drawOverlay: function (ctx) {
      var z = Cv.zoom;

      if (App.tool === 'eyedrop' && Eyedropper.picking && this.eyeStartPos) {
        var ep = this.eyeStartPos;
        ctx.save();
        ctx.strokeStyle = 'rgba(201,154,75,0.95)';
        ctx.lineWidth = 2/z;
        ctx.setLineDash([7/z, 5/z]);
        ctx.beginPath(); ctx.arc(ep.x, ep.y, App.eyedrop.radius, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (App.tool === 'eyedrop' && Eyedropper.sample && !Eyedropper.picking && !App.eyedrop.painting) {
        var s = Eyedropper.sample;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = s.baseColor;
        ctx.lineWidth = 5/z;
        ctx.beginPath(); ctx.arc(s.cx, s.cy, s.radius, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      }

      if (this.pathPts.length) {
        var pts = this.pathPts.slice();
        if (this.pathHover) pts.push([this.pathHover.x, this.pathHover.y]);
        var sm = Geo.sample(pts, 14);
        ctx.save();
        if (App.tool === 'lake' || App.tool === 'territory') {
          var isTerr2 = App.tool === 'territory';
          ctx.strokeStyle = isTerr2 ? App.territory.borderColor : App.lake.color;
          ctx.fillStyle = isTerr2 ? App.territory.color : App.lake.color;
          ctx.globalAlpha = isTerr2 ? App.territory.opacity : 0.35;
          ctx.lineWidth = isTerr2 ? App.territory.borderWidth : 2/z;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          if (pts.length >= 3) {
            var lpath = Geo.polyPath(sm);
            lpath.closePath();
            ctx.fill(lpath);
          }
          ctx.globalAlpha = isTerr2 ? 1 : 0.75;
          ctx.stroke(Geo.polyPath(sm));
        } else {
          ctx.strokeStyle = App.tool === 'river' ? App.river.color : App.road.color;
          ctx.globalAlpha = 0.75;
          ctx.lineWidth = Math.max(1/z, (App.tool==='river'?App.river.width:App.road.width));
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.stroke(Geo.polyPath(sm));
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#c99a4b';
        for (var i=0; i<this.pathPts.length; i++) {
          ctx.beginPath(); ctx.arc(this.pathPts[i][0], this.pathPts[i][1], 4/z, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
      }

      /* rubber band dikdörtgeni */
      if (this.rubberBand) {
        var rb = this.rubberBand;
        ctx.save();
        ctx.strokeStyle = '#c99a4b';
        ctx.fillStyle = 'rgba(201,154,75,0.08)';
        ctx.lineWidth = 1.5/z;
        ctx.setLineDash([5/z, 4/z]);
        var rbx=Math.min(rb.x0,rb.x1), rby=Math.min(rb.y0,rb.y1);
        var rbw=Math.abs(rb.x1-rb.x0), rbh=Math.abs(rb.y1-rb.y0);
        ctx.fillRect(rbx,rby,rbw,rbh);
        ctx.strokeRect(rbx,rby,rbw,rbh);
        ctx.restore();
      }

      /* multi seçim */
      if (App.selection && App.selection.multi) {
        ctx.save();
        ctx.strokeStyle = '#c99a4b';
        ctx.lineWidth = 1.5/z;
        ctx.setLineDash([6/z, 4/z]);
        App.selection.objs.forEach(function(obj) {
          var b = Sym.bounds(obj);
          ctx.strokeRect(b.x-4/z, b.y-4/z, b.w+8/z, b.h+8/z);
        });
        ctx.restore();
        return;
      }

      var o = this.selected();
      if (!o) return;
      ctx.save();
      ctx.strokeStyle = '#c99a4b';
      ctx.lineWidth = 1.5/z;
      ctx.setLineDash([6/z, 4/z]);
      if (App.selection.layerId === 'scale') {
        var sb = Cv.scaleBounds(o);
        ctx.strokeRect(sb.x-4/z, sb.y-4/z, sb.w+8/z, sb.h+8/z);
      } else if (o.pts) {
        var isClosed = App.selection.layerId === 'territories' || o.kind === 'lake';
        var g = isClosed ? Cv.lakeSmoothPts(o, 24) :
                App.selection.layerId === 'rivers' ? Cv.riverGeometry(o) : Cv.roadGeometry(o);
        var gp = Geo.polyPath(g);
        if (isClosed) gp.closePath();
        ctx.stroke(gp);
        ctx.setLineDash([]);
        this.drawPathHandles(ctx, o, isClosed, z);
        ctx.fillStyle = '#c99a4b';
        for (var k=0; k<o.pts.length; k++) {
          ctx.beginPath(); ctx.arc(o.pts[k][0], o.pts[k][1], 4/z, 0, Math.PI*2); ctx.fill();
        }
      } else if (o.kind === 'group') {
        /* grup bbox */
        var gbs = o.members.map(function(m){ return Sym.bounds(m); });
        var gx0=Math.min.apply(null,gbs.map(function(b){return b.x;}));
        var gy0=Math.min.apply(null,gbs.map(function(b){return b.y;}));
        var gx1=Math.max.apply(null,gbs.map(function(b){return b.x+b.w;}));
        var gy1=Math.max.apply(null,gbs.map(function(b){return b.y+b.h;}));
        ctx.strokeRect(gx0-6/z, gy0-6/z, gx1-gx0+12/z, gy1-gy0+12/z);
      } else {
        var b = App.selection.layerId==='labels' ? Cv.labelBounds(o) : Sym.bounds(o);
        ctx.strokeRect(b.x-4/z, b.y-4/z, b.w+8/z, b.h+8/z);
      }
      ctx.restore();
    },

    /* seçili nehir/yol/göl/bölge için bezier tutamaçlarını çiz (sap + küçük kare) */
    drawPathHandles: function (ctx, o, closed, z) {
      var pts = o.pts;
      ctx.save();
      ctx.strokeStyle = 'rgba(120,190,255,0.9)';
      ctx.fillStyle = '#78bfff';
      ctx.lineWidth = 1/z;
      for (var i = 0; i < pts.length; i++) {
        var h = (o.handles && o.handles[i]) || Geo.autoHandle(pts, i, closed);
        var px = pts[i][0], py = pts[i][1];
        var hasNext = closed || i < pts.length - 1;
        var hasPrev = closed || i > 0;
        if (hasNext) {
          var ox = px + h.ox, oy = py + h.oy;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ox, oy); ctx.stroke();
          ctx.beginPath(); ctx.rect(ox-3/z, oy-3/z, 6/z, 6/z); ctx.fill();
        }
        if (hasPrev) {
          var ix = px + h.ix, iy = py + h.iy;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ix, iy); ctx.stroke();
          ctx.beginPath(); ctx.rect(ix-3/z, iy-3/z, 6/z, 6/z); ctx.fill();
        }
      }
      ctx.restore();
    },

    /* verilen ekran/harita noktasına en yakın tutamaç ucunu bul (seçili yol için) */
    hitTestHandle: function (p) {
      var s = App.selection;
      if (!s || s.multi || s.layerId === 'scale') return null;
      var o = this.selected();
      if (!o || !o.pts) return null;
      var closed = s.layerId === 'territories' || o.kind === 'lake';
      var thresh = 9 / Cv.zoom;
      for (var i = 0; i < o.pts.length; i++) {
        var h = (o.handles && o.handles[i]) || Geo.autoHandle(o.pts, i, closed);
        var px = o.pts[i][0], py = o.pts[i][1];
        var hasNext = closed || i < o.pts.length - 1;
        var hasPrev = closed || i > 0;
        if (hasNext) {
          var ox = px + h.ox, oy = py + h.oy;
          if (Math.hypot(p.x-ox, p.y-oy) < thresh) return { index:i, dir:'out', obj:o, closed:closed };
        }
        if (hasPrev) {
          var ix = px + h.ix, iy = py + h.iy;
          if (Math.hypot(p.x-ix, p.y-iy) < thresh) return { index:i, dir:'in', obj:o, closed:closed };
        }
      }
      return null;
    }
  };

  global.Tools = Tools;
  global.Eyedropper = Eyedropper;
  global.uid = uid;
})(window);
