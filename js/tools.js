/* ============================================================
   Cartographer — tools.js  v2
   Tüm araç mantığı + Eyedropper (composite örnekleme) +
   custom PNG sembol desteği.
   ============================================================ */
(function (global) {
  'use strict';

  function uid(){return'o'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);}

  /* ====================================================================
     EYEDROPPER — composite canvas örnekleme
     Seçilen daire alanından renk + kenar karakteri çıkarır,
     prosedürel fırça olarak kullanır.
     ==================================================================== */
  var Eyedropper = {
    active: false,
    sample: null,      // {r,g,b, edges:[ {angle,strength} ], baseColor:'#rrggbb' }
    picking: false,
    pickPos: null,
    pickR: 60,

    /* Composite canvas'tan belirtilen daire içini analiz et */
    analyze: function(cx, cy, radius) {
      /* geçici canvas'a mevcut render'ı al */
      var W=Cv.W, H=Cv.H;
      var tmp=document.createElement('canvas');
      tmp.width=W; tmp.height=H;
      var tx=tmp.getContext('2d');
      Cv.renderMap(tx,{includeReference:true,forExport:false});

      var r=Math.max(4,Math.round(radius));
      var x0=Math.max(0,Math.round(cx-r)), y0=Math.max(0,Math.round(cy-r));
      var x1=Math.min(W,Math.round(cx+r)), y1=Math.min(H,Math.round(cy+r));
      var w=x1-x0, h=y1-y0;
      if(w<2||h<2)return null;

      var id=tx.getImageData(x0,y0,w,h), d=id.data;

      /* --- ortalama renk (daire maskesi) --- */
      var rSum=0,gSum=0,bSum=0,cnt=0;
      for(var py=0;py<h;py++){
        for(var px=0;px<w;px++){
          var dx=px-w/2, dy=py-h/2;
          if(dx*dx+dy*dy>r*r)continue;
          var idx=(py*w+px)*4;
          rSum+=d[idx]; gSum+=d[idx+1]; bSum+=d[idx+2]; cnt++;
        }
      }
      if(!cnt)return null;
      var ar=Math.round(rSum/cnt), ag=Math.round(gSum/cnt), ab=Math.round(bSum/cnt);
      var baseColor='#'+[ar,ag,ab].map(function(v){return('0'+v.toString(16)).slice(-2);}).join('');

      /* --- basit Sobel kenar tespiti → çizgi örnekleri --- */
      var gray=new Float32Array(w*h);
      for(var i=0;i<w*h;i++){
        var idx2=i*4;
        gray[i]=(d[idx2]*0.299+d[idx2+1]*0.587+d[idx2+2]*0.114)/255;
      }
      var edges=[];
      var step=Math.max(1,Math.round(r/8));
      for(var py2=1;py2<h-1;py2+=step){
        for(var px2=1;px2<w-1;px2+=step){
          var ddx=px2-w/2, ddy=py2-h/2;
          if(ddx*ddx+ddy*ddy>r*r)continue;
          var gx=(-gray[(py2-1)*w+(px2-1)]+gray[(py2-1)*w+(px2+1)]
                  -2*gray[py2*w+(px2-1)]+2*gray[py2*w+(px2+1)]
                  -gray[(py2+1)*w+(px2-1)]+gray[(py2+1)*w+(px2+1)]);
          var gy=(-gray[(py2-1)*w+(px2-1)]-2*gray[(py2-1)*w+px2]-gray[(py2-1)*w+(px2+1)]
                  +gray[(py2+1)*w+(px2-1)]+2*gray[(py2+1)*w+px2]+gray[(py2+1)*w+(px2+1)]);
          var mag=Math.hypot(gx,gy);
          if(mag>0.06){
            edges.push({
              angle:Math.atan2(gy,gx),
              strength:Math.min(1,mag*2),
              rx:(px2/w-0.5), ry:(py2/h-0.5)  /* daire içi göreli konum */
            });
          }
        }
      }

      /* en güçlü 24 kenarı sakla */
      edges.sort(function(a,b){return b.strength-a.strength;});
      edges=edges.slice(0,24);

      /* renk varyasyonu */
      var rVar=0,gVar=0,bVar=0;
      for(var py3=0;py3<h;py3+=step){
        for(var px3=0;px3<w;px3+=step){
          var dx2=px3-w/2,dy2=py3-h/2;
          if(dx2*dx2+dy2*dy2>r*r)continue;
          var idx3=(py3*w+px3)*4;
          rVar+=Math.abs(d[idx3]-ar);
          gVar+=Math.abs(d[idx3+1]-ag);
          bVar+=Math.abs(d[idx3+2]-ab);
        }
      }
      var variance=Math.min(60,(rVar+gVar+bVar)/cnt);

      return {
        r:ar, g:ag, b:ab, baseColor:baseColor,
        edges:edges, variance:variance,
        cx:cx, cy:cy, radius:radius
      };
    },

    /* Örneklenen dokuyu belirtilen merkeze çiz */
    paint: function(ctx, mx, my, brushRadius) {
      var s=this.sample;
      if(!s)return;

      /* arka plan rengi */
      ctx.save();
      ctx.globalAlpha=0.82;
      ctx.fillStyle=s.baseColor;
      ctx.beginPath();
      ctx.arc(mx,my,brushRadius,0,Math.PI*2);
      ctx.fill();
      ctx.restore();

      if(!s.edges.length)return;

      /* kenarları rastgele dağıt */
      var rng=Math.random;
      var edgeCount=Math.max(2,Math.round(s.edges.length*(brushRadius/s.radius)));
      ctx.save();
      ctx.globalAlpha=0.55;
      ctx.lineCap='round';

      for(var i=0;i<edgeCount;i++){
        var e=s.edges[Math.floor(rng()*s.edges.length)];
        /* rastgele daire içi konum */
        var a=rng()*Math.PI*2, d=(rng()*0.85)*brushRadius;
        var px=mx+Math.cos(a)*d, py=my+Math.sin(a)*d;
        /* kenar uzunluğu ve açısı */
        var angle=e.angle+(rng()-0.5)*0.6;
        var len=brushRadius*(0.08+rng()*0.18)*e.strength;
        var r2=s.r+(rng()-0.5)*s.variance*0.6;
        var g2=s.g+(rng()-0.5)*s.variance*0.6;
        var b2=s.b+(rng()-0.5)*s.variance*0.6;
        r2=Math.max(0,Math.min(255,r2));
        g2=Math.max(0,Math.min(255,g2));
        b2=Math.max(0,Math.min(255,b2));
        ctx.strokeStyle='rgb('+Math.round(r2)+','+Math.round(g2)+','+Math.round(b2)+')';
        ctx.lineWidth=Math.max(0.6, brushRadius*0.025*e.strength*(0.5+rng()*0.8));
        ctx.globalAlpha=(0.3+rng()*0.5)*e.strength;
        ctx.beginPath();
        ctx.moveTo(px-Math.cos(angle)*len, py-Math.sin(angle)*len);
        ctx.lineTo(px+Math.cos(angle)*len, py+Math.sin(angle)*len);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  /* ====================================================================
     TOOLS
     ==================================================================== */
  var Tools = {
    painting:false, panning:false, spaceDown:false,
    panStart:null, last:null, box:null,
    beforeCanvas:null, beforeObjects:null,
    pathPts:[], pathHover:null,
    dragging:null, activeLayerId:null,
    eyePickingMode:false,  /* true = daire seçimi aktif */
    eyeStartPos:null,

    bind:function(){
      var v=Cv.view, self=this;
      v.addEventListener('pointerdown',function(e){self.onDown(e);});
      v.addEventListener('pointermove',function(e){self.onMove(e);});
      window.addEventListener('pointerup',function(e){self.onUp(e);});
      v.addEventListener('pointerleave',function(){Cv.mouse.over=false;Cv.requestRender();});
      v.addEventListener('pointerenter',function(){Cv.mouse.over=true;});
      v.addEventListener('dblclick',function(e){e.preventDefault();self.finishPath();});
      v.addEventListener('contextmenu',function(e){
        if(self.pathPts.length){e.preventDefault();self.finishPath();}
      });
      v.addEventListener('wheel',function(e){
        e.preventDefault();
        var r=v.getBoundingClientRect();
        var f=e.deltaY<0?1.12:1/1.12;
        Cv.setZoom(Cv.zoom*f,e.clientX-r.left,e.clientY-r.top);
      },{passive:false});
      Cv.mini.addEventListener('pointerdown',function(e){
        var r=Cv.mini.getBoundingClientRect();
        var s=Cv.mini.width/Math.max(Cv.W,Cv.H);
        Cv.centerOn((e.clientX-r.left)/s,(e.clientY-r.top)/s);
      });
    },

    pos:function(e){
      var r=Cv.view.getBoundingClientRect();
      return Cv.screenToMap(e.clientX-r.left,e.clientY-r.top);
    },

    onDown:function(e){
      var p=this.pos(e);
      Cv.mouse.x=p.x;Cv.mouse.y=p.y;Cv.mouse.over=true;
      if(e.button===1||this.spaceDown||App.tool==='pan'){
        this.panning=true;
        this.panStart={x:e.clientX,y:e.clientY,px:Cv.panX,py:Cv.panY};
        Cv.view.classList.add('panning'); return;
      }
      if(e.button!==0)return;
      Cv.view.setPointerCapture(e.pointerId);

      /* --- eyedropper: daire seçimi başlat --- */
      if(App.tool==='eyedrop'){
        if(Eyedropper.active){
          /* örnekle ve fırça moduna geç */
          var r=App.eyedrop.radius;
          var s=Eyedropper.analyze(p.x,p.y,r);
          if(s){
            Eyedropper.sample=s;
            App.eyedrop.hasSample=true;
            App.eyedrop.painting=true;
            UI.msg('✓ Doku örneklendi — şimdi haritaya boyayabilirsin');
            this.startEyedropPaint(p);
          }
        } else {
          /* pick modu: daire çizerek alan seç */
          Eyedropper.picking=true;
          Eyedropper.pickPos={x:p.x,y:p.y};
          this.eyeStartPos=p;
        }
        return;
      }

      /* --- eyedrop paint modu aktifken diğer araçlar --- */
      switch(App.tool){
        case 'landmass': this.startRaster('landmass',p,'paint'); break;
        case 'erase':    this.startRaster('landmass',p,'erase'); break;
        case 'terrain':  this.startRaster('terrain',p,'terrain'); break;
        case 'symbol':   this.placeSymbol(p); break;
        case 'river':
        case 'road':     this.addPathPoint(p); break;
        case 'label':    this.placeLabel(p); break;
        case 'select':   this.startSelect(p,e); break;
      }
      Cv.requestRender();
    },

    onMove:function(e){
      var p=this.pos(e);
      Cv.mouse.x=p.x;Cv.mouse.y=p.y;Cv.mouse.over=true;

      if(this.panning&&this.panStart){
        Cv.panX=this.panStart.px+(e.clientX-this.panStart.x);
        Cv.panY=this.panStart.py+(e.clientY-this.panStart.y);
        Cv.requestRender(); return;
      }

      /* eyedropper pick: yarıçapı güncelle */
      if(App.tool==='eyedrop'&&Eyedropper.picking&&this.eyeStartPos){
        var d=Math.hypot(p.x-this.eyeStartPos.x,p.y-this.eyeStartPos.y);
        App.eyedrop.radius=Math.max(8,d);
        Cv.requestRender(); return;
      }

      /* eyedrop paint */
      if(App.tool==='eyedrop'&&App.eyedrop.painting&&this.painting){
        this.eyedropStrokeTo(p); Cv.requestRender(); return;
      }

      if(this.painting){this.strokeTo(p);Cv.requestRender();return;}
      if(this.dragging){
        var o=this.dragging.obj;
        var dx=p.x-this.dragging.sx, dy=p.y-this.dragging.sy;
        if(o.pts){
          for(var i=0;i<o.pts.length;i++){
            o.pts[i][0]=this.dragging.orig[i][0]+dx;
            o.pts[i][1]=this.dragging.orig[i][1]+dy;
          }
        } else { o.x=this.dragging.ox+dx; o.y=this.dragging.oy+dy; }
        Cv.requestRender(); return;
      }
      if(this.pathPts.length){this.pathHover=p;Cv.requestRender();return;}
      Cv.requestRender();
    },

    onUp:function(e){
      if(this.panning){this.panning=false;Cv.view.classList.remove('panning');return;}

      /* eyedropper pick bitti */
      if(App.tool==='eyedrop'&&Eyedropper.picking){
        Eyedropper.picking=false;
        var ep=this.eyeStartPos;
        if(ep){
          /* pick bölgesini analiz et */
          var s=Eyedropper.analyze(ep.x,ep.y,App.eyedrop.radius);
          if(s){
            Eyedropper.sample=s;App.eyedrop.hasSample=true;App.eyedrop.painting=false;
            Eyedropper.active=true;
            UI.msg('✓ Doku kaydedildi — "Boyama modu"na geç veya aynı araçla boyamaya başla');
            UI.refreshEyedropPanel();
          }
        }
        this.eyeStartPos=null;
        Cv.requestRender(); return;
      }

      if(App.tool==='eyedrop'&&this.painting){
        this.endRaster();
        return;
      }

      if(this.painting)this.endRaster();
      if(this.dragging){
        var d=this.dragging;
        this.dragging=null;
        var layer=Layers.get(d.layerId);
        History.pushVector(d.layerId,d.before,JSON.parse(JSON.stringify(layer.objects)),'move');
        UI.refreshHistory();
      }
    },

    /* ---- eyedrop paint başlat ---- */
    startEyedropPaint:function(p){
      var lid=App.eyedrop.targetLayer||'terrain';
      var layer=Layers.get(lid);
      if(!layer||layer.locked||!layer.visible){UI.msg(UI.t('locked'));return;}
      this.painting=true; this.mode='eyedrop';
      this.activeLayerId=lid;
      this.last=p;
      this.box={x0:p.x,y0:p.y,x1:p.x,y1:p.y};
      if(!this.beforeCanvas)this.beforeCanvas=document.createElement('canvas');
      if(this.beforeCanvas.width!==layer.canvas.width||this.beforeCanvas.height!==layer.canvas.height){
        this.beforeCanvas.width=layer.canvas.width;
        this.beforeCanvas.height=layer.canvas.height;
      }
      var bx=this.beforeCanvas.getContext('2d');
      bx.clearRect(0,0,this.beforeCanvas.width,this.beforeCanvas.height);
      bx.drawImage(layer.canvas,0,0);
      this.eyedropStamp(p.x,p.y);
    },

    eyedropStamp:function(x,y){
      var layer=Layers.get(this.activeLayerId);
      if(!layer)return;
      var r=App.eyedrop.brushRadius||80;
      Eyedropper.paint(layer.ctx,x,y,r);
      this.expandBox(x,y,r+2);
    },

    eyedropStrokeTo:function(p){
      if(!this.last){this.last=p;return;}
      var r=App.eyedrop.brushRadius||80;
      var step=Math.max(2,r*0.25);
      var dx=p.x-this.last.x, dy=p.y-this.last.y, dist=Math.hypot(dx,dy);
      var n=Math.max(1,Math.ceil(dist/step));
      for(var i=1;i<=n;i++)this.eyedropStamp(this.last.x+dx*i/n,this.last.y+dy*i/n);
      this.last=p;
    },

    /* ============ raster fırçalar ============ */
    startRaster:function(layerId,p,mode){
      var layer=Layers.get(layerId);
      if(!layer||layer.locked||!layer.visible){UI.msg(UI.t('locked'));return;}
      this.painting=true; this.mode=mode; this.activeLayerId=layerId;
      this.last=p;
      this.box={x0:p.x,y0:p.y,x1:p.x,y1:p.y};
      this.pat=null; this.patType=null;
      if(!this.beforeCanvas)this.beforeCanvas=document.createElement('canvas');
      if(this.beforeCanvas.width!==layer.canvas.width||this.beforeCanvas.height!==layer.canvas.height){
        this.beforeCanvas.width=layer.canvas.width;
        this.beforeCanvas.height=layer.canvas.height;
      }
      var bx=this.beforeCanvas.getContext('2d');
      bx.clearRect(0,0,this.beforeCanvas.width,this.beforeCanvas.height);
      bx.drawImage(layer.canvas,0,0);
      this.stamp(p.x,p.y);
    },

    strokeTo:function(p){
      if(!this.last){this.last=p;return;}
      var r=(this.mode==='terrain'?App.terrain.size:App.brush.size)/2;
      var step=Math.max(1.5,r*0.28);
      var dx=p.x-this.last.x,dy=p.y-this.last.y,dist=Math.hypot(dx,dy);
      var n=Math.max(1,Math.ceil(dist/step));
      for(var i=1;i<=n;i++)this.stamp(this.last.x+dx*i/n,this.last.y+dy*i/n);
      this.last=p;
    },

    expandBox:function(x,y,r){
      var b=this.box;if(!b)return;
      b.x0=Math.min(b.x0,x-r);b.y0=Math.min(b.y0,y-r);
      b.x1=Math.max(b.x1,x+r);b.y1=Math.max(b.y1,y+r);
    },

    stamp:function(x,y){
      var layer=Layers.get(this.activeLayerId);
      var ctx=layer.ctx;
      if(this.mode==='terrain'){
        var r=App.terrain.size/2;
        if(!this.pat||this.patType!==App.terrain.type){
          this.pat=Terrain.pattern(ctx,App.terrain.type);
          this.patType=App.terrain.type;
        }
        var pat=this.pat;
        ctx.save();
        var rings=[[1,1],[0.82,0.55],[0.62,0.35]];
        for(var i=0;i<rings.length;i++){
          ctx.globalAlpha=App.terrain.opacity*rings[i][1];
          ctx.fillStyle=pat;
          ctx.beginPath();ctx.arc(x,y,r*rings[i][0],0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
        this.expandBox(x,y,r+2); return;
      }
      var rr=App.brush.size/2, rough=App.brush.roughness;
      ctx.save();
      if(this.mode==='erase')ctx.globalCompositeOperation='destination-out';
      ctx.fillStyle=this.mode==='erase'?'#000':App.brush.color;
      ctx.beginPath();ctx.arc(x,y,rr*(1-rough*0.22),0,Math.PI*2);ctx.fill();
      if(rough>0.02){
        var blobs=3+Math.round(rough*7);
        for(var k=0;k<blobs;k++){
          var a=Math.random()*Math.PI*2;
          var d=rr*(0.55+Math.random()*0.5)*(0.4+rough*0.9);
          var br=rr*(0.22+Math.random()*0.45)*(0.5+rough);
          ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,br,0,Math.PI*2);ctx.fill();
        }
      }
      ctx.restore();
      this.expandBox(x,y,rr*1.9+4);
    },

    endRaster:function(){
      this.painting=false;
      var layer=Layers.get(this.activeLayerId);
      var b=this.box;if(!b)return;
      var pad=4;
      var box={
        x:Math.max(0,b.x0-pad),y:Math.max(0,b.y0-pad),
        w:Math.min(Cv.W,b.x1+pad)-Math.max(0,b.x0-pad),
        h:Math.min(Cv.H,b.y1+pad)-Math.max(0,b.y0-pad)
      };
      if(this.mode==='terrain'&&App.terrain.clip)this.maskToLand(box);
      History.pushRaster(this.activeLayerId,this.beforeCanvas,layer.canvas,box,
        this.mode==='terrain'?'terrain:'+App.terrain.type:this.mode);
      this.box=null;this.last=null;
      UI.refreshHistory();Cv.requestRender();
    },

    maskToLand:function(box){
      var T=Layers.get('terrain'),L=Layers.get('landmass');
      var w=Math.max(1,Math.ceil(box.w)),h=Math.max(1,Math.ceil(box.h));
      var x=Math.floor(box.x),y=Math.floor(box.y);
      var t=document.createElement('canvas');t.width=w;t.height=h;
      var tx=t.getContext('2d');
      tx.drawImage(T.canvas,x,y,w,h,0,0,w,h);
      tx.globalCompositeOperation='destination-in';
      tx.drawImage(L.canvas,x,y,w,h,0,0,w,h);
      T.ctx.clearRect(x,y,w,h);T.ctx.drawImage(t,x,y);
    },

    smoothCoast:function(strength){
      var L=Layers.get('landmass');
      if(L.locked){UI.msg(UI.t('locked'));return;}
      var w=L.canvas.width,h=L.canvas.height;
      var before=document.createElement('canvas');before.width=w;before.height=h;
      before.getContext('2d').drawImage(L.canvas,0,0);
      var t=document.createElement('canvas');t.width=w;t.height=h;
      var tx=t.getContext('2d',{willReadFrequently:true});
      tx.filter='blur('+(strength||6)+'px)';tx.drawImage(L.canvas,0,0);tx.filter='none';
      var id=tx.getImageData(0,0,w,h),d=id.data;
      var c=App.brush.color.replace('#','');
      if(c.length===3)c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
      var R=parseInt(c.substr(0,2),16),G=parseInt(c.substr(2,2),16),B=parseInt(c.substr(4,2),16);
      for(var i=0;i<d.length;i+=4){
        if(d[i+3]>128){d[i]=R;d[i+1]=G;d[i+2]=B;d[i+3]=255;}
        else{d[i+3]=0;}
      }
      tx.putImageData(id,0,0);
      L.ctx.clearRect(0,0,w,h);L.ctx.drawImage(t,0,0);
      History.pushRaster('landmass',before,L.canvas,{x:0,y:0,w:w,h:h},'smooth');
      UI.refreshHistory();Cv.requestRender();
    },

    clearRasterLayer:function(id){
      var L=Layers.get(id);
      if(L.locked){UI.msg(UI.t('locked'));return;}
      var w=L.canvas.width,h=L.canvas.height;
      var before=document.createElement('canvas');before.width=w;before.height=h;
      before.getContext('2d').drawImage(L.canvas,0,0);
      L.ctx.clearRect(0,0,w,h);
      History.pushRaster(id,before,L.canvas,{x:0,y:0,w:w,h:h},'clear:'+id);
      UI.refreshHistory();Cv.requestRender();
    },

    /* ============ semboller ============ */
    placeSymbol:function(p){
      var L=Layers.get('symbols');
      if(L.locked||!L.visible){UI.msg(UI.t('locked'));return;}
      var before=JSON.parse(JSON.stringify(L.objects));
      var s=App.symbol;
      var j=s.jitter?1:0;
      var o={
        id:uid(),sym:s.id,
        x:p.x+(Math.random()-0.5)*s.size*0.25*j,
        y:p.y+(Math.random()-0.5)*s.size*0.25*j,
        size:s.size*(1+(Math.random()-0.5)*0.28*j),
        rot:s.rot+(Math.random()-0.5)*10*j,
        hue:s.hue, opacity:s.opacity
      };
      L.objects.push(o);
      App.selection={layerId:'symbols',id:o.id};
      History.pushVector('symbols',before,JSON.parse(JSON.stringify(L.objects)),'symbol:'+s.id);
      UI.refreshHistory();UI.refreshSelection();
    },

    /* ============ etiketler ============ */
    placeLabel:function(p){
      var L=Layers.get('labels');
      if(L.locked||!L.visible){UI.msg(UI.t('locked'));return;}
      var txt=document.getElementById('lb-text').value.trim();
      if(!txt){UI.msg(UI.t('needtext'));return;}
      var before=JSON.parse(JSON.stringify(L.objects));
      var s=App.label;
      var o={
        id:uid(),text:txt,x:p.x,y:p.y,
        font:s.font,size:s.size,color:s.color,
        outline:s.outline,outlineColor:s.outlineColor,
        shadow:s.shadow,curve:s.curve,track:s.track,rot:s.rot,opacity:1
      };
      L.objects.push(o);
      App.selection={layerId:'labels',id:o.id};
      History.pushVector('labels',before,JSON.parse(JSON.stringify(L.objects)),'label');
      UI.refreshHistory();UI.refreshSelection();
    },

    /* ============ yol/nehir ============ */
    addPathPoint:function(p){
      var lid=App.tool==='river'?'rivers':'roads';
      var L=Layers.get(lid);
      if(L.locked||!L.visible){UI.msg(UI.t('locked'));return;}
      this.pathPts.push([p.x,p.y]);
      this.pathHover=p;
    },

    finishPath:function(){
      if(this.pathPts.length<2){this.pathPts=[];Cv.requestRender();return;}
      var isRiver=App.tool==='river';
      var lid=isRiver?'rivers':'roads';
      var L=Layers.get(lid);
      var before=JSON.parse(JSON.stringify(L.objects));
      var o;
      if(isRiver){
        o={id:uid(),pts:this.pathPts.slice(),width:App.river.width,meander:App.river.meander,
           taper:App.river.taper,color:App.river.color,opacity:1};
      } else {
        o={id:uid(),pts:this.pathPts.slice(),width:App.road.width,style:App.road.style,
           color:App.road.color,opacity:1};
      }
      L.objects.push(o);
      this.pathPts=[];this.pathHover=null;
      App.selection={layerId:lid,id:o.id};
      History.pushVector(lid,before,JSON.parse(JSON.stringify(L.objects)),lid);
      UI.refreshHistory();UI.refreshSelection();Cv.requestRender();
    },

    cancelPath:function(){this.pathPts=[];this.pathHover=null;Cv.requestRender();},

    undoPathPoint:function(){
      if(this.pathPts.length){this.pathPts.pop();Cv.requestRender();return true;}
      return false;
    },

    /* ============ seçim ============ */
    hitTest:function(p){
      var order=['labels','symbols','roads','rivers'];
      for(var i=0;i<order.length;i++){
        var L=Layers.get(order[i]);
        if(!L.visible||L.locked)continue;
        for(var j=L.objects.length-1;j>=0;j--){
          var o=L.objects[j];
          if(order[i]==='symbols'){
            var b=Sym.bounds(o);
            if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h)
              return{layerId:'symbols',id:o.id,obj:o};
          } else if(order[i]==='labels'){
            var lb=Cv.labelBounds(o);
            if(p.x>=lb.x-6&&p.x<=lb.x+lb.w+6&&p.y>=lb.y-6&&p.y<=lb.y+lb.h+6)
              return{layerId:'labels',id:o.id,obj:o};
          } else {
            var pts=order[i]==='rivers'?Cv.riverGeometry(o):Cv.roadGeometry(o);
            var d=Geo.distToPolyline(p.x,p.y,pts);
            if(d<Math.max(8,(o.width||6)*0.9))
              return{layerId:order[i],id:o.id,obj:o};
          }
        }
      }
      return null;
    },

    startSelect:function(p){
      var hit=this.hitTest(p);
      if(!hit){App.selection=null;UI.refreshSelection();Cv.requestRender();return;}
      App.selection={layerId:hit.layerId,id:hit.id};
      var L=Layers.get(hit.layerId);
      this.dragging={
        layerId:hit.layerId,obj:hit.obj,sx:p.x,sy:p.y,
        ox:hit.obj.x,oy:hit.obj.y,
        orig:hit.obj.pts?JSON.parse(JSON.stringify(hit.obj.pts)):null,
        before:JSON.parse(JSON.stringify(L.objects))
      };
      UI.refreshSelection();
    },

    selected:function(){
      if(!App.selection)return null;
      var L=Layers.get(App.selection.layerId);if(!L)return null;
      for(var i=0;i<L.objects.length;i++)if(L.objects[i].id===App.selection.id)return L.objects[i];
      return null;
    },

    deleteSelection:function(){
      var s=App.selection;if(!s)return;
      var L=Layers.get(s.layerId);
      var before=JSON.parse(JSON.stringify(L.objects));
      L.objects=L.objects.filter(function(o){return o.id!==s.id;});
      App.selection=null;
      History.pushVector(s.layerId,before,JSON.parse(JSON.stringify(L.objects)),'delete');
      UI.refreshHistory();UI.refreshSelection();Cv.requestRender();
    },

    duplicateSelection:function(){
      var o=this.selected();if(!o)return;
      var L=Layers.get(App.selection.layerId);
      var before=JSON.parse(JSON.stringify(L.objects));
      var c=JSON.parse(JSON.stringify(o));c.id=uid();
      var off=40;
      if(c.pts)c.pts=c.pts.map(function(p){return[p[0]+off,p[1]+off];});
      else{c.x+=off;c.y+=off;}
      L.objects.push(c);
      App.selection={layerId:App.selection.layerId,id:c.id};
      History.pushVector(App.selection.layerId,before,JSON.parse(JSON.stringify(L.objects)),'duplicate');
      UI.refreshHistory();UI.refreshSelection();Cv.requestRender();
    },

    applyToSelection:function(props){
      var o=this.selected();if(!o)return false;
      Object.keys(props).forEach(function(k){o[k]=props[k];});
      Cv.requestRender();return true;
    },

    commitSelectionEdit:function(beforeArr,label){
      if(!App.selection)return;
      var L=Layers.get(App.selection.layerId);
      History.pushVector(App.selection.layerId,beforeArr,JSON.parse(JSON.stringify(L.objects)),label||'edit');
      UI.refreshHistory();
    },

    /* ============ üst katman çizimi ============ */
    drawOverlay:function(ctx){
      var z=Cv.zoom;

      /* eyedropper: pick dairesi */
      if(App.tool==='eyedrop'&&Eyedropper.picking&&this.eyeStartPos){
        var ep=this.eyeStartPos;
        ctx.save();
        ctx.strokeStyle='rgba(200,160,50,0.9)';ctx.lineWidth=2/z;
        ctx.setLineDash([6/z,4/z]);
        ctx.beginPath();ctx.arc(ep.x,ep.y,App.eyedrop.radius,0,Math.PI*2);ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      /* eyedropper: örneklenmiş doku önizlemesi */
      if(App.tool==='eyedrop'&&Eyedropper.sample&&!Eyedropper.picking&&!App.eyedrop.painting){
        var s=Eyedropper.sample;
        ctx.save();
        ctx.globalAlpha=0.5;
        ctx.strokeStyle=s.baseColor;ctx.lineWidth=4/z;
        ctx.beginPath();ctx.arc(s.cx,s.cy,s.radius,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }

      /* yol önizlemesi */
      if(this.pathPts.length){
        var pts=this.pathPts.slice();
        if(this.pathHover)pts.push([this.pathHover.x,this.pathHover.y]);
        var sm=Geo.sample(pts,14);
        ctx.save();
        ctx.strokeStyle=App.tool==='river'?App.river.color:App.road.color;
        ctx.globalAlpha=0.75;
        ctx.lineWidth=Math.max(1/z,(App.tool==='river'?App.river.width:App.road.width));
        ctx.lineCap='round';ctx.lineJoin='round';
        ctx.stroke(Geo.polyPath(sm));
        ctx.globalAlpha=1;ctx.fillStyle='#c99a4b';
        for(var i=0;i<this.pathPts.length;i++){
          ctx.beginPath();ctx.arc(this.pathPts[i][0],this.pathPts[i][1],4/z,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
      }

      /* seçim vurgusu */
      var o=this.selected();if(!o)return;
      ctx.save();
      ctx.strokeStyle='#c99a4b';ctx.lineWidth=1.5/z;ctx.setLineDash([6/z,4/z]);
      if(o.pts){
        var g=App.selection.layerId==='rivers'?Cv.riverGeometry(o):Cv.roadGeometry(o);
        ctx.stroke(Geo.polyPath(g));
        ctx.setLineDash([]);ctx.fillStyle='#c99a4b';
        for(var k=0;k<o.pts.length;k++){
          ctx.beginPath();ctx.arc(o.pts[k][0],o.pts[k][1],4/z,0,Math.PI*2);ctx.fill();
        }
      } else {
        var b=App.selection.layerId==='labels'?Cv.labelBounds(o):Sym.bounds(o);
        ctx.strokeRect(b.x-4/z,b.y-4/z,b.w+8/z,b.h+8/z);
      }
      ctx.restore();
    }
  };

  global.Tools=Tools;
  global.Eyedropper=Eyedropper;
  global.uid=uid;
})(window);
