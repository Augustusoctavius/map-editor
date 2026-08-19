/* ============================================================
   Medieval Map Editor — iso.js
   İzometrik yapı motoru.
   • Paralel projeksiyon: sx=(x-y)*0.866, sy=(x+y)*0.5-z
   • Katı cisimler derinliğe göre sıralanır (ressam algoritması)
   • Her yüzey: dolgu + üstüne detay çizgileri (taş sırası,
     kiremit, tahta, tarama gölge) → el çizimi hissi
   • Çıktı: Sym.part() dizisi, 0..100 kutusuna normalize
   ============================================================ */
(function (global) {
  'use strict';

  var CX = 0.866, CY = 0.5;
  function pr(x, y, z) { return [(x - y) * CX, (x + y) * CY - z]; }

  function d(pts, close) {
    var s = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (var i = 1; i < pts.length; i++) s += 'L' + pts[i][0].toFixed(2) + ' ' + pts[i][1].toFixed(2);
    return s + (close === false ? '' : 'Z');
  }
  function seg(a, b) { return 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + 'L' + b[0].toFixed(2) + ' ' + b[1].toFixed(2); }

  /* quad = [a,b,c,d]; bilineer iç nokta */
  function q(quad, u, v) {
    var ab = [quad[0][0] + (quad[1][0] - quad[0][0]) * u, quad[0][1] + (quad[1][1] - quad[0][1]) * u];
    var dc = [quad[3][0] + (quad[2][0] - quad[3][0]) * u, quad[3][1] + (quad[2][1] - quad[3][1]) * u];
    return [ab[0] + (dc[0] - ab[0]) * v, ab[1] + (dc[1] - ab[1]) * v];
  }

  /* ---------------- MALZEME ---------------- */
  var MAT = {
    stone:   { top:'#e2d7bd', left:'#c3b598', right:'#a2937a', line:'#4b3d28', det:'#8d7f66', courses:true  },
    stoneW:  { top:'#efe7d2', left:'#dcd0b6', right:'#bcae93', line:'#4b3d28', det:'#a6987d', courses:true  },
    stoneD:  { top:'#b0a693', left:'#8d8270', right:'#6f6556', line:'#33291b', det:'#5e5648', courses:true },
    granite: { top:'#c9c3b6', left:'#a7a094', right:'#847e72', line:'#3a3226', det:'#6f695d', courses:true  },
    basalt:  { top:'#7d7570', left:'#5f5854', right:'#474140', line:'#221d1c', det:'#3b3634', courses:true  },
    wood:    { top:'#c49760', left:'#a37a46', right:'#7f5c33', line:'#3d2914', det:'#6a4a28', planks:true   },
    woodD:   { top:'#9b7443', left:'#7e5c32', right:'#5f4423', line:'#301f0e', det:'#4d3618', planks:true   },
    thatch:  { top:'#d8bd7b', left:'#bd9f5c', right:'#9a7f42', line:'#4a3a1a', det:'#876c34', thatch:true   },
    tileR:   { top:'#c65f42', left:'#a94a31', right:'#873723', line:'#3c1a10', det:'#7c3220', shingle:true  },
    tileB:   { top:'#5a7fa8', left:'#456589', right:'#324c69', line:'#182634', det:'#2e465f', shingle:true  },
    tileG:   { top:'#6f8f5c', left:'#567345', right:'#405833', line:'#1c2716', det:'#3a5030', shingle:true  },
    tileD:   { top:'#5b5148', left:'#463e37', right:'#332d28', line:'#191512', det:'#2f2a25', shingle:true  },
    gold:    { top:'#e0be55', left:'#c39d34', right:'#9d7c22', line:'#463209', det:'#8e6f1d', shingle:true  },
    snow:    { top:'#f4f8fa', left:'#dee8ee', right:'#c2d2dc', line:'#5c6d78', det:'#b3c5d0' },
    ice:     { top:'#cfe4f0', left:'#adcbdd', right:'#8bafc6', line:'#42606f', det:'#8fb2c6' },
    canvasT: { top:'#e6dcc0', left:'#cfc2a0', right:'#ab9d7c', line:'#463a24', det:'#9c8e6d' },
    hide:    { top:'#c9a878', left:'#a98a5c', right:'#866b44', line:'#3b2b17', det:'#7a6039' },
    dirt:    { top:'#a98d63', left:'#8b7250', right:'#6d583c', line:'#33261a', det:'#6a5638' },
    grass:   { top:'#8ca35c', left:'#708447', right:'#556634', line:'#26301a', det:'#5c7038' },
    dark:    { top:'#4a4038', left:'#37302a', right:'#26211d', line:'#120f0d', det:'#231e1a' },
    ruin:    { top:'#c4b89e', left:'#a3987f', right:'#847a64', line:'#3c3225', det:'#7a705c', courses:true, broken:true },
    crystal: { top:'#b79ad8', left:'#9679bb', right:'#745a95', line:'#33234a', det:'#6b5289' },
    bone:    { top:'#e8e0cc', left:'#cfc6ae', right:'#ada48d', line:'#443c2c', det:'#9a917a' }
  };

  function M(k) { return MAT[k] || MAT.stone; }

  /* ---------------- SAHNE ---------------- */
  function Scene() { this.solids = []; }

  Scene.prototype.add = function (s) { this.solids.push(s); return this; };

  /* ===== temel katılar ===== */

  /** dikdörtgen prizma */
  Scene.prototype.box = function (x, y, z, w, dp, h, mat, opt) {
    return this.add({ t:'box', x:x, y:y, z:z, w:w, d:dp, h:h, m:mat||'stone', o:opt||{} });
  };

  /** beşik çatı (sırt x ekseni boyunca) */
  Scene.prototype.gable = function (x, y, z, w, dp, h, mat, opt) {
    return this.add({ t:'gable', x:x, y:y, z:z, w:w, d:dp, h:h, m:mat||'tileR', o:opt||{} });
  };

  /** kırma çatı */
  Scene.prototype.hip = function (x, y, z, w, dp, h, mat, opt) {
    return this.add({ t:'hip', x:x, y:y, z:z, w:w, d:dp, h:h, m:mat||'tileR', o:opt||{} });
  };

  /** koni (kule çatısı, çadır) */
  Scene.prototype.cone = function (x, y, z, r, h, mat, opt) {
    return this.add({ t:'cone', x:x, y:y, z:z, r:r, h:h, m:mat||'tileR', o:opt||{} });
  };

  /** silindir (yuvarlak kule, yurt gövdesi) */
  Scene.prototype.cyl = function (x, y, z, r, h, mat, opt) {
    return this.add({ t:'cyl', x:x, y:y, z:z, r:r, h:h, m:mat||'stone', o:opt||{} });
  };

  /** kubbe */
  Scene.prototype.dome = function (x, y, z, r, h, mat, opt) {
    return this.add({ t:'dome', x:x, y:y, z:z, r:r, h:h, m:mat||'gold', o:opt||{} });
  };

  /** soğan kubbe */
  Scene.prototype.onion = function (x, y, z, r, h, mat, opt) {
    return this.add({ t:'onion', x:x, y:y, z:z, r:r, h:h, m:mat||'gold', o:opt||{} });
  };

  /** zemin yastığı (elips) — kaldırıldı: her arazi dokusuna uymuyordu ve
      bazı binalarda görsel olarak kötü duruyordu. Katalogdaki 239 çağrı
      noktasını tek tek değiştirmemek için burada no-op yapıldı; build()
      zaten sıfır zemin nesnesiyle sorunsuz çalışıyor. */
  Scene.prototype.pad = function () {
    return this;
  };

  /** düzensiz kaya */
  Scene.prototype.rock = function (x, y, z, r, h, mat, opt) {
    return this.add({ t:'rock', x:x, y:y, z:z, r:r, h:h, m:mat||'granite', o:opt||{} });
  };

  /* ===== bileşik: mazgallı sur dişleri ===== */
  Scene.prototype.crenel = function (x, y, z, w, dp, cw, ch, mat) {
    var n = Math.max(2, Math.round(w / (cw * 1.9)));
    var sx = w / n, i;
    for (i = 0; i < n; i++) this.box(x + i * sx, y + dp - cw, z, sx * 0.60, cw, ch, mat, { plain:true });
    var m = Math.max(2, Math.round(dp / (cw * 1.9)));
    var sy = dp / m;
    for (i = 0; i < m; i++) this.box(x + w - cw, y + i * sy, z, cw, sy * 0.60, ch, mat, { plain:true });
    return this;
  };

  /* ===== bileşik: kazık çit (tek tek kazıklar, sivri uçlu) ===== */
  Scene.prototype.palisade = function (x, y, z, w, dp, h, mat, opt) {
    opt = opt || {};
    var sw = opt.stake || Math.max(1.6, h * 0.115);
    var gap = sw * 0.12;
    var i, n, step;

    /* ön kenar (x boyunca) */
    n = Math.max(2, Math.round(w / (sw + gap)));
    step = w / n;
    for (i = 0; i < n; i++) {
      var hh = h * (0.93 + ((i * 37) % 11) / 90);
      this.add({ t:'stake', x:x + i * step, y:y + dp - sw, z:z, w:step - gap, d:sw, h:hh, m:mat||'woodD', o:{} });
    }
    /* sağ kenar (y boyunca) */
    if (opt.corner !== false) {
      n = Math.max(2, Math.round(dp / (sw + gap)));
      step = dp / n;
      for (i = 0; i < n; i++) {
        var hh2 = h * (0.93 + ((i * 53) % 11) / 90);
        this.add({ t:'stake', x:x + w - sw, y:y + i * step, z:z, w:sw, d:step - gap, h:hh2, m:mat||'woodD', o:{} });
      }
    }
    return this;
  };

  /* ===== bileşik: kazıklı çit (alçak, aralıklı) ===== */
  Scene.prototype.fence = function (x, y, z, w, dp, h, mat) {
    var sw = Math.max(1.1, h * 0.16), i, n, step;
    n = Math.max(2, Math.round(w / (sw * 3.4)));
    step = w / n;
    for (i = 0; i <= n; i++) this.add({ t:'stake', x:x + i * step - sw/2, y:y + dp - sw, z:z, w:sw, d:sw, h:h, m:mat||'wood', o:{} });
    this.box(x, y + dp - sw*0.7, z + h*0.62, w, sw*0.45, sw*0.42, mat||'wood', { plain:true });
    this.box(x, y + dp - sw*0.7, z + h*0.30, w, sw*0.45, sw*0.42, mat||'wood', { plain:true });
    return this;
  };

  /* ===== bileşik: bayrak direği ===== */
  Scene.prototype.flag = function (x, y, z, h, col) {
    this.add({ t:'pole', x:x, y:y, z:z, h:h, m:'woodD', o:{} });
    this.add({ t:'flag', x:x, y:y, z:z + h * 0.72, h:h * 0.26, m:col || 'tileR', o:{} });
    return this;
  };

  /* ===== bileşik: ağaç ===== */
  Scene.prototype.tree = function (x, y, z, h, kind, mat) {
    return this.add({ t:'tree', x:x, y:y, z:z, h:h, m:mat || (kind === 'pine' ? 'tileG' : 'grass'), o:{ kind:kind || 'round' } });
  };

  /* ===== bileşik: pagoda çatısı (kavisli saçak, çok katlı) ===== */
  Scene.prototype.pagoda = function (x, y, z, w, dp, h, mat, tiers) {
    tiers = tiers || 2;
    for (var i = 0; i < tiers; i++) {
      var t = i / tiers;
      var sh = 1 - t * 0.30;
      var ov = w * 0.20 * (1 - t * 0.4);
      this.add({ t:'pagoda', x:x + (w * (1 - sh)) / 2 - ov, y:y + (dp * (1 - sh)) / 2 - ov,
                 z:z + h * 0.92 * t, w:w * sh + ov * 2, d:dp * sh + ov * 2,
                 h:h * 0.42, m:mat || 'tileB', o:{} });
    }
    return this;
  };

  /* ============================================================
     YÜZEY ÜRETİMİ
     ============================================================ */
  function emitBox(s, F) {
    var m = M(s.m), o = s.o || {};
    var P = function (a, b, c) { return pr(s.x + a, s.y + b, s.z + c); };
    var w = s.w, dp = s.d, h = s.h;

    var top   = [P(0,0,h), P(w,0,h), P(w,dp,h), P(0,dp,h)];
    var left  = [P(0,dp,0), P(0,dp,h), P(w,dp,h), P(w,dp,0)];
    var right = [P(w,dp,0), P(w,dp,h), P(w,0,h), P(w,0,0)];

    F.push({ p:left,  f:m.left,  s:m.line });
    if (!o.plain) detailFace(F, left, m, w, h, 'left', o);
    F.push({ p:right, f:m.right, s:m.line });
    if (!o.plain) detailFace(F, right, m, dp, h, 'right', o);
    F.push({ p:top,   f:m.top,   s:m.line });

    /* kapı */
    if (o.door) {
      var dw = Math.min(w * 0.34, h * 0.42), dh = h * (o.doorH || 0.58);
      var u0 = 0.5 - dw / w / 2, u1 = 0.5 + dw / w / 2;
      var v0 = 1, v1 = 1 - dh / h;
      var a = q(left, u0, v0), b = q(left, u1, v0), c = q(left, u1, v1 + 0.10), e = q(left, u0, v1 + 0.10);
      var apex = q(left, 0.5, v1);
      F.push({ p:[a, b, c, apex, e], f:m.line, s:m.line });
      F.push({ p:[a, b, c, apex, e], f:null, s:m.line, lw:1.2 });
    }
    /* pencereler */
    if (o.win) {
      var n = o.win, i;
      for (i = 0; i < n; i++) {
        var u = (i + 1) / (n + 1);
        var ww = 0.07, hh = 0.16;
        var wq = [q(left, u-ww, 0.30), q(left, u+ww, 0.30), q(left, u+ww, 0.30+hh), q(left, u-ww, 0.30+hh)];
        F.push({ p:wq, f:m.line, s:null });
      }
    }
    /* mazgal deliği (dar dikey yarık) */
    if (o.slit) {
      for (var k = 0; k < o.slit; k++) {
        var uu = (k + 1) / (o.slit + 1);
        F.push({ p:[q(left, uu-0.035, 0.26), q(left, uu+0.035, 0.26), q(left, uu+0.035, 0.56), q(left, uu-0.035, 0.56)], f:m.line, s:null });
      }
    }
  }

  /** yüzey detay çizgileri: taş sırası / tahta / kiremit / tarama */
  function detailFace(F, quad, m, spanW, spanH, side, o) {
    var lines = [], i;
    if (m.courses) {
      var rows = Math.max(2, Math.min(9, Math.round(spanH / 3.2)));
      for (i = 1; i < rows; i++) {
        var v = i / rows;
        lines.push(seg(q(quad, 0, v), q(quad, 1, v)));
      }
      /* kaydırmalı dikey derzler */
      for (i = 0; i < rows; i++) {
        var vv0 = i / rows, vv1 = (i + 1) / rows;
        var cols = Math.max(1, Math.round(spanW / 4.2));
        for (var c = 1; c < cols; c++) {
          var u = (c + (i % 2) * 0.5) / cols;
          if (u <= 0 || u >= 1) continue;
          lines.push(seg(q(quad, u, vv0 + 0.02), q(quad, u, vv1 - 0.02)));
        }
      }
    } else if (m.planks) {
      var np = Math.max(2, Math.min(10, Math.round(spanW / 2.6)));
      for (i = 1; i < np; i++) lines.push(seg(q(quad, i/np, 0.04), q(quad, i/np, 0.96)));
    }
    if (side === 'right' && !o.noHatch) {
      var nh = 4;
      for (i = 1; i <= nh; i++) {
        var t = i / (nh + 1);
        lines.push(seg(q(quad, t, 0.06), q(quad, Math.min(1, t + 0.22), 0.94)));
      }
    }
    if (lines.length) F.push({ p:null, dd:lines.join(''), f:null, s:m.det, lw:0.85 });
  }

  function emitStake(s, F) {
    var m = M(s.m);
    var P = function (a, b, c) { return pr(s.x + a, s.y + b, s.z + c); };
    var w = s.w, dp = s.d, h = s.h, tip = h * 0.16;
    var left  = [P(0,dp,0), P(0,dp,h - tip), P(w/2,dp,h), P(w,dp,h - tip), P(w,dp,0)];
    var right = [P(w,dp,0), P(w,dp,h - tip), P(w/2,dp,h), P(w,0,h - tip), P(w,0,0)];
    F.push({ p:left,  f:m.left,  s:m.line, lw:0.9 });
    F.push({ p:right, f:m.right, s:m.line, lw:0.9 });
    F.push({ p:null, dd:seg(P(w*0.5,dp,h*0.10), P(w*0.5,dp,h-tip*1.2)), f:null, s:m.det, lw:0.7 });
  }

  function emitGable(s, F) {
    var m = M(s.m), o = s.o || {};
    var P = function (a, b, c) { return pr(s.x + a, s.y + b, s.z + c); };
    var w = s.w, dp = s.d, h = s.h;
    var r1 = P(0, dp/2, h), r2 = P(w, dp/2, h);
    var f1 = P(0, dp, 0), f2 = P(w, dp, 0);
    var k1 = P(0, 0, 0),  k2 = P(w, 0, 0);

    var front = [f1, f2, r2, r1];
    var back  = [k1, k2, r2, r1];
    F.push({ p:back,  f:m.top,   s:m.line });
    shingles(F, back, m, w, dp/2, o);
    F.push({ p:front, f:m.left,  s:m.line });
    shingles(F, front, m, w, dp/2, o);
    F.push({ p:[f2, k2, r2],     f:m.right, s:m.line });
    /* sırt çizgisi */
    F.push({ p:null, dd:seg(r1, r2), f:null, s:m.line, lw:1.1 });
  }

  function emitHip(s, F) {
    var m = M(s.m), o = s.o || {};
    var P = function (a, b, c) { return pr(s.x + a, s.y + b, s.z + c); };
    var w = s.w, dp = s.d, h = s.h, inset = Math.min(w, dp) * 0.26;
    var r1 = P(inset, dp/2, h), r2 = P(w - inset, dp/2, h);
    var c1 = P(0,0,0), c2 = P(w,0,0), c3 = P(w,dp,0), c4 = P(0,dp,0);
    var front = [c4, c3, r2, r1];
    var back  = [c1, c2, r2, r1];
    F.push({ p:back,  f:m.top,   s:m.line });
    shingles(F, back, m, w, dp/2, o);
    F.push({ p:[c1, c4, r1], f:m.left, s:m.line });
    F.push({ p:front, f:m.left, s:m.line });
    shingles(F, front, m, w, dp/2, o);
    F.push({ p:[c3, c2, r2], f:m.right, s:m.line });
    F.push({ p:null, dd:seg(r1, r2), f:null, s:m.line, lw:1.1 });
  }

  function shingles(F, quad, m, spanW, spanH, o) {
    if (o && o.plain) return;
    var lines = [], i;
    if (m.thatch) {
      var n = Math.max(4, Math.round(spanW / 2.0));
      for (i = 1; i < n; i++) lines.push(seg(q(quad, i/n, 0.02), q(quad, i/n, 0.98)));
    } else {
      var rows = Math.max(2, Math.min(7, Math.round(spanH / 2.4)));
      for (i = 1; i < rows; i++) lines.push(seg(q(quad, 0, i/rows), q(quad, 1, i/rows)));
      var cols = Math.max(2, Math.round(spanW / 3.0));
      for (var r = 0; r < rows; r++) {
        for (var c2 = 1; c2 < cols; c2++) {
          var u = (c2 + (r % 2) * 0.5) / cols;
          if (u <= 0 || u >= 1) continue;
          lines.push(seg(q(quad, u, r/rows + 0.03), q(quad, u, (r+1)/rows - 0.03)));
        }
      }
    }
    if (lines.length) F.push({ p:null, dd:lines.join(''), f:null, s:m.det, lw:0.8 });
  }

  /* elips örnekleme */
  function ring(cx, cy, z, r, n) {
    var pts = [], i;
    for (i = 0; i < n; i++) {
      var t = i / n * Math.PI * 2;
      pts.push(pr(cx + Math.cos(t) * r, cy + Math.sin(t) * r, z));
    }
    return pts;
  }
  /* ön silüet: ekranda en alttaki yarım */
  function frontArc(pts) {
    var iMin = 0, iMax = 0, i;
    for (i = 1; i < pts.length; i++) {
      if (pts[i][0] < pts[iMin][0]) iMin = i;
      if (pts[i][0] > pts[iMax][0]) iMax = i;
    }
    var out = [], j = iMin;
    for (i = 0; i < pts.length; i++) {
      out.push(pts[j]);
      if (j === iMax) break;
      j = (j + 1) % pts.length;
    }
    /* alt yarımı seç: ortalama sy büyük olan */
    var alt = [], k = iMax;
    for (i = 0; i < pts.length; i++) {
      alt.push(pts[k]);
      if (k === iMin) break;
      k = (k + 1) % pts.length;
    }
    var avg = function (a) { var s2 = 0; a.forEach(function (p) { s2 += p[1]; }); return s2 / a.length; };
    return avg(out) > avg(alt) ? out : alt.slice().reverse();
  }

  function emitCyl(s, F) {
    var m = M(s.m), o = s.o || {};
    var N = 22;
    var bot = ring(s.x, s.y, s.z, s.r, N);
    var top = ring(s.x, s.y, s.z + s.h, s.r, N);
    var fb = frontArc(bot), ft = frontArc(top);
    var body = ft.concat(fb.slice().reverse());
    F.push({ p:body, f:m.left, s:m.line });

    /* dikey gölge + taş sıraları */
    var lines = [], i;
    var rows = Math.max(2, Math.min(8, Math.round(s.h / 3.4)));
    for (i = 1; i < rows; i++) {
      var t = i / rows, arc = [];
      for (var k = 0; k < ft.length; k++) {
        arc.push([ft[k][0], ft[k][1] + (fb[k] ? (fb[k][1] - ft[k][1]) * t : 0)]);
      }
      lines.push(d(arc, false));
    }
    var nv = 5;
    for (i = 1; i <= nv; i++) {
      var idx = Math.floor(ft.length * i / (nv + 1));
      if (ft[idx] && fb[idx]) lines.push(seg(ft[idx], fb[idx]));
    }
    if (lines.length) F.push({ p:null, dd:lines.join(''), f:null, s:m.det, lw:0.8 });

    F.push({ p:top, f:m.top, s:m.line });

    if (o.slit) {
      for (i = 0; i < o.slit; i++) {
        var ii = Math.floor(ft.length * (i + 1) / (o.slit + 1));
        if (!ft[ii] || !fb[ii]) continue;
        var a = ft[ii], b = fb[ii];
        var y0 = a[1] + (b[1] - a[1]) * 0.32, y1 = a[1] + (b[1] - a[1]) * 0.58;
        var wq = Math.max(0.8, s.r * 0.12);
        F.push({ p:[[a[0]-wq, y0], [a[0]+wq, y0], [a[0]+wq, y1], [a[0]-wq, y1]], f:m.line, s:null });
      }
    }
  }

  function emitCone(s, F) {
    var m = M(s.m), o = s.o || {};
    var N = 22;
    var base = ring(s.x, s.y, s.z, s.r, N);
    var apex = pr(s.x, s.y, s.z + s.h);
    var fb = frontArc(base);
    F.push({ p:fb.concat([apex]), f:m.left, s:m.line });

    var lines = [], i;
    if (m.shingle) {
      var rows = 4;
      for (i = 1; i < rows; i++) {
        var t = i / rows, arc = [];
        for (var k = 0; k < fb.length; k++) {
          arc.push([fb[k][0] + (apex[0] - fb[k][0]) * t, fb[k][1] + (apex[1] - fb[k][1]) * t]);
        }
        lines.push(d(arc, false));
      }
    }
    var nv = 6;
    for (i = 1; i <= nv; i++) {
      var idx = Math.floor(fb.length * i / (nv + 1));
      if (fb[idx]) lines.push(seg(fb[idx], apex));
    }
    if (lines.length) F.push({ p:null, dd:lines.join(''), f:null, s:m.det, lw:0.8 });

    if (o.pole) {
      var pt = pr(s.x, s.y, s.z + s.h + s.r * 0.55);
      F.push({ p:null, dd:seg(apex, pt), f:null, s:m.line, lw:1.3 });
    }
    if (o.flap) {
      var c = pr(s.x, s.y - s.r * 0.98, s.z);
      var a2 = pr(s.x - s.r * 0.30, s.y - s.r * 0.92, s.z);
      var b2 = pr(s.x + s.r * 0.30, s.y - s.r * 0.92, s.z);
      var tp = pr(s.x, s.y - s.r * 0.55, s.z + s.h * 0.42);
      F.push({ p:[a2, b2, tp], f:m.right, s:m.line, lw:1.0 });
    }
  }

  function emitDome(s, F, onionShape) {
    var m = M(s.m);
    var N = 22, LAT = 5;
    var prev = null, i, lat;
    for (lat = 0; lat <= LAT; lat++) {
      var t = lat / LAT;
      var rr, zz;
      if (onionShape) {
        rr = s.r * Math.sin(Math.PI * (0.10 + t * 0.90)) * (1 + 0.30 * Math.sin(Math.PI * t) - t * 0.28);
        zz = s.z + s.h * Math.pow(t, 0.78);
      } else {
        rr = s.r * Math.cos(t * Math.PI / 2);
        zz = s.z + s.h * Math.sin(t * Math.PI / 2);
      }
      var rg = frontArc(ring(s.x, s.y, zz, Math.max(0.05, rr), N));
      if (prev) {
        var band = rg.concat(prev.slice().reverse());
        F.push({ p:band, f: lat < LAT * 0.55 ? m.left : m.top, s:null });
      }
      prev = rg;
    }
    var outline = frontArc(ring(s.x, s.y, s.z, s.r, N));
    var apex = pr(s.x, s.y, s.z + s.h);
    F.push({ p:outline.concat([apex]), f:null, s:m.line, lw:1.2 });
    var lines = [];
    for (i = 1; i <= 5; i++) {
      var idx = Math.floor(outline.length * i / 6);
      if (outline[idx]) lines.push(seg(outline[idx], apex));
    }
    F.push({ p:null, dd:lines.join(''), f:null, s:m.det, lw:0.7 });
  }

  function emitPad(s, F) {
    var m = M(s.m);
    var rg = ring(s.x, s.y, 0, s.r, 26);
    F.push({ p:rg, f:m.top, s:m.line, lw:1.0 });
    var lines = [];
    for (var i = 0; i < 7; i++) {
      var a = Math.random() * Math.PI * 2, d2 = s.r * (0.30 + (i % 4) * 0.16);
      var p1 = pr(s.x + Math.cos(a) * d2, s.y + Math.sin(a) * d2, 0);
      var p2 = pr(s.x + Math.cos(a + 0.5) * d2 * 1.1, s.y + Math.sin(a + 0.5) * d2 * 1.1, 0);
      lines.push(seg(p1, p2));
    }
    F.push({ p:null, dd:lines.join(''), f:null, s:m.det, lw:0.7 });
  }

  function emitRock(s, F) {
    var m = M(s.m), r = s.r, h = s.h;
    var N = 9, top = [], bot = [], i;
    for (i = 0; i < N; i++) {
      var t = i / N * Math.PI * 2;
      var jr = r * (0.62 + ((i * 41) % 13) / 30);
      var jt = r * (0.30 + ((i * 29) % 11) / 26);
      bot.push(pr(s.x + Math.cos(t) * jr, s.y + Math.sin(t) * jr, s.z));
      top.push(pr(s.x + Math.cos(t) * jt * 0.8, s.y + Math.sin(t) * jt * 0.8, s.z + h * (0.72 + ((i * 17) % 9) / 24)));
    }
    var fb = frontArc(bot), ftp = frontArc(top);
    F.push({ p:ftp.concat(fb.slice().reverse()), f:m.left, s:m.line });
    F.push({ p:top, f:m.top, s:m.line });
    var lines = [];
    for (i = 1; i < Math.min(fb.length, ftp.length); i += 2) lines.push(seg(ftp[i], fb[i]));
    F.push({ p:null, dd:lines.join(''), f:null, s:m.det, lw:0.8 });
  }

  function emitPole(s, F) {
    var m = M(s.m);
    var a = pr(s.x, s.y, s.z), b = pr(s.x, s.y, s.z + s.h);
    F.push({ p:null, dd:seg(a, b), f:null, s:m.line, lw:1.6 });
  }

  function emitFlag(s, F) {
    var m = M(s.m);
    var a = pr(s.x, s.y, s.z);
    var w = s.h * 1.5;
    var b = [a[0] + w, a[1] - s.h * 0.22];
    var c = [a[0] + w * 0.72, a[1] + s.h * 0.30];
    var e = [a[0], a[1] + s.h * 0.62];
    F.push({ p:[a, b, c, e], f:m.left || m.top, s:m.line, lw:1.0 });
  }

  function emitTree(s, F) {
    var m = M(s.m), o = s.o || {}, h = s.h;
    var trunkT = pr(s.x, s.y, s.z + h * 0.42), trunkB = pr(s.x, s.y, s.z);
    F.push({ p:null, dd:seg(trunkB, trunkT), f:null, s:MAT.woodD.line, lw:Math.max(1.2, h * 0.10) });
    if (o.kind === 'pine') {
      var lv = 3, i;
      for (i = 0; i < lv; i++) {
        var t = i / lv;
        var rr = h * 0.34 * (1 - t * 0.55);
        var zz = s.z + h * (0.34 + t * 0.30);
        var base = frontArc(ring(s.x, s.y, zz, rr, 14));
        var apex = pr(s.x, s.y, zz + h * 0.36);
        F.push({ p:base.concat([apex]), f:i === lv - 1 ? m.top : m.left, s:m.line, lw:0.9 });
      }
    } else {
      var r = h * 0.34;
      var rg = frontArc(ring(s.x, s.y, s.z + h * 0.62, r, 16));
      var apex2 = pr(s.x, s.y, s.z + h * 1.02);
      F.push({ p:rg.concat([apex2]), f:m.left, s:m.line, lw:1.0 });
      var rg2 = frontArc(ring(s.x, s.y, s.z + h * 0.78, r * 0.62, 14));
      F.push({ p:rg2.concat([apex2]), f:m.top, s:null });
    }
  }

  function emitPagoda(s, F) {
    var m = M(s.m);
    var P = function (a, b, c) { return pr(s.x + a, s.y + b, s.z + c); };
    var w = s.w, dp = s.d, h = s.h;
    var cx = w / 2, cy = dp / 2;
    var apex = P(cx, cy, h);
    /* kavisli saçak köşeleri yukarı kalkık */
    var lift = h * 0.32;
    var c1 = P(0, 0, lift), c2 = P(w, 0, lift), c3 = P(w, dp, lift), c4 = P(0, dp, lift);
    var m12 = P(cx, 0, 0), m23 = P(w, cy, 0), m34 = P(cx, dp, 0), m41 = P(0, cy, 0);
    F.push({ p:[c1, m12, c2, apex], f:m.top,   s:m.line, lw:1.0 });
    F.push({ p:[c4, m34, c3, apex], f:m.left,  s:m.line, lw:1.0 });
    F.push({ p:[c2, m23, c3, apex], f:m.right, s:m.line, lw:1.0 });
    var lines = [seg(c1, apex), seg(c2, apex), seg(c3, apex), seg(c4, apex)];
    F.push({ p:null, dd:lines.join(''), f:null, s:m.det, lw:0.8 });
  }

  /* ============================================================
     BUILD
     ============================================================ */
  var EMIT = {
    box:emitBox, stake:emitStake, gable:emitGable, hip:emitHip,
    cyl:emitCyl, cone:emitCone, pad:emitPad, rock:emitRock,
    pole:emitPole, flag:emitFlag, tree:emitTree, pagoda:emitPagoda,
    dome:function (s, F) { emitDome(s, F, false); },
    onion:function (s, F) { emitDome(s, F, true); }
  };

  /* Merkez, tipe göre farklı: kutu ailesi köşe-tabanlı,
     dairesel aile merkez-tabanlı.                            */
  var CORNER_BASED = { box:1, stake:1, gable:1, hip:1, pagoda:1 };

  function centerOf(s) {
    if (CORNER_BASED[s.t]) {
      return [ s.x + (s.w || 0) / 2, s.y + (s.d || 0) / 2 ];
    }
    return [ s.x, s.y ];
  }

  /* Zemin yastığı her zaman en altta; sıralamaya girmez. */
  function isGround(s) { return s.t === 'pad'; }

  Scene.prototype.build = function (partFn) {
    var ground = [], rest = [], i;
    for (i = 0; i < this.solids.length; i++) {
      (isGround(this.solids[i]) ? ground : rest).push(this.solids[i]);
    }

    rest.sort(function (a, b) {
      var ca = centerOf(a), cb = centerOf(b);
      var ka = ca[0] + ca[1] + a.z * 0.92;
      var kb = cb[0] + cb[1] + b.z * 0.92;
      if (ka !== kb) return ka - kb;
      return (a.z + (a.h || 0)) - (b.z + (b.h || 0));
    });

    /* --- zemin yastığını yapının ayak izine oturt --- */
    if (ground.length && rest.length) {
      var nx = Infinity, xx = -Infinity, ny = Infinity, xy = -Infinity;
      for (i = 0; i < rest.length; i++) {
        var s2 = rest[i];
        var ax, bx, ay, by;
        if (CORNER_BASED[s2.t]) {
          ax = s2.x; bx = s2.x + (s2.w || 0);
          ay = s2.y; by = s2.y + (s2.d || 0);
        } else {
          var rr = s2.r || (s2.h || 4) * 0.22;
          ax = s2.x - rr; bx = s2.x + rr;
          ay = s2.y - rr; by = s2.y + rr;
        }
        if (ax < nx) nx = ax;
        if (bx > xx) xx = bx;
        if (ay < ny) ny = ay;
        if (by > xy) xy = by;
      }
      if (isFinite(nx)) {
        var pcx = (nx + xx) / 2, pcy = (ny + xy) / 2;
        var prr = Math.max(xx - nx, xy - ny) / 2 * 1.14 + 2;
        for (i = 0; i < ground.length; i++) {
          ground[i].x = pcx; ground[i].y = pcy; ground[i].r = prr;
        }
      }
    }

    var solids = ground.concat(rest);

    var F = [];
    for (i = 0; i < solids.length; i++) {
      var fn = EMIT[solids[i].t];
      if (fn) fn(solids[i], F);
    }

    /* normalize 0..100 */
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    F.forEach(function (fc) {
      if (!fc.p) return;
      fc.p.forEach(function (pt) {
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1];
        if (pt[1] > maxY) maxY = pt[1];
      });
    });
    if (!isFinite(minX)) return [];

    var bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
    var PAD = 5;
    var k = Math.min((100 - PAD * 2) / bw, (100 - PAD * 2) / bh);
    var offX = 50 - (minX + bw / 2) * k;
    var offY = (100 - PAD) - maxY * k;

    function mapPt(p) { return [p[0] * k + offX, p[1] * k + offY]; }
    function mapD(str) {
      return str.replace(/(-?\d+\.?\d*)\s(-?\d+\.?\d*)/g, function (_, a, b) {
        return (parseFloat(a) * k + offX).toFixed(2) + ' ' + (parseFloat(b) * k + offY).toFixed(2);
      });
    }

    var baseLw = Math.max(0.75, Math.min(2.2, 1.9 * k));
    var out = [];
    F.forEach(function (fc) {
      if (fc.p) {
        out.push(partFn(d(fc.p.map(mapPt)), fc.f, fc.s, fc.s ? (fc.lw ? fc.lw * k * 1.4 : baseLw) : 0));
      } else if (fc.dd) {
        out.push(partFn(mapD(fc.dd), null, fc.s, Math.max(0.45, (fc.lw || 0.8) * k * 1.5)));
      }
    });
    return out;
  };

  global.Iso = { Scene:Scene, MAT:MAT, pr:pr };
})(window);
