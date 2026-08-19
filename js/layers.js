/* ============================================================
   Medieval Map Editor — layers.js  v4
   • 28 terrain tipi, Don't Starve tarzı toprak tonları
   • Prosedürel scatter (tile/pattern yok)
   • Terrain-aware kıyı rengi (shore rengi terrain'e göre)
   • Yumuşak kenar geçişi için feather mask
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------
     TERRAIN TANIMLAMALARI
     base   : zemin ana renk
     dark   : koyu kenar / gölge tonu
     mark   : işaret rengi
     mark2  : ikincil işaret
     kind   : işaret üreteci
     density: işaret yoğunluk çarpanı
     shore  : bu terrain kıyısında kullanılacak kıyı rengi [dış, iç]
     --------------------------------------------------------- */
  var TERRAIN = {
    /* --- YEŞIL BANTLAR --- */
    grassland: {
      tr:'Otlak', en:'Grassland',
      base:'#b8c47a', dark:'#8a9a50', mark:'#6b7d38', mark2:'#8a9d4e', kind:'tuft',    density:1.10,
      shore:['#9aaa52','#c8d48e']
    },
    meadow: {
      tr:'Kır çiçeği', en:'Meadow',
      base:'#c8d080', dark:'#a0aa5a', mark:'#7a8d40', mark2:'#94a852', kind:'flower',  density:0.90,
      shore:['#a8b860','#d4dc9a']
    },
    shrubland: {
      tr:'Çalılık', en:'Shrubland',
      base:'#9aaa5e', dark:'#6a7a38', mark:'#506030', mark2:'#6a7a44', kind:'shrub',   density:1.00,
      shore:['#788848','#aab86a']
    },
    forest: {
      tr:'Orman', en:'Forest',
      base:'#5a7040', dark:'#2e4020', mark:'#1e3014', mark2:'#3a5228', kind:'canopy',  density:1.20,
      shore:['#3a5228','#5a7040']
    },
    darkforest: {
      tr:'Karanlık orman', en:'Dark forest',
      base:'#3a4e2e', dark:'#1a2614', mark:'#0e1c0c', mark2:'#283a1e', kind:'canopy',  density:1.30,
      shore:['#1a2614','#2e4020']
    },
    taiga: {
      tr:'Tayga', en:'Taiga',
      base:'#5e7252', dark:'#3a4e30', mark:'#222e18', mark2:'#3a4e2c', kind:'conifer', density:1.10,
      shore:['#3a4c28','#5a6e44']
    },
    /* --- KURU / SICAK BANTLAR --- */
    steppe: {
      tr:'Bozkır', en:'Steppe',
      base:'#c8b870', dark:'#a09040', mark:'#7a6e30', mark2:'#9a8840', kind:'tuft',    density:0.95,
      shore:['#b0a050','#d4c882']
    },
    savanna: {
      tr:'Savan', en:'Savanna',
      base:'#d4b85c', dark:'#aa8e38', mark:'#826a24', mark2:'#a08c3c', kind:'sparse',  density:0.75,
      shore:['#b89840','#d8c06e']
    },
    desert: {
      tr:'Çöl', en:'Desert',
      base:'#e4cе7a', dark:'#c0a050', mark:'#a07e38', mark2:'#b89248', kind:'dune',   density:0.55,
      shore:['#c8a84a','#e0c070']
    },
    badlands: {
      tr:'Badlands', en:'Badlands',
      base:'#b87a4e', dark:'#8a5430', mark:'#6a3e22', mark2:'#8a5c38', kind:'crack',  density:0.90,
      shore:['#8a5028','#b87848']
    },
    /* --- TAŞLIK / DAĞ --- */
    highland: {
      tr:'Yayla', en:'Highland',
      base:'#9a9074', dark:'#6e6650', mark:'#4e4a38', mark2:'#6a6248', kind:'chevron',density:0.85,
      shore:['#7a7258','#a89e7e']
    },
    mountain: {
      tr:'Dağlık', en:'Mountain',
      base:'#8c8070', dark:'#5e5448', mark:'#3e3a2e', mark2:'#5c5244', kind:'chevron',density:0.80,
      shore:['#6a6050','#8e8270']
    },
    volcanic: {
      tr:'Volkanik', en:'Volcanic',
      base:'#5a4a44', dark:'#2e2422', mark:'#1e1614', mark2:'#3a2a28', kind:'crack',  density:1.00,
      shore:['#2e2220','#4a3a38']
    },
    /* --- BATAKLK / ISLAK --- */
    swamp: {
      tr:'Bataklık', en:'Swamp',
      base:'#6a7852', dark:'#3e4e30', mark:'#2a3820', mark2:'#4a5e38', kind:'reed',   density:1.15,
      shore:['#3a4a28','#5e6e44']
    },
    marsh: {
      tr:'Sulak ova', en:'Marsh',
      base:'#7e8e60', dark:'#526040', mark:'#384a28', mark2:'#526040', kind:'reed',   density:1.05,
      shore:['#4a5a32','#6e7e50']
    },
    /* --- SOĞUK --- */
    tundra: {
      tr:'Tundra', en:'Tundra',
      base:'#9eaa8e', dark:'#6e7a60', mark:'#4e5e44', mark2:'#6e7a5c', kind:'tundra', density:0.80,
      shore:['#7a8a68','#a0ae8c']
    },
    snow: {
      tr:'Kar', en:'Snow',
      base:'#dce8ee', dark:'#a8bec8', mark:'#88a4b0', mark2:'#a0bac6', kind:'flake',  density:0.70,
      shore:['#a0c0d0','#cce0ea']
    },
    glacier: {
      tr:'Buzul', en:'Glacier',
      base:'#c4daea', dark:'#8aaec2', mark:'#6a94ae', mark2:'#88aac0', kind:'flake',  density:0.65,
      shore:['#8ab0c8','#b4d0e2']
    },
    /* --- TARIM / MEDENIYET --- */
    farmland: {
      tr:'Tarla', en:'Farmland',
      base:'#ccc48e', dark:'#9a9060', mark:'#6a5830', mark2:'#8a7840', kind:'field',  density:1.20,
      shore:['#b0a450','#d4c87a']
    },
    /* --- ORMAN KIYISI / MANGROV --- */
    coast: {
      tr:'Kıyı ormanı', en:'Coastal',
      base:'#7a9e68', dark:'#4a6a40', mark:'#2e4e26', mark2:'#4a6a3c', kind:'mangrove',density:1.05,
      shore:['#4a6840','#7a9a60']
    },
    /* --- ŞEHİR İÇİ / SOKAK --- */
    cobblestone: {
      tr:'Arnavut kaldırımı', en:'Cobblestone',
      base:'#9a9488', dark:'#6e685e', mark:'#524c44', mark2:'#7a746a', kind:'cobble', density:1.35,
      shore:['#726c62','#a29c90']
    },
    brokenroad: {
      tr:'Kırık taş yol', en:'Broken stone road',
      base:'#a89a80', dark:'#7a6e56', mark:'#564c38', mark2:'#8a7c60', kind:'crack', density:0.85,
      shore:['#7c7058','#ac9e82']
    },
    mudroad: {
      tr:'Çamur yol', en:'Mud road',
      base:'#6e5636', dark:'#48381e', mark:'#3a2c16', mark2:'#5a4626', kind:'mud', density:0.75,
      shore:['#4a3a20','#70583a']
    },
    gutter: {
      tr:'Pis su akıntısı', en:'Sewage gutter',
      base:'#54503a', dark:'#302e20', mark:'#1e2016', mark2:'#42402e', kind:'gutter', density:0.90,
      shore:['#302e20','#565236']
    },
    flowerbed: {
      tr:'Süs çiçeği tarhı', en:'Flower bed',
      base:'#7a9c5c', dark:'#547038', mark:'#c85a78', mark2:'#d8b840', kind:'flower', density:1.25,
      shore:['#567238','#7e9e60']
    },
    hedgerow: {
      tr:'Çalı bordürü', en:'Hedgerow',
      base:'#5c7a48', dark:'#384e28', mark:'#26381a', mark2:'#44602e', kind:'shrub', density:1.40,
      shore:['#3a5028','#5e7c4a']
    },
    courtyard: {
      tr:'Toprak avlu', en:'Packed courtyard',
      base:'#b8a888', dark:'#8e7c5c', mark:'#6e5e40', mark2:'#a2926e', kind:'sparse', density:0.45,
      shore:['#90805e','#bcac8c']
    },
    plaza: {
      tr:'Mermer meydan', en:'Marble plaza',
      base:'#d8d2c4', dark:'#aca690', mark:'#928c78', mark2:'#c0bcac', kind:'crack', density:0.55,
      shore:['#aea892','#dcd6c8']
    },
    /* --- İÇ MEKÂN (bölge bağlantısıyla girilen oda/avlu haritaları için) ---
       Aynı Kara+Arazi fırçalarıyla çalışır: oda şeklini "Kara" fırçasıyla
       boyayıp üstüne bu dokulardan biriyle zemin/duvar işlemek yeterli —
       yeni bir mekanik gerekmiyor. Kıyı parlaması (shore) iç mekanda
       istenmeyebilir; sol paneldeki "Kıyı" onay kutusundan kapatılabilir. */
    woodfloor: {
      tr:'Ahşap zemin', en:'Wood floor',
      base:'#b08a54', dark:'#8a683c', mark:'#6e4e28', mark2:'#96703e', kind:'plank', density:1.1,
      shore:['#8a683c','#b6905c']
    },
    stonefloor: {
      tr:'Taş zemin', en:'Stone floor',
      base:'#a8a292', dark:'#7c7666', mark:'#5c5648', mark2:'#8e8878', kind:'tile', density:1.0,
      shore:['#7e7868','#aca696']
    },
    strawfloor: {
      tr:'Saman zemin', en:'Straw floor',
      base:'#c8b468', dark:'#a2903e', mark:'#8a7830', mark2:'#b4a052', kind:'straw', density:1.3,
      shore:['#a4923e','#cab86c']
    },
    carpetfloor: {
      tr:'Halı', en:'Carpet',
      base:'#8c2e30', dark:'#601c1e', mark:'#c49a3a', mark2:'#a02426', kind:'rug', density:0.9,
      shore:['#621e20','#902e30']
    },
    cavefloor: {
      tr:'Mağara zemini', en:'Cave floor',
      base:'#6a6258', dark:'#443e36', mark:'#2e2a24', mark2:'#544c42', kind:'crack', density:0.65,
      shore:['#463f36','#6c645a']
    },
    stonewall: {
      tr:'Taş duvar', en:'Stone wall',
      base:'#5a564c', dark:'#38352e', mark:'#26241e', mark2:'#4a4740', kind:'mortar', density:1.5,
      shore:['#3a372f','#5c584e']
    }
  };

  /* ---------- desert base rengi düzelt (typo) ---------- */
  TERRAIN.desert.base = '#e4ce7a';

  /* =========================================================
     IŞARET ÜRETICILERI  (birim uzay ~-8..8)
     ========================================================= */
  function mark(ctx, kind) {
    switch (kind) {

      case 'tuft':
        ctx.beginPath();
        ctx.moveTo(-3.2,3.2); ctx.quadraticCurveTo(-2.6,-0.8,-3.8,-4.2);
        ctx.moveTo( 0.2,3.6); ctx.quadraticCurveTo( 0.6,-1.6,-0.2,-5.4);
        ctx.moveTo( 3.4,3.0); ctx.quadraticCurveTo( 3.0,-1.0, 4.2,-4.0);
        ctx.stroke();
        break;

      case 'flower':
        /* merkez + küçük yaprak */
        ctx.beginPath();
        ctx.moveTo(-2.8,3.0); ctx.lineTo(-1.8,-1.4);
        ctx.moveTo( 0.4,3.4); ctx.lineTo( 0.4,-2.0);
        ctx.moveTo( 3.0,3.0); ctx.lineTo( 2.4,-1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-1.8,-2.8,1.6,0,Math.PI*2);
        ctx.fill();
        break;

      case 'shrub':
        ctx.beginPath();
        ctx.moveTo(0,4); ctx.lineTo(0,-1);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-2.5,-0.2,2.4,Math.PI*0.9,Math.PI*1.85);
        ctx.arc( 2.5,-0.2,2.4,Math.PI*1.15,Math.PI*2.1);
        ctx.stroke();
        break;

      case 'canopy':
        ctx.beginPath();
        ctx.arc(0,0.8,4.0,Math.PI*1.08,Math.PI*1.92);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-2.4,1.4,2.2,Math.PI*1.05,Math.PI*1.95);
        ctx.arc( 2.4,1.4,2.2,Math.PI*1.05,Math.PI*1.95);
        ctx.stroke();
        break;

      case 'conifer':
        ctx.beginPath();
        ctx.moveTo(0,-5.8); ctx.lineTo(-3.2,2.8); ctx.lineTo(3.2,2.8); ctx.closePath();
        ctx.fill();
        ctx.beginPath(); ctx.moveTo(0,2.8); ctx.lineTo(0,5.0); ctx.stroke();
        break;

      case 'sparse':
        /* savan: seyrek ot tutamı */
        ctx.beginPath();
        ctx.moveTo(-1.4,4.0); ctx.quadraticCurveTo(-1.0,0,-2.0,-3.0);
        ctx.moveTo( 1.6,4.0); ctx.quadraticCurveTo( 1.4,0, 2.4,-3.0);
        ctx.stroke();
        break;

      case 'dune':
        ctx.beginPath();
        ctx.moveTo(-6.8,1.8); ctx.quadraticCurveTo(-2.2,-2.8,0.8,0.8);
        ctx.quadraticCurveTo(3.8,4.0,6.8,0.2);
        ctx.stroke();
        break;

      case 'crack':
        ctx.beginPath();
        ctx.moveTo(-5.6,-2.2); ctx.lineTo(-1.6,0.8); ctx.lineTo(1.4,-1.6); ctx.lineTo(5.2,2.0);
        ctx.moveTo(-1.6,0.8); ctx.lineTo(-2.6,4.0);
        ctx.stroke();
        break;

      case 'chevron':
        ctx.beginPath();
        ctx.moveTo(-5.0,3.2); ctx.lineTo(0,-3.8); ctx.lineTo(5.0,3.2);
        ctx.moveTo(-2.6,3.6); ctx.lineTo(0, 0.0); ctx.lineTo(2.6,3.6);
        ctx.stroke();
        break;

      case 'reed':
        ctx.beginPath();
        ctx.moveTo(-2.8,4.4); ctx.lineTo(-2.8,-2.8);
        ctx.moveTo( 0.6,4.8); ctx.lineTo( 0.6,-4.2);
        ctx.moveTo( 3.4,4.2); ctx.lineTo( 3.4,-2.0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0.6,5.6,3.4,Math.PI*0.1,Math.PI*0.9);
        ctx.stroke();
        break;

      case 'flake':
        ctx.beginPath();
        ctx.moveTo(-3.2,0); ctx.lineTo(3.2,0);
        ctx.moveTo(0,-3.2); ctx.lineTo(0,3.2);
        ctx.moveTo(-2.3,-2.3); ctx.lineTo(2.3,2.3);
        ctx.moveTo(2.3,-2.3); ctx.lineTo(-2.3,2.3);
        ctx.stroke();
        break;

      case 'tundra':
        ctx.beginPath();
        ctx.moveTo(-2.6,2.8); ctx.lineTo(-1.8,-1.8);
        ctx.moveTo( 0.8,3.2); ctx.lineTo( 1.4,-1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(3.4,2.8,2.0,1.2,0.3,0,Math.PI*2);
        ctx.fill();
        break;

      case 'field':
        /* bitişik tarla parselleri — gerçekçi tarla deseni */
        (function() {
          var cols = 2 + (Math.random() > 0.5 ? 1 : 0);
          var rows = 2 + (Math.random() > 0.5 ? 1 : 0);
          var pw = 10.0 / cols;
          var ph = 8.0 / rows;
          var ox = -5.0, oy = -4.0;
          var palette = ['#c8b86a','#8aaa62','#b09858','#d4c882','#7a9858','#c4a070','#a8b870','#b8886a','#9ab468','#c8aa58'];
          var baseAlpha = ctx.globalAlpha;
          for (var r2=0; r2<rows; r2++) {
            for (var c2=0; c2<cols; c2++) {
              var px = ox + c2*pw + (Math.random()-0.5)*pw*0.15;
              var py = oy + r2*ph + (Math.random()-0.5)*ph*0.15;
              var pw2 = pw * (0.84 + Math.random()*0.18);
              var ph2 = ph * (0.84 + Math.random()*0.18);
              ctx.globalAlpha = baseAlpha * (0.70 + Math.random()*0.35);
              ctx.fillStyle = palette[Math.floor(Math.random()*palette.length)];
              ctx.beginPath(); ctx.rect(px, py, pw2, ph2); ctx.fill();
              ctx.globalAlpha = baseAlpha * 0.55;
              ctx.strokeStyle = '#5a4820';
              ctx.lineWidth = 0.22;
              ctx.stroke();
            }
          }
          ctx.globalAlpha = baseAlpha;
        })();
        break;

      case 'mangrove':
        /* bükülmüş kök: iki yay + gövde */
        ctx.beginPath();
        ctx.moveTo(0,5); ctx.lineTo(0,-1);
        ctx.moveTo(-2.8,5); ctx.quadraticCurveTo(-2.8,1,0,0);
        ctx.moveTo( 2.8,5); ctx.quadraticCurveTo( 2.8,1,0,0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0,-2.4,2.6,Math.PI*1.0,Math.PI*2.0);
        ctx.stroke();
        break;

      case 'cobble':
        /* arnavut kaldırımı: birbirine yaslanmış yuvarlatılmış taşlar */
        ctx.beginPath();
        ctx.ellipse(-2.6,-1.6,1.9,1.4,0.3,0,Math.PI*2);
        ctx.ellipse( 1.9,-2.0,1.7,1.3,-0.2,0,Math.PI*2);
        ctx.ellipse(-1.1, 2.0,1.8,1.3,0.15,0,Math.PI*2);
        ctx.ellipse( 2.7, 1.7,1.6,1.2,0.4,0,Math.PI*2);
        ctx.stroke();
        break;

      case 'mud':
        /* çamur birikintisi + sıçrama izleri */
        ctx.beginPath();
        ctx.ellipse(0,1.4,4.2,2.0,0,0,Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-4.6,-3.2); ctx.lineTo(-3.6,-1.2);
        ctx.moveTo( 4.2,-3.0); ctx.lineTo( 3.3,-0.9);
        ctx.stroke();
        break;

      case 'gutter':
        /* pis su akıntısı: dalgalı koyu iz + birikinti damlaları */
        ctx.beginPath();
        ctx.moveTo(-5.2,-1.2); ctx.quadraticCurveTo(-2.0,2.2,0,-0.6); ctx.quadraticCurveTo(2.2,-3.2,5.2,0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-3.2,3.0,0.8,0,Math.PI*2);
        ctx.arc( 3.0,3.4,0.6,0,Math.PI*2);
        ctx.fill();
        break;

      case 'plank':
        /* ahşap zemin: paralel taht sıraları + kaymalı ek yerleri */
        ctx.beginPath();
        ctx.moveTo(-6,-3); ctx.lineTo(6,-3);
        ctx.moveTo(-6, 1); ctx.lineTo(6, 1);
        ctx.moveTo(-6, 5); ctx.lineTo(6, 5);
        ctx.moveTo(-2,-3); ctx.lineTo(-2,1);
        ctx.moveTo( 3, 1); ctx.lineTo( 3,5);
        ctx.stroke();
        break;

      case 'tile':
        /* taş zemin: kare karo ızgarası */
        ctx.beginPath();
        ctx.rect(-6,-6,12,12);
        ctx.moveTo(-6,0); ctx.lineTo(6,0);
        ctx.moveTo(0,-6); ctx.lineTo(0,6);
        ctx.stroke();
        break;

      case 'straw':
        /* saman: kısa, dağınık saplar */
        ctx.beginPath();
        ctx.moveTo(-3,3); ctx.lineTo(-4,-2);
        ctx.moveTo( 0,4); ctx.lineTo( 1,-3);
        ctx.moveTo( 3,3); ctx.lineTo( 4,-2);
        ctx.moveTo(-1,4); ctx.lineTo(-3, 0);
        ctx.stroke();
        break;

      case 'rug':
        /* halı: baklava desenli süsleme + merkez düğüm */
        ctx.beginPath();
        ctx.moveTo(0,-5); ctx.lineTo(5,0); ctx.lineTo(0,5); ctx.lineTo(-5,0); ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0,0,1.6,0,Math.PI*2);
        ctx.fill();
        break;

      case 'mortar':
        /* taş duvar: harç sıraları + düşey derz atkıları */
        ctx.beginPath();
        ctx.moveTo(-6,-3); ctx.lineTo(6,-3);
        ctx.moveTo(-6, 3); ctx.lineTo(6, 3);
        ctx.moveTo(-2,-3); ctx.lineTo(-2,3);
        ctx.moveTo( 3,-3); ctx.lineTo( 3,3);
        ctx.moveTo(-4, 3); ctx.lineTo(-4,9);
        ctx.moveTo( 1, 3); ctx.lineTo( 1,9);
        ctx.stroke();
        break;
    }
  }

  /* =========================================================
     SCATTER — prosedürel serpme
     ========================================================= */
  function hexA(hex, a) {
    var h = hex.replace('#','');
    if (h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h,16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
  }

  function scatter(ctx, key, cx, cy, radius, opacity) {
    var t = TERRAIN[key]; if (!t) return;
    var R = radius;

    ctx.save();

    /* clip: tüm çizimler daire içinde kalır — kenar taşmaz */
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.clip();

    /* zemin: merkez tam dolu, kenar %35'ten itibaren şeffaflaşır.
       destination-out YOK — alttaki terrain kenar bölgesinde görünür kalır.
       Bu sayede terrain geçişleri organik görünür: altta ne varsa kenarda
       kısmen geçirgen, merkeze doğru yeni terrain tam hakim olur.         */
    var gBlend = ctx.createRadialGradient(cx, cy, R*0.0, cx, cy, R);
    gBlend.addColorStop(0.0, hexA(t.base, opacity));
    gBlend.addColorStop(0.55, hexA(t.base, opacity * 0.90));
    gBlend.addColorStop(1.0, hexA(t.base, 0));
    ctx.fillStyle = gBlend;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();

    /* işaretler — clip sayesinde dışarı çıkamaz */
    /* mark yoğunluğu: birim alana göre sabit — büyük fırçada daha çok mark ama aynı yoğunluk */
    var area = Math.PI * R * R;
    var n = Math.round(area / 1800 * (t.density||1));
    n = Math.max(3, Math.min(80, n));
    var unit = 14; /* mark boyutu sabit — fırça büyüse de desen ölçeği değişmez */
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    for (var i = 0; i < n; i++) {
      var a  = Math.random() * Math.PI * 2;
      var rr = Math.sqrt(Math.random()) * R * 0.85;
      var mx = cx + Math.cos(a)*rr;
      var my = cy + Math.sin(a)*rr;
      var alpha = opacity * (0.30 + Math.random()*0.40) * (1 - rr/R * 0.5);
      if (alpha < 0.04) continue;
      var sc  = unit/6 * (0.62 + Math.random()*0.82);
      var rot = (Math.random()-0.5) * (t.kind==='field'?0.4 : t.kind==='dune'||t.kind==='chevron'?0.28 : 0.90);
      var col = Math.random() < 0.55 ? t.mark : t.mark2;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(mx, my);
      ctx.rotate(rot);
      ctx.scale(sc, sc);
      ctx.strokeStyle = col;
      ctx.fillStyle   = col;
      ctx.lineWidth = Math.max(0.5, 1.6/Math.max(0.3,sc));
      mark(ctx, t.kind);
      ctx.restore();
    }

    ctx.restore();
  }

  /* =========================================================
     SWATCH (sol panel önizleme)
     ========================================================= */
  var swatchCache = {};
  function swatch(key, w, h) {
    var ck = key+'|'+w+'x'+h;
    if (swatchCache[ck]) return swatchCache[ck];
    var c = document.createElement('canvas'); c.width=w; c.height=h;
    var x = c.getContext('2d');
    var t = TERRAIN[key];
    x.fillStyle = t.base; x.fillRect(0,0,w,h);
    x.lineCap='round'; x.lineJoin='round';
    var n = Math.round(w*h/220*(t.density||1));
    for (var i=0;i<n;i++) {
      var mx=Math.random()*w, my=Math.random()*h;
      var sc=0.40*(0.65+Math.random()*0.80);
      x.save();
      x.globalAlpha=0.42+Math.random()*0.44;
      x.translate(mx,my); x.rotate((Math.random()-0.5)*0.7); x.scale(sc,sc);
      x.strokeStyle=Math.random()<0.55?t.mark:t.mark2;
      x.fillStyle=x.strokeStyle;
      x.lineWidth=1.6/sc;
      mark(x, t.kind);
      x.restore();
    }
    swatchCache[ck]=c; return c;
  }

  /* =========================================================
     SHORE BLEND — terrain katmanını örnekleyerek kıyı rengi
     üret. Her piksel için baskın terrain'in shore rengini
     interpolate et. Basit: küçültülmüş terrain+kara canvas'ından
     ortalama renk al, shore bandını buna göre boya.
     ========================================================= */
  /* kıyı stili: blur miktarı (kenar sertliği) + renk doygunluk/parlaklık çarpanı */
  var SHORE_STYLES = {
    sandy: { blurMul:1.3, satMul:1.00, lightMul:1.00 },
    rocky: { blurMul:0.6, satMul:0.45, lightMul:0.82 },
    reef:  { blurMul:1.9, satMul:1.40, lightMul:1.10 }
  };

  function shoreStyleAdjust(r, g, b, cfg) {
    var gray = (r+g+b)/3;
    var nr = gray + (r-gray)*cfg.satMul, ng = gray + (g-gray)*cfg.satMul, nb = gray + (b-gray)*cfg.satMul;
    nr *= cfg.lightMul; ng *= cfg.lightMul; nb *= cfg.lightMul;
    return [
      nr<0?0:nr>255?255:nr,
      ng<0?0:ng>255?255:ng,
      nb<0?0:nb>255?255:nb
    ];
  }

  function buildShoreCanvas(landCanvas, terrainCanvas, shoreWidth, W, H, style) {
    var cfg = SHORE_STYLES[style] || SHORE_STYLES.sandy;
    var MAX = 1024;
    var sc  = Math.min(1, MAX/Math.max(W,H));
    var sw  = Math.max(1,Math.round(W*sc)), sh = Math.max(1,Math.round(H*sc));
    var bw  = Math.max(2, Math.round(shoreWidth*sc));

    /* --- kara silüetini bulanıklaştır → kıyı maskesi --- */
    var maskC = document.createElement('canvas'); maskC.width=sw; maskC.height=sh;
    var mctx  = maskC.getContext('2d',{willReadFrequently:true});
    mctx.filter='blur('+(bw*cfg.blurMul).toFixed(1)+'px)';
    mctx.drawImage(landCanvas,0,0,sw,sh);
    mctx.drawImage(landCanvas,0,0,sw,sh);
    mctx.filter='none';

    var maskData = mctx.getImageData(0,0,sw,sh).data;

    /* --- terrain thumbnail --- */
    var tC = document.createElement('canvas'); tC.width=sw; tC.height=sh;
    var tctx = tC.getContext('2d',{willReadFrequently:true});
    tctx.drawImage(terrainCanvas,0,0,sw,sh);
    var tData = tctx.getImageData(0,0,sw,sh).data;

    /* --- land thumbnail --- */
    var lC = document.createElement('canvas'); lC.width=sw; lC.height=sh;
    var lctx = lC.getContext('2d',{willReadFrequently:true});
    lctx.drawImage(landCanvas,0,0,sw,sh);
    var lData = lctx.getImageData(0,0,sw,sh).data;

    /* --- çıktı: her "kıyı" pikseli için renk belirle --- */
    var out  = mctx.createImageData(sw,sh);
    var od   = out.data;

    /* Sabit fallback kıyı paleti — terrain yokken SADECE dış su halkası */
    var SHORE_FALLBACK = { outer:[120,170,185] };

    for (var p=0; p<sw*sh; p++) {
      var i4=p*4;
      var maskA = maskData[i4+3]/255; // blurlu alfa = "shore yoğunluğu"
      if (maskA < 0.04) continue;
      var landA = lData[i4+3]/255;   // orijinal kara
      if (landA > 0.85) continue;    // tam kara içinde gösterme

      /* bu nokta kıyı şeridinde: terrain rengine bak */
      var tr = tData[i4], tg = tData[i4+1], tb = tData[i4+2], ta = tData[i4+3]/255;

      var outerR, outerG, outerB, innerR=-1, innerG=-1, innerB=-1;
      var hasInner = false;

      if (ta < 0.12) {
        /* terrain boş → sadece dış su halkası, iç kum yok */
        outerR=SHORE_FALLBACK.outer[0]; outerG=SHORE_FALLBACK.outer[1]; outerB=SHORE_FALLBACK.outer[2];
        hasInner = false;
      } else {
        /* terrain renginden en yakın terrain tipini bul */
        var bestKey=null, bestDist=1e9;
        var keys=Object.keys(TERRAIN);
        for (var k=0;k<keys.length;k++) {
          var t=TERRAIN[keys[k]];
          var hb=parseInt(t.base.replace('#',''),16);
          var dr=((hb>>16)&255)-tr, dg=((hb>>8)&255)-tg, db=(hb&255)-tb;
          var dist=dr*dr+dg*dg+db*db;
          if (dist<bestDist){ bestDist=dist; bestKey=keys[k]; }
        }
        var sh2=TERRAIN[bestKey].shore;
        var co=parseInt(sh2[0].replace('#',''),16);
        var ci=parseInt(sh2[1].replace('#',''),16);
        outerR=(co>>16)&255; outerG=(co>>8)&255; outerB=co&255;
        innerR=(ci>>16)&255; innerG=(ci>>8)&255; innerB=ci&255;
        hasInner = true;
      }

      if (cfg !== SHORE_STYLES.sandy) {
        var adjO = shoreStyleAdjust(outerR, outerG, outerB, cfg);
        outerR=adjO[0]; outerG=adjO[1]; outerB=adjO[2];
        if (hasInner) {
          var adjI = shoreStyleAdjust(innerR, innerG, innerB, cfg);
          innerR=adjI[0]; innerG=adjI[1]; innerB=adjI[2];
        }
      }

      /* dış band (daha şeffaf, geniş) ve iç band (daha opak, dar) */
      var norm = maskA; // 0..1 (kıyıya ne kadar yakın)
      var outerAlpha = norm * 0.55 * (1-landA);
      var innerAlpha = hasInner ? Math.max(0, (norm-0.35)/0.65) * 0.70 * (1-landA) : 0;

      /* composite: önce outer, üstüne inner */
      var finalR = outerR + (innerR-outerR)*innerAlpha;
      var finalG = outerG + (innerG-outerG)*innerAlpha;
      var finalB = outerB + (innerB-outerB)*innerAlpha;
      var finalA = Math.min(1, outerAlpha + innerAlpha*0.5);

      od[i4  ] = Math.round(finalR);
      od[i4+1] = Math.round(finalG);
      od[i4+2] = Math.round(finalB);
      od[i4+3] = Math.round(finalA*255);
    }

    mctx.putImageData(out,0,0);
    return { canvas:maskC, sw:sw, sh:sh };
  }

  global.Terrain = {
    TERRAIN: TERRAIN,
    scatter: scatter,
    swatch:  swatch,
    mark:    mark,
    buildShoreCanvas: buildShoreCanvas
  };

  /* =========================================================
     KATMANLAR
     ========================================================= */
  var DEFS = [
    { id:'reference', type:'image',  tr:'Referans görsel', en:'Reference image', opacity:0.5, visible:true  },
    { id:'landmass',  type:'raster', tr:'Kara',            en:'Landmass',        opacity:1,   visible:true  },
    { id:'terrain',   type:'raster', tr:'Arazi',           en:'Terrain',         opacity:1,   visible:true  },
    { id:'elevation', type:'raster', tr:'Yükselti',        en:'Elevation',       opacity:1,   visible:true  },
    { id:'territories', type:'vector', tr:'Bölgeler',      en:'Territories',     opacity:1,   visible:true  },
    { id:'rivers',    type:'vector', tr:'Nehirler',        en:'Rivers',          opacity:1,   visible:true  },
    { id:'roads',     type:'vector', tr:'Yollar',          en:'Roads',           opacity:1,   visible:true  },
    { id:'symbols',   type:'vector', tr:'Semboller',       en:'Symbols',         opacity:1,   visible:true  },
    { id:'resources', type:'vector', tr:'Kaynaklar',       en:'Resources',       opacity:1,   visible:true  },
    { id:'links',     type:'vector', tr:'Harita bağlantıları', en:'Map links',   opacity:1,   visible:true  },
    { id:'measures',  type:'vector', tr:'Ölçümler',        en:'Measurements',    opacity:1,   visible:true  },
    { id:'labels',    type:'vector', tr:'Etiketler',       en:'Labels',          opacity:1,   visible:true  },
    { id:'overlay',   type:'overlay',tr:'Kaplama',         en:'Overlay',         opacity:1,   visible:true  }
  ];

  var Layers = {
    list:[],
    active:'landmass',

    init: function(w,h){
      this.list = DEFS.map(function(d){
        var l={id:d.id,type:d.type,tr:d.tr,en:d.en,
               visible:d.visible,locked:false,opacity:d.opacity,blend:'source-over',
               canvas:null,ctx:null,objects:[],image:null,imageData:null};
        if(d.type==='raster'){
          l.canvas=document.createElement('canvas');
          l.canvas.width=w; l.canvas.height=h;
          l.ctx=l.canvas.getContext('2d');
        }
        return l;
      });
    },

    resize: function(w,h,keep){
      this.list.forEach(function(l){
        if(l.type!=='raster')return;
        var old=l.canvas;
        var c=document.createElement('canvas'); c.width=w; c.height=h;
        var x=c.getContext('2d');
        if(keep&&old.width)x.drawImage(old,0,0,old.width,old.height,0,0,w,h);
        l.canvas=c; l.ctx=x;
      });
    },

    get: function(id){
      for(var i=0;i<this.list.length;i++) if(this.list[i].id===id) return this.list[i];
      return null;
    },

    indexOf: function(id){
      for(var i=0;i<this.list.length;i++) if(this.list[i].id===id) return i;
      return -1;
    },

    move: function(from,to){
      if(from===to||from<0||to<0)return;
      var item=this.list.splice(from,1)[0];
      this.list.splice(to,0,item);
    },

    name: function(l,lang){ return global.i18nName ? global.i18nName(l.id, l.tr, l.en, lang) : (lang==='tr'?l.tr:l.en); },

    meta: function(){
      return this.list.map(function(l){
        return{id:l.id,visible:l.visible,locked:l.locked,opacity:l.opacity,blend:l.blend};
      });
    },

    applyMeta: function(m){
      var self=this, ordered=[];
      m.forEach(function(e){
        var l=self.get(e.id); if(!l)return;
        l.visible=e.visible; l.locked=e.locked; l.opacity=e.opacity; l.blend=e.blend||'source-over';
        ordered.push(l);
      });
      if(ordered.length===this.list.length) this.list=ordered;
    },

    serialize: function(includeRef){
      return this.list.map(function(l){
        var o={id:l.id,type:l.type,visible:l.visible,locked:l.locked,opacity:l.opacity,blend:l.blend};
        if(l.type==='raster') o.data=l.canvas.toDataURL('image/png');
        if(l.type==='vector') o.objects=l.objects;
        if(l.type==='image'&&l.imageData&&includeRef!==false) o.data=l.imageData;
        return o;
      });
    },

    deserialize: function(arr){
      var self=this, jobs=[], ordered=[];
      arr.forEach(function(e){
        var l=self.get(e.id); if(!l)return;
        l.visible=e.visible; l.locked=e.locked; l.opacity=e.opacity; l.blend=e.blend||'source-over';
        if(l.type==='vector') l.objects=e.objects||[];
        if(l.type==='raster'){
          l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);
          if(e.data) jobs.push(new Promise(function(res){
            var im=new Image();
            im.onload=function(){l.ctx.drawImage(im,0,0);res();};
            im.onerror=function(){res();};
            im.src=e.data;
          }));
        }
        if(l.type==='image'){
          if(e.data) jobs.push(new Promise(function(res){
            var im=new Image();
            im.onload=function(){l.image=im;l.imageData=e.data;res();};
            im.onerror=function(){res();};
            im.src=e.data;
          }));
          else{l.image=null;l.imageData=null;}
        }
        ordered.push(l);
      });
      if(ordered.length===this.list.length) this.list=ordered;
      return Promise.all(jobs);
    }
  };

  global.Layers = Layers;
})(window);
