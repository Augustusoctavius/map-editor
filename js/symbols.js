/* ============================================================
   Cartographer — symbols.js
   Kod içi SVG sembol kütüphanesi (dış dosya bağımlılığı yok).
   Her sembol 0..100 koordinat uzayında tanımlıdır, merkez (50,50).
   part = { d, f:<paletKey|hex|null>, s:<paletKey|hex|null>, lw, tr:[x,y,scale] }
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- palet ---------------- */
  var PAL = {
    ink:      '#4a3b28',
    ink2:     '#6b573c',
    fill:     '#efe2c4',
    shade:    '#c0a97c',
    shade2:   '#a08a5e',
    snow:     '#fdfaf2',
    stone:    '#cfc3ab',
    stoned:   '#9d8f76',
    green:    '#7d9b62',
    greend:   '#4e6b3f',
    water:    '#6f97ad',
    red:      '#9c4b3b',
    gold:     '#c9a227',
    wood:     '#8a6134'
  };

  /* ---------------- yeniden kullanılan yollar ---------------- */
  var P = {
    peak:      'M4 88 L34 20 L50 48 L62 32 L96 88 Z',
    peakShade: 'M34 20 L50 48 L62 32 L96 88 L40 88 Z',
    peakSnow:  'M34 20 L24 42 L31 37 L38 45 L44 38 L50 48 Z',
    peakLine:  'M34 20 L50 48 M62 32 L74 52',

    cone:      'M18 88 L50 18 L82 88 Z',
    coneShade: 'M50 18 L82 88 L50 88 Z',
    coneSnow:  'M50 18 L40 40 L46 36 L52 44 L58 37 L62 40 Z',

    hill:      'M8 86 C24 48 54 48 70 86 Z',
    hillLine:  'M28 78 C34 66 44 64 52 70',

    rock:      'M18 86 L30 52 L44 62 L56 44 L72 60 L84 86 Z',

    pine:      'M50 10 L64 42 L56 42 L68 64 L58 64 L70 84 L30 84 L42 64 L32 64 L44 42 L36 42 Z',
    pineTrunk: 'M46 84 H54 V94 H46 Z',
    leaf:      'M50 14 C70 14 80 30 72 46 C82 60 64 74 50 66 C36 74 18 60 28 46 C20 30 30 14 50 14 Z',
    leafTrunk: 'M46 64 H54 V94 H46 Z',
    leafVein:  'M50 92 V44 M50 60 L36 48 M50 60 L64 48',
    palmTrunk: 'M48 92 C46 66 50 50 58 38',
    palmFrond: 'M58 38 C44 26 30 30 24 40 C36 34 48 36 58 44 M58 38 C70 24 86 28 90 40 C78 32 66 36 58 44 M58 38 C56 22 44 14 32 16 C44 20 52 28 56 42',
    deadTree:  'M48 94 V44 M48 60 L28 40 M48 68 L68 46 M48 50 L36 26 M48 54 L64 30 M28 40 L20 44 M68 46 L76 40',

    houseBody: 'M34 88 V60 H66 V88 Z',
    houseRoof: 'M28 62 L50 42 L72 62 Z',
    houseDoor: 'M46 88 V72 H54 V88 Z',

    tower:     'M40 88 V38 H60 V88 Z',
    towerCren: 'M36 40 H44 V30 H36 Z M48 40 H56 V30 H48 Z M60 40 H66 V30 H60 Z M36 40 H66 V44 H36 Z',
    towerRoof: 'M34 38 L50 14 L66 38 Z',
    towerWin:  'M46 52 H54 V64 H46 Z',

    wall:      'M8 88 V58 H92 V88 Z',
    wallCren:  'M8 58 H18 V50 H8 Z M26 58 H36 V50 H26 Z M44 58 H54 V50 H44 Z M62 58 H72 V50 H62 Z M80 58 H92 V50 H80 Z',
    gate:      'M42 88 V70 A8 8 0 0 1 58 70 V88 Z',

    flagPole:  'M62 34 V4',
    flag:      'M62 6 L84 13 L62 20 Z',

    column:    'M42 86 V34 H52 V86 Z',
    columnCap: 'M36 34 H58 V26 H36 Z',
    archRuin:  'M22 88 V54 A28 28 0 0 1 78 54 V88 H64 V56 A14 14 0 0 0 36 56 V88 Z',

    anchor:    'M50 22 V78 M34 62 A18 18 0 0 0 66 62 M36 34 H64',
    wave:      'M8 74 q11 -9 22 0 t22 0 t22 0 t22 0 M8 86 q11 -9 22 0 t22 0 t22 0 t22 0',
    hull:      'M16 66 H84 L72 84 H28 Z',
    mast:      'M50 66 V20 M50 26 L76 34 L50 44 Z',

    pickaxe:   'M22 78 L74 26 M60 12 C74 14 86 26 88 40 C76 32 68 24 60 12 Z',
    caveMouth: 'M18 88 C18 52 82 52 82 88 Z',
    caveDark:  'M34 88 C34 66 66 66 66 88 Z',

    domeBody:  'M30 88 V62 H70 V88 Z',
    dome:      'M28 62 A22 22 0 0 1 72 62 Z',
    spire:     'M50 12 L58 44 H42 Z',
    starRay:   'M50 6 L57 40 L92 50 L57 60 L50 94 L43 60 L8 50 L43 40 Z',

    bridge:    'M8 62 C30 34 70 34 92 62 M8 62 V80 M92 62 V80 M30 47 V70 M50 40 V74 M70 47 V70',
    passGap:   'M6 88 L30 34 L46 74 Z M54 74 L70 34 L94 88 Z',

    compassRing: 'M50 6 A44 44 0 1 1 49.9 6 Z',
    compassNeedle: 'M50 8 L60 50 L50 92 L40 50 Z',
    compassCross: 'M8 50 H92 M50 8 V92',
    banner:    'M20 12 H80 V72 L50 58 L20 72 Z',
    monster:   'M6 76 C22 52 34 76 50 60 C64 46 82 56 92 40 M92 40 L84 44 M92 40 L88 50 M50 60 C50 50 58 46 62 50'
  };

  function part(d, f, s, lw, tr) { return { d: d, f: f || null, s: s || null, lw: lw || 0, tr: tr || null }; }

  /* kısayollar */
  function tree(kind, x, y, sc) {
    if (kind === 'pine') return [part(P.pineTrunk, 'wood', null, 0, [x, y, sc]), part(P.pine, 'greend', 'ink', 2.5, [x, y, sc])];
    return [part(P.leafTrunk, 'wood', null, 0, [x, y, sc]), part(P.leaf, 'green', 'ink', 2.5, [x, y, sc])];
  }
  function house(x, y, sc) {
    return [
      part(P.houseBody, 'fill', 'ink', 3, [x, y, sc]),
      part(P.houseRoof, 'shade', 'ink', 3, [x, y, sc]),
      part(P.houseDoor, 'ink2', null, 0, [x, y, sc])
    ];
  }
  function tower(x, y, sc, roof) {
    var a = [part(P.tower, 'fill', 'ink', 3, [x, y, sc]), part(P.towerCren, 'stone', 'ink', 2, [x, y, sc]),
             part(P.towerWin, 'ink2', null, 0, [x, y, sc])];
    if (roof) a.splice(1, 1, part(P.towerRoof, 'red', 'ink', 3, [x, y, sc]));
    return a;
  }
  function cat(a) { return Array.prototype.concat.apply([], a); }

  /* ---------------- kütüphane ---------------- */
  var SYMBOLS = {

    mountains: { tr: 'Dağlar', en: 'Mountains', items: [
      { id: 'mnt_peak', tr: 'Tek zirve', en: 'Single peak', parts: [
        part(P.peak, 'fill', 'ink', 3.2), part(P.peakShade, 'shade', null, 0), part(P.peak, null, 'ink', 3.2)] },
      { id: 'mnt_snow', tr: 'Karlı zirve', en: 'Snowy peak', parts: [
        part(P.peak, 'fill', 'ink', 3.2), part(P.peakShade, 'shade', null, 0),
        part(P.peakSnow, 'snow', null, 0), part(P.peak, null, 'ink', 3.2)] },
      { id: 'mnt_double', tr: 'Çift zirve', en: 'Double peak', parts: cat([
        [part(P.peak, 'fill', 'ink', 4, [-4, 8, 0.72]), part(P.peakShade, 'shade', null, 0, [-4, 8, 0.72])],
        [part(P.peak, 'fill', 'ink', 4, [34, 16, 0.6]), part(P.peakShade, 'shade', null, 0, [34, 16, 0.6])]]) },
      { id: 'mnt_range', tr: 'Sıradağ', en: 'Range', parts: cat([
        [part(P.peak, 'fill', 'ink', 5, [-14, 22, 0.52]), part(P.peakShade, 'shade', null, 0, [-14, 22, 0.52])],
        [part(P.peak, 'fill', 'ink', 5, [36, 26, 0.46]), part(P.peakShade, 'shade', null, 0, [36, 26, 0.46])],
        [part(P.peak, 'fill', 'ink', 4.2, [8, 2, 0.66]), part(P.peakShade, 'shade', null, 0, [8, 2, 0.66]),
         part(P.peakSnow, 'snow', null, 0, [8, 2, 0.66])]]) },
      { id: 'mnt_jagged', tr: 'Sivri kayalık', en: 'Jagged', parts: [
        part(P.cone, 'fill', 'ink', 3.2), part(P.coneShade, 'shade', null, 0),
        part(P.coneSnow, 'snow', null, 0), part(P.cone, null, 'ink', 3.2)] },
      { id: 'mnt_volcano', tr: 'Yanardağ', en: 'Volcano', parts: [
        part('M12 88 L38 26 H62 L88 88 Z', 'fill', 'ink', 3.2),
        part('M50 26 L62 26 L88 88 L50 88 Z', 'shade', null, 0),
        part('M36 26 C40 14 60 14 64 26 Z', 'red', 'ink', 2.5),
        part('M44 22 C42 8 56 10 52 2', null, 'ink2', 3)] }
    ]},

    hills: { tr: 'Tepeler', en: 'Hills', items: [
      { id: 'hill_1', tr: 'Tek tepe', en: 'Single hill', parts: [
        part(P.hill, 'fill', 'ink', 3.2), part(P.hillLine, null, 'ink2', 2.2)] },
      { id: 'hill_2', tr: 'Çift tepe', en: 'Twin hills', parts: cat([
        [part(P.hill, 'fill', 'ink', 4.4, [-6, 10, 0.72])],
        [part(P.hill, 'fill', 'ink', 4.4, [30, 4, 0.78]), part(P.hillLine, null, 'ink2', 3, [30, 4, 0.78])]]) },
      { id: 'hill_3', tr: 'Tepelik', en: 'Hill cluster', parts: cat([
        [part(P.hill, 'fill', 'ink', 5.5, [-16, 16, 0.56])],
        [part(P.hill, 'fill', 'ink', 5.5, [40, 16, 0.56])],
        [part(P.hill, 'fill', 'ink', 4.6, [10, 0, 0.7]), part(P.hillLine, null, 'ink2', 3, [10, 0, 0.7])]]) },
      { id: 'hill_rock', tr: 'Kayalık tepe', en: 'Rocky hill', parts: [
        part(P.rock, 'stone', 'ink', 3.2), part('M30 52 L44 62 L56 44', null, 'ink2', 2.4)] }
    ]},

    forests: { tr: 'Ormanlar', en: 'Forests', items: [
      { id: 'for_pine1', tr: 'Çam', en: 'Pine', parts: tree('pine', 0, 0, 1) },
      { id: 'for_pine3', tr: 'Çamlık', en: 'Pine grove', parts: cat([
        tree('pine', -22, 8, 0.6), tree('pine', 24, 8, 0.6), tree('pine', 0, -8, 0.78)]) },
      { id: 'for_leaf1', tr: 'Yapraklı ağaç', en: 'Broadleaf', parts: cat([tree('leaf', 0, 0, 1)]) },
      { id: 'for_leaf3', tr: 'Koru', en: 'Grove', parts: cat([
        tree('leaf', -24, 10, 0.58), tree('leaf', 26, 10, 0.58), tree('leaf', 0, -8, 0.76)]) },
      { id: 'for_mixed', tr: 'Karışık orman', en: 'Mixed wood', parts: cat([
        tree('pine', -26, 6, 0.6), tree('leaf', 22, 10, 0.56), tree('pine', 4, -10, 0.72)]) },
      { id: 'for_dead', tr: 'Kuru orman', en: 'Dead wood', parts: [
        part(P.deadTree, null, 'ink', 3.4), part(P.deadTree, null, 'ink2', 3.4, [26, 16, 0.62])] },
      { id: 'for_palm', tr: 'Palmiye', en: 'Palm', parts: [
        part(P.palmTrunk, null, 'wood', 6), part(P.palmFrond, null, 'greend', 3.4)] },
      { id: 'for_stump', tr: 'Çalılık', en: 'Scrub', parts: [
        part('M22 84 C14 66 30 58 38 68 C42 54 62 54 66 68 C78 60 88 74 78 84 Z', 'green', 'ink', 3),
        part('M34 84 V70 M50 84 V64 M66 84 V70', null, 'greend', 2.4)] }
    ]},

    cities: { tr: 'Şehirler', en: 'Cities', items: [
      { id: 'city_big', tr: 'Büyük şehir', en: 'Large city', parts: cat([
        [part(P.wall, 'fill', 'ink', 3), part(P.wallCren, 'stone', 'ink', 2), part(P.gate, 'ink2', null, 0)],
        tower(-30, -22, 0.44), tower(58, -22, 0.44),
        [part('M40 58 V40 H58 V58 Z', 'shade', 'ink', 2.4)]]) },
      { id: 'city_capital', tr: 'Başkent', en: 'Capital', parts: cat([
        [part(P.wall, 'fill', 'ink', 3), part(P.wallCren, 'stone', 'ink', 2), part(P.gate, 'ink2', null, 0)],
        tower(-32, -26, 0.5, true), tower(58, -26, 0.5, true),
        [part(P.spire, 'shade', 'ink', 2.4, [10, 6, 0.62]),
         part(P.flagPole, null, 'ink', 2.4, [-6, -34, 0.7]),
         part(P.flag, 'red', 'ink', 2, [-6, -34, 0.7])]]) },
      { id: 'city_metro', tr: 'Metropol', en: 'Metropolis', parts: cat([
        [part(P.wall, 'fill', 'ink', 3), part(P.wallCren, 'stone', 'ink', 2)],
        house(-26, -30, 0.44), house(24, -30, 0.44),
        tower(12, -46, 0.36, true),
        [part(P.gate, 'ink2', null, 0)]]) },
      { id: 'city_free', tr: 'Sursuz şehir', en: 'Open city', parts: cat([
        house(-30, 6, 0.62), house(20, 6, 0.62), house(-6, -22, 0.66),
        tower(30, -26, 0.4, true)]) }
    ]},

    towns: { tr: 'Kasabalar', en: 'Towns', items: [
      { id: 'town_1', tr: 'Kasaba', en: 'Town', parts: cat([house(-22, 4, 0.62), house(18, 4, 0.62), house(-2, -20, 0.56)]) },
      { id: 'town_wall', tr: 'Surlu kasaba', en: 'Walled town', parts: cat([
        [part('M18 86 V58 H82 V86 Z', 'fill', 'ink', 3),
         part('M18 58 H28 V50 H18 Z M40 58 H50 V50 H40 Z M62 58 H72 V50 H62 Z', 'stone', 'ink', 2)],
        house(2, -26, 0.44)]) },
      { id: 'town_cross', tr: 'Kavşak kasabası', en: 'Crossroad town', parts: cat([
        [part('M6 74 H94 M50 40 V94', null, 'ink2', 3)],
        house(-26, -8, 0.5), house(20, -8, 0.5)]) }
    ]},

    villages: { tr: 'Köyler', en: 'Villages', items: [
      { id: 'vil_1', tr: 'Köy', en: 'Village', parts: cat([house(-16, 8, 0.5), house(16, 0, 0.5)]) },
      { id: 'vil_hamlet', tr: 'Mezra', en: 'Hamlet', parts: house(0, 0, 0.7) },
      { id: 'vil_farm', tr: 'Çiftlik', en: 'Farmstead', parts: cat([
        house(-10, 2, 0.6),
        [part('M56 86 V62 H86 V86 Z', 'shade', 'ink', 2.6),
         part('M52 64 L71 52 L90 64 Z', 'wood', 'ink', 2.6)]]) }
    ]},

    castles: { tr: 'Kaleler', en: 'Castles', items: [
      { id: 'cas_castle', tr: 'Kale', en: 'Castle', parts: cat([
        [part('M22 88 V56 H78 V88 Z', 'fill', 'ink', 3),
         part('M22 56 H32 V48 H22 Z M45 56 H55 V48 H45 Z M68 56 H78 V48 H68 Z', 'stone', 'ink', 2)],
        tower(-32, -14, 0.46), tower(58, -14, 0.46)]) },
      { id: 'cas_keep', tr: 'İç kale', en: 'Keep', parts: cat([
        tower(0, 0, 1, false),
        [part('M28 88 V70 H72 V88 Z', 'shade', 'ink', 2.6),
         part(P.flagPole, null, 'ink', 2.4), part(P.flag, 'red', 'ink', 2)]]) },
      { id: 'cas_tower', tr: 'Gözetleme kulesi', en: 'Watchtower', parts: cat([
        tower(0, 0, 1, true), [part('M32 88 H68', null, 'ink', 3)]]) },
      { id: 'cas_fort', tr: 'Hisar', en: 'Fort', parts: cat([
        [part('M14 88 V60 H86 V88 Z', 'fill', 'ink', 3),
         part('M14 60 H26 V52 H14 Z M44 60 H56 V52 H44 Z M74 60 H86 V52 H74 Z', 'stone', 'ink', 2),
         part(P.gate, 'ink2', null, 0, [0, 6, 1])],
        tower(-38, 4, 0.38), tower(64, 4, 0.38)]) }
    ]},

    ports: { tr: 'Limanlar', en: 'Ports', items: [
      { id: 'prt_port', tr: 'Liman', en: 'Port', parts: [
        part(P.anchor, null, 'ink', 5.5), part('M44 22 H56', null, 'ink', 5.5)] },
      { id: 'prt_harbor', tr: 'Doğal liman', en: 'Harbor', parts: cat([
        [part(P.hull, 'wood', 'ink', 3), part(P.mast, 'fill', 'ink', 3)],
        [part(P.wave, null, 'water', 3, [0, 10, 1])]]) },
      { id: 'prt_light', tr: 'Deniz feneri', en: 'Lighthouse', parts: [
        part('M38 88 L44 30 H56 L62 88 Z', 'fill', 'ink', 3),
        part('M42 60 L58 60 M41 48 L59 48', null, 'red', 4),
        part('M40 30 H60 V20 H40 Z', 'stone', 'ink', 2.6),
        part('M22 25 L38 25 M62 25 L78 25', null, 'gold', 3)] }
    ]},

    ruins: { tr: 'Harabeler', en: 'Ruins', items: [
      { id: 'run_columns', tr: 'Sütunlar', en: 'Columns', parts: cat([
        [part(P.column, 'stone', 'ink', 2.6, [-24, 6, 0.8]), part(P.columnCap, 'stone', 'ink', 2.6, [-24, 6, 0.8])],
        [part(P.column, 'stone', 'ink', 2.6, [16, 0, 0.9]), part(P.columnCap, 'stone', 'ink', 2.6, [16, 0, 0.9])],
        [part('M6 86 H94', null, 'ink', 3.4)]]) },
      { id: 'run_arch', tr: 'Yıkık kemer', en: 'Broken arch', parts: [
        part(P.archRuin, 'stone', 'ink', 3), part('M22 70 L14 78 M78 62 L88 70', null, 'ink2', 2.6)] },
      { id: 'run_tower', tr: 'Yıkık kule', en: 'Ruined tower', parts: [
        part('M38 88 V42 L46 34 L52 46 L60 30 L62 88 Z', 'stone', 'ink', 3),
        part('M44 62 H56 V74 H44 Z', 'ink2', null, 0),
        part('M20 88 H80', null, 'ink', 3)] },
      { id: 'run_walls', tr: 'Yıkık surlar', en: 'Ruined walls', parts: [
        part('M10 88 V58 L24 62 V50 L40 56 V70 L58 62 V52 L74 66 L90 60 V88 Z', 'stone', 'ink', 3),
        part('M24 78 H40 M58 76 H74', null, 'ink2', 2.4)] }
    ]},

    temples: { tr: 'Tapınaklar', en: 'Temples', items: [
      { id: 'tmp_temple', tr: 'Tapınak', en: 'Temple', parts: [
        part('M12 88 H88 V78 H12 Z', 'stone', 'ink', 2.8),
        part(P.column, 'fill', 'ink', 2.4, [-26, -6, 0.7]),
        part(P.column, 'fill', 'ink', 2.4, [0, -6, 0.7]),
        part(P.column, 'fill', 'ink', 2.4, [26, -6, 0.7]),
        part('M8 40 L50 12 L92 40 Z', 'shade', 'ink', 3)] },
      { id: 'tmp_dome', tr: 'Kubbeli mabet', en: 'Domed shrine', parts: [
        part(P.domeBody, 'fill', 'ink', 3), part(P.dome, 'shade', 'ink', 3),
        part('M46 88 V70 H54 V88 Z', 'ink2', null, 0),
        part('M50 40 V26 M44 32 H56', null, 'gold', 3.4)] },
      { id: 'tmp_shrine', tr: 'Yol mabedi', en: 'Wayshrine', parts: [
        part('M40 88 V52 H60 V88 Z', 'stone', 'ink', 3),
        part('M32 54 L50 34 L68 54 Z', 'shade', 'ink', 3),
        part(P.starRay, 'gold', 'ink', 1.6, [30, 6, 0.4])] },
      { id: 'tmp_monastery', tr: 'Manastır', en: 'Monastery', parts: cat([
        [part('M20 88 V60 H80 V88 Z', 'fill', 'ink', 3),
         part('M16 62 L50 42 L84 62 Z', 'shade', 'ink', 3)],
        [part(P.spire, 'stone', 'ink', 2.4, [-4, -22, 0.6]),
         part('M40 24 V12 M35 17 H45', null, 'gold', 2.6)]]) }
    ]},

    mines: { tr: 'Madenler', en: 'Mines', items: [
      { id: 'min_mine', tr: 'Maden', en: 'Mine', parts: [
        part(P.caveMouth, 'stone', 'ink', 3), part(P.caveDark, 'ink', null, 0),
        part(P.pickaxe, 'ink2', 'ink', 2.4, [10, -34, 0.5])] },
      { id: 'min_quarry', tr: 'Taş ocağı', en: 'Quarry', parts: [
        part('M10 88 L26 54 H74 L90 88 Z', 'stone', 'ink', 3),
        part('M26 54 L40 76 L58 60 L74 82', null, 'ink2', 2.6),
        part('M34 88 L44 76 L54 88 Z', 'stoned', 'ink', 2)] },
      { id: 'min_cave', tr: 'Mağara', en: 'Cave', parts: [
        part('M6 88 C10 44 90 44 94 88 Z', 'stone', 'ink', 3),
        part(P.caveDark, 'ink', null, 0),
        part('M30 60 L36 70 M66 58 L60 70', null, 'ink2', 2.4)] },
      { id: 'min_forge', tr: 'Demirhane', en: 'Forge', parts: cat([
        house(0, 6, 0.72),
        [part('M62 46 V22 H74 V46 Z', 'stoned', 'ink', 2.4),
         part('M64 20 C62 8 74 10 70 2', null, 'ink2', 2.6)]]) }
    ]},

    passes: { tr: 'Geçitler', en: 'Passes', items: [
      { id: 'pss_pass', tr: 'Dağ geçidi', en: 'Mountain pass', parts: [
        part(P.passGap, 'fill', 'ink', 3.2),
        part('M46 88 C50 70 50 62 50 44', null, 'ink2', 3, null)] },
      { id: 'pss_bridge', tr: 'Köprü', en: 'Bridge', parts: [
        part(P.bridge, null, 'ink', 4), part('M8 62 C30 34 70 34 92 62', null, 'stone', 7)] },
      { id: 'pss_ford', tr: 'Sığ geçit', en: 'Ford', parts: [
        part('M6 50 q12 -10 24 0 t24 0 t24 0 t16 0', null, 'water', 4),
        part('M6 70 q12 -10 24 0 t24 0 t24 0 t16 0', null, 'water', 4),
        part('M30 34 L44 86 M56 34 L70 86', null, 'ink2', 3.4)] },
      { id: 'pss_gate', tr: 'Sınır kapısı', en: 'Border gate', parts: cat([
        tower(-30, 10, 0.6), tower(34, 10, 0.6),
        [part('M34 52 H66 V60 H34 Z', 'wood', 'ink', 2.6)]]) }
    ]},

    misc: { tr: 'Dekoratif', en: 'Decorative', items: [
      { id: 'msc_compass', tr: 'Pusula gülü', en: 'Compass rose', parts: [
        part(P.compassRing, null, 'ink', 3),
        part(P.compassCross, null, 'ink2', 1.6),
        part(P.compassNeedle, 'fill', 'ink', 2),
        part('M50 8 L57 50 L50 92 Z', 'ink', null, 0),
        part('M50 50 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0', 'gold', 'ink', 2)] },
      { id: 'msc_star', tr: 'Yıldız gülü', en: 'Star rose', parts: [
        part(P.starRay, 'fill', 'ink', 2.4),
        part('M50 26 L54 46 L50 50 L46 46 Z', 'ink', null, 0)] },
      { id: 'msc_ship', tr: 'Yelkenli', en: 'Ship', parts: [
        part(P.hull, 'wood', 'ink', 3), part(P.mast, 'fill', 'ink', 3),
        part(P.wave, null, 'water', 3, [0, 12, 1])] },
      { id: 'msc_monster', tr: 'Deniz canavarı', en: 'Sea monster', parts: [
        part(P.monster, null, 'ink', 4)] },
      { id: 'msc_banner', tr: 'Sancak', en: 'Banner', parts: [
        part(P.banner, 'fill', 'ink', 3),
        part('M20 24 H80', null, 'ink2', 2.4)] },
      { id: 'msc_scale', tr: 'Ölçek çubuğu', en: 'Scale bar', parts: [
        part('M8 46 H92 V62 H8 Z', 'fill', 'ink', 2.6),
        part('M29 46 H50 V62 H29 Z M71 46 H92 V62 H71 Z', 'ink', null, 0),
        part('M8 40 V46 M50 40 V46 M92 40 V46', null, 'ink', 2)] },
      { id: 'msc_skull', tr: 'Tehlike', en: 'Danger', parts: [
        part('M24 40 C24 16 76 16 76 40 C76 56 66 60 66 72 H34 C34 60 24 56 24 40 Z', 'fill', 'ink', 3),
        part('M36 42 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M64 42 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', 'ink', null, 0),
        part('M42 60 H58 M46 72 V80 M54 72 V80', null, 'ink', 3)] },
      { id: 'msc_swamp', tr: 'Bataklık işareti', en: 'Marsh mark', parts: [
        part('M12 70 H88 M22 84 H78', null, 'greend', 4),
        part('M30 68 V44 M50 68 V34 M70 68 V48', null, 'greend', 3.4),
        part('M50 34 C44 26 56 24 50 16', null, 'ink2', 2.6)] }
    ]}
  };

  /* ---------------- renk yardımcıları ---------------- */
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h * 360, s, l];
  }
  function hslToCss(h, s, l) {
    h = ((h % 360) + 360) % 360;
    return 'hsl(' + h.toFixed(1) + ',' + (s * 100).toFixed(1) + '%,' + (l * 100).toFixed(1) + '%)';
  }
  var hueCache = {};
  function shift(color, hue) {
    if (!hue) return color;
    var k = color + '|' + hue;
    if (hueCache[k]) return hueCache[k];
    var rgb = hexToRgb(color), hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    var out = hslToCss(hsl[0] + hue, hsl[1], hsl[2]);
    hueCache[k] = out;
    return out;
  }
  function resolve(key, hue) {
    if (!key) return null;
    var c = PAL[key] || key;
    return shift(c, hue);
  }

  /* ---------------- çizim ---------------- */
  var pathCache = {};
  function p2d(d) {
    if (!pathCache[d]) pathCache[d] = new Path2D(d);
    return pathCache[d];
  }

  var index = {};   // id -> {def, catKey}
  Object.keys(SYMBOLS).forEach(function (ck) {
    SYMBOLS[ck].items.forEach(function (it) { index[it.id] = { def: it, cat: ck }; });
  });

  function get(id) { return index[id] ? index[id].def : null; }
  function catOf(id) { return index[id] ? index[id].cat : null; }

  /**
   * Sembolü ctx'e çizer. Merkez (x,y).
   * o = {x,y,size,rot,hue,opacity,flip}
   */
  function draw(ctx, id, o) {
    var def = get(id);
    if (!def) return;
    var size = o.size || 64, hue = o.hue || 0;
    ctx.save();
    ctx.globalAlpha = (o.opacity === undefined ? 1 : o.opacity) * (ctx.globalAlpha);
    ctx.translate(o.x || 0, o.y || 0);
    if (o.rot) ctx.rotate(o.rot * Math.PI / 180);
    var s = size / 100;
    ctx.scale(o.flip ? -s : s, s);
    ctx.translate(-50, -50);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (var i = 0; i < def.parts.length; i++) {
      var pt = def.parts[i];
      ctx.save();
      if (pt.tr) { ctx.translate(pt.tr[0], pt.tr[1]); ctx.scale(pt.tr[2], pt.tr[2]); }
      var path = p2d(pt.d);
      if (pt.f) { ctx.fillStyle = resolve(pt.f, hue); ctx.fill(path); }
      if (pt.s && pt.lw) { ctx.strokeStyle = resolve(pt.s, hue); ctx.lineWidth = pt.lw; ctx.stroke(path); }
      ctx.restore();
    }
    ctx.restore();
  }

  /** SVG export için <g> üretir */
  function toSVG(id, o) {
    var def = get(id);
    if (!def) return '';
    var hue = o.hue || 0, s = (o.size || 64) / 100;
    var t = 'translate(' + o.x + ',' + o.y + ') rotate(' + (o.rot || 0) + ') scale(' +
            ((o.flip ? -s : s)) + ',' + s + ') translate(-50,-50)';
    var out = '<g transform="' + t + '" opacity="' + (o.opacity === undefined ? 1 : o.opacity) +
              '" stroke-linejoin="round" stroke-linecap="round">';
    def.parts.forEach(function (pt) {
      var attrs = ' d="' + pt.d + '"';
      attrs += ' fill="' + (pt.f ? resolve(pt.f, hue) : 'none') + '"';
      if (pt.s && pt.lw) attrs += ' stroke="' + resolve(pt.s, hue) + '" stroke-width="' + pt.lw + '"';
      else attrs += ' stroke="none"';
      if (pt.tr) attrs += ' transform="translate(' + pt.tr[0] + ',' + pt.tr[1] + ') scale(' + pt.tr[2] + ')"';
      out += '<path' + attrs + '/>';
    });
    return out + '</g>';
  }

  /** yaklaşık isabet kutusu (harita birimi) */
  function bounds(o) {
    var h = (o.size || 64) / 2;
    return { x: o.x - h, y: o.y - h, w: h * 2, h: h * 2 };
  }

  function count() {
    var n = 0;
    Object.keys(SYMBOLS).forEach(function (k) { n += SYMBOLS[k].items.length; });
    return n;
  }

  global.Sym = {
    PAL: PAL, SYMBOLS: SYMBOLS, get: get, catOf: catOf,
    draw: draw, toSVG: toSVG, bounds: bounds, count: count, shift: shift
  };
})(window);
