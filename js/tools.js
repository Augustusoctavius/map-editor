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

      switch (App.tool) {
        case 'landmass': this.startRaster('landmass', p, 'paint'); break;
        case 'erase':    this.startRaster('landmass', p, 'erase'); break;
        case 'terrain':  this.startRaster('terrain',  p, 'terrain'); break;
        case 'symbol':   this.placeSymbol(p); break;
        case 'river':
        case 'road':     this.addPathPoint(p); break;
        case 'label':    this.placeLabel(p); break;
        case 'select':   this.startSelect(p); break;
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

      if (this.scaleDrag) {
        App.scale.x = this.scaleDrag.ox + (p.x-this.scaleDrag.sx);
        App.scale.y = this.scaleDrag.oy + (p.y-this.scaleDrag.sy);
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

      if (this.dragging) {
        var o = this.dragging.obj;
        var dx = p.x-this.dragging.sx, dy = p.y-this.dragging.sy;
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

      if (this.scaleDrag) {
        History.pushScale(this.scaleDrag.before, JSON.parse(JSON.stringify(App.scale)), 'scale:move');
        this.scaleDrag = null;
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

      if (this.painting) this.endRaster();

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
      var r = (this.mode === 'terrain' ? App.terrain.size : App.brush.size)/2;
      var step = Math.max(1.5, r*(this.mode === 'terrain' ? 0.34 : 0.26));
      var dx = p.x-this.last.x, dy = p.y-this.last.y;
      var n = Math.max(1, Math.ceil(Math.hypot(dx,dy)/step));
      for (var i=1; i<=n; i++) this.stamp(this.last.x+dx*i/n, this.last.y+dy*i/n);
      this.last = p;
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
        var r = App.terrain.size/2;
        Terrain.scatter(ctx, App.terrain.type, x, y, r, App.terrain.opacity);
        this.expandBox(x, y, r+3);
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

      if (this.mode === 'terrain' && App.terrain.clip) this.maskToLand(box);

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
      Eyedropper.paint(layer.ctx, x, y, r);
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

      var id = tx.getImageData(0, 0, w, h), d = id.data;
      var c = App.brush.color.replace('#','');
      if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
      var R = parseInt(c.substr(0,2),16), G = parseInt(c.substr(2,2),16), B = parseInt(c.substr(4,2),16);
      for (var i=0; i<d.length; i+=4) {
        if (d[i+3] > 128) { d[i]=R; d[i+1]=G; d[i+2]=B; d[i+3]=255; }
        else d[i+3] = 0;
      }
      tx.putImageData(id, 0, 0);
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
        hue:s.hue, opacity:s.opacity
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
      L.objects.push(o);
      App.selection = { layerId:'labels', id:o.id };
      History.pushVector('labels', before, JSON.parse(JSON.stringify(L.objects)), 'label');
      UI.refreshHistory(); UI.refreshSelection();
    },

    /* ================= NEHİR / YOL ================= */
    addPathPoint: function (p) {
      var lid = App.tool === 'river' ? 'rivers' : 'roads';
      var L = Layers.get(lid);
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      this.pathPts.push([p.x, p.y]);
      this.pathHover = p;
    },

    finishPath: function () {
      if (this.pathPts.length < 2) { this.pathPts = []; Cv.requestRender(); return; }
      var isRiver = App.tool === 'river';
      var lid = isRiver ? 'rivers' : 'roads';
      var L = Layers.get(lid);
      var before = JSON.parse(JSON.stringify(L.objects));
      var o = isRiver
        ? { id:uid(), pts:this.pathPts.slice(), width:App.river.width, meander:App.river.meander,
            taper:App.river.taper, color:App.river.color, opacity:1 }
        : { id:uid(), pts:this.pathPts.slice(), width:App.road.width, style:App.road.style,
            color:App.road.color, opacity:1 };
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
    hitScale: function (p) {
      if (!App.scale || !App.scale.visible) return false;
      var b = Cv.scaleBounds(App.scale);
      var m = App.scale.size*0.6;
      return p.x >= b.x-m && p.x <= b.x+b.w+m && p.y >= b.y-m && p.y <= b.y+b.h+m;
    },

    hitTest: function (p) {
      var order = ['labels','symbols','roads','rivers'];
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
          } else {
            var pts = order[i]==='rivers' ? Cv.riverGeometry(o) : Cv.roadGeometry(o);
            if (Geo.distToPolyline(p.x, p.y, pts) < Math.max(8, (o.width||6)*0.9))
              return { layerId:order[i], id:o.id, obj:o };
          }
        }
      }
      return null;
    },

    startSelect: function (p) {
      var hit = this.hitTest(p);
      if (!hit) { App.selection = null; UI.refreshSelection(); Cv.requestRender(); return; }
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
        ctx.strokeStyle = App.tool === 'river' ? App.river.color : App.road.color;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = Math.max(1/z, (App.tool==='river'?App.river.width:App.road.width));
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.stroke(Geo.polyPath(sm));
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#c99a4b';
        for (var i=0; i<this.pathPts.length; i++) {
          ctx.beginPath(); ctx.arc(this.pathPts[i][0], this.pathPts[i][1], 4/z, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
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
        var g = App.selection.layerId==='rivers' ? Cv.riverGeometry(o) : Cv.roadGeometry(o);
        ctx.stroke(Geo.polyPath(g));
        ctx.setLineDash([]);
        ctx.fillStyle = '#c99a4b';
        for (var k=0; k<o.pts.length; k++) {
          ctx.beginPath(); ctx.arc(o.pts[k][0], o.pts[k][1], 4/z, 0, Math.PI*2); ctx.fill();
        }
      } else {
        var b = App.selection.layerId==='labels' ? Cv.labelBounds(o) : Sym.bounds(o);
        ctx.strokeRect(b.x-4/z, b.y-4/z, b.w+8/z, b.h+8/z);
      }
      ctx.restore();
    }
  };

  global.Tools = Tools;
  global.Eyedropper = Eyedropper;
  global.uid = uid;
})(window);
