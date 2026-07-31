/* ============================================================
   Medieval Map Editor — catalog.js
   İzometrik yapı kataloğu. Iso.Scene üzerine kurulu bileşik
   yapılar; tematik kategorilere dağıtılır.
   ============================================================ */
(function (global) {
  'use strict';

  var S = function () { return new Iso.Scene(); };

  /* ============ ORTAK BİLEŞENLER ============ */

  /** basit ev: gövde + beşik çatı + kapı */
  function hut(s, x, y, w, dp, h, mat, roof, o) {
    o = o || {};
    s.box(x, y, o.z || 0, w, dp, h, mat, { door:o.door !== false, win:o.win || 0, doorH:o.doorH });
    if (o.roof !== false) {
      var ov = o.ov === undefined ? Math.min(w, dp) * 0.13 : o.ov;
      s.gable(x - ov, y - ov, (o.z || 0) + h, w + ov * 2, dp + ov * 2, o.rh || h * 0.82, roof || 'thatch');
    }
    return s;
  }

  /** kırma çatılı ev */
  function hutHip(s, x, y, w, dp, h, mat, roof, o) {
    o = o || {};
    s.box(x, y, o.z || 0, w, dp, h, mat, { door:o.door !== false, win:o.win || 0 });
    var ov = Math.min(w, dp) * 0.12;
    s.hip(x - ov, y - ov, (o.z || 0) + h, w + ov * 2, dp + ov * 2, o.rh || h * 0.75, roof || 'tileR');
    return s;
  }

  /** kare kule */
  function towerSq(s, x, y, z, w, h, mat, o) {
    o = o || {};
    s.box(x, y, z, w, w, h, mat, { slit:o.slit === undefined ? 2 : o.slit });
    if (o.crenel !== false) s.crenel(x - w * 0.06, y - w * 0.06, z + h, w * 1.12, w * 1.12, w * 0.19, w * 0.26, mat);
    if (o.roof) s.cone(x + w / 2, y + w / 2, z + h + (o.crenel === false ? 0 : w * 0.26), w * 0.72, h * 0.48, o.roof);
    if (o.flag) s.flag(x + w / 2, y + w / 2, z + h + w * 0.3, h * 0.42, o.flag);
    return s;
  }

  /** yuvarlak kule */
  function towerRd(s, x, y, z, r, h, mat, o) {
    o = o || {};
    s.cyl(x, y, z, r, h, mat, { slit:o.slit === undefined ? 2 : o.slit });
    if (o.crenel) s.crenel(x - r, y - r, z + h, r * 2, r * 2, r * 0.34, r * 0.42, mat);
    if (o.roof !== false) s.cone(x, y, z + h + (o.crenel ? r * 0.42 : 0), r * 1.16, h * 0.55, o.roof || 'tileR');
    if (o.flag) s.flag(x, y, z + h + h * 0.55, h * 0.4, o.flag);
    return s;
  }

  /** mazgallı sur parçası */
  function wall(s, x, y, z, w, dp, h, mat, o) {
    o = o || {};
    s.box(x, y, z, w, dp, h, mat, { slit:o.slit || 0 });
    s.crenel(x, y, z + h, w, dp, Math.max(1.6, h * 0.24), h * 0.30, mat);
    return s;
  }

  /** çadır */
  function tent(s, x, y, r, h, mat) {
    s.cone(x, y, 0, r, h, mat || 'canvasT', { pole:true, flap:true });
    return s;
  }

  /** yurt (silindir + basık kubbe) */
  function yurt(s, x, y, r, h, mat) {
    s.cyl(x, y, 0, r, h, mat || 'canvasT', { slit:0 });
    s.dome(x, y, h, r * 1.02, r * 0.62, mat || 'canvasT');
    return s;
  }

  /** longhouse (viking) */
  function longhouse(s, x, y, w, dp, h, mat, roof) {
    s.box(x, y, 0, w, dp, h, mat || 'wood', { door:true, win:2 });
    s.gable(x - w * 0.05, y - dp * 0.16, h, w * 1.10, dp * 1.32, h * 1.15, roof || 'thatch');
    return s;
  }

  /* rastgelesiz sabit dağılım için yardımcı */
  function grid(n, cols, sx, sy) {
    var out = [], i;
    for (i = 0; i < n; i++) out.push([(i % cols) * sx, Math.floor(i / cols) * sy]);
    return out;
  }

  /* ============ KATALOG ============ */
  var ITEMS = {};   /* kategori -> [{id,tr,en,make}] */

  function reg(cat, id, tr, en, make) {
    (ITEMS[cat] = ITEMS[cat] || []).push({ id:id, tr:tr, en:en, make:make });
  }

  /* ---------------------------------------------------------------
     KÖYLER
     --------------------------------------------------------------- */
  reg('villages', 'iv_hut', 'Kulübe', 'Hut', function () {
    var s = S(); s.pad(14, 12, 20, 'dirt'); hut(s, 4, 4, 20, 16, 12, 'wood', 'thatch', { win:1 }); return s;
  });
  reg('villages', 'iv_stonehut', 'Taş kulübe', 'Stone hut', function () {
    var s = S(); s.pad(14, 12, 20, 'dirt'); hut(s, 4, 4, 20, 16, 13, 'stone', 'thatch', { win:1 }); return s;
  });
  reg('villages', 'iv_cottage', 'Ev', 'Cottage', function () {
    var s = S(); s.pad(16, 14, 24, 'grass'); hut(s, 4, 4, 24, 18, 14, 'wood', 'tileR', { win:2 }); return s;
  });
  reg('villages', 'iv_farmhouse', 'Çiftlik evi', 'Farmhouse', function () {
    var s = S(); s.pad(22, 18, 34, 'dirt');
    hut(s, 2, 4, 24, 18, 14, 'stone', 'thatch', { win:2 });
    hut(s, 30, 10, 18, 14, 10, 'wood', 'thatch', { door:false });
    s.fence(0, 30, 0, 48, 3, 6, 'wood');
    return s;
  });
  reg('villages', 'iv_village3', 'Köy', 'Village', function () {
    var s = S(); s.pad(24, 22, 40, 'grass');
    hut(s, 2, 6, 18, 14, 11, 'wood', 'thatch', { win:1 });
    hut(s, 28, 2, 16, 13, 10, 'wood', 'thatch');
    hut(s, 18, 28, 20, 15, 12, 'stone', 'thatch', { win:2 });
    return s;
  });
  reg('villages', 'iv_village5', 'Büyük köy', 'Large village', function () {
    var s = S(); s.pad(28, 26, 48, 'grass');
    hut(s, 0, 8, 16, 13, 10, 'wood', 'thatch');
    hut(s, 22, 0, 17, 13, 11, 'wood', 'thatch', { win:1 });
    hut(s, 44, 10, 15, 12, 10, 'wood', 'thatch');
    hut(s, 10, 32, 18, 14, 11, 'stone', 'thatch', { win:1 });
    hut(s, 36, 36, 16, 13, 10, 'wood', 'tileR');
    return s;
  });
  reg('villages', 'iv_fishvillage', 'Balıkçı köyü', 'Fishing village', function () {
    var s = S(); s.pad(24, 20, 40, 'dirt');
    hut(s, 2, 4, 18, 14, 11, 'wood', 'thatch', { win:1 });
    hut(s, 26, 10, 16, 13, 10, 'wood', 'thatch');
    s.box(6, 34, 0, 40, 6, 2.4, 'wood', { plain:true });
    s.box(20, 40, 0, 4, 10, 2.0, 'wood', { plain:true });
    s.box(36, 40, 0, 4, 10, 2.0, 'wood', { plain:true });
    return s;
  });
  reg('villages', 'iv_shepherd', 'Çoban köyü', 'Shepherd village', function () {
    var s = S(); s.pad(22, 20, 36, 'grass');
    hut(s, 4, 4, 18, 14, 11, 'stone', 'thatch', { win:1 });
    s.fence(0, 34, 0, 44, 3, 7, 'wood');
    s.fence(44, 8, 0, 3, 30, 7, 'wood');
    s.box(26, 14, 0, 12, 10, 7, 'wood', { plain:true });
    s.gable(24, 12, 7, 16, 14, 6, 'thatch');
    return s;
  });
  reg('villages', 'iv_swampvillage', 'Bataklık köyü', 'Swamp village', function () {
    var s = S(); s.pad(22, 20, 36, 'dirt');
    s.box(4, 6, 0, 2, 2, 8, 'woodD', { plain:true });
    s.box(20, 6, 0, 2, 2, 8, 'woodD', { plain:true });
    s.box(4, 20, 0, 2, 2, 8, 'woodD', { plain:true });
    s.box(20, 20, 0, 2, 2, 8, 'woodD', { plain:true });
    hut(s, 2, 4, 22, 18, 10, 'wood', 'thatch', { z:8, win:1 });
    hut(s, 30, 22, 16, 13, 9, 'wood', 'thatch', { z:5 });
    s.box(30, 24, 0, 2, 2, 5, 'woodD', { plain:true });
    s.box(44, 24, 0, 2, 2, 5, 'woodD', { plain:true });
    return s;
  });
  reg('villages', 'iv_treevillage', 'Ağaç köyü', 'Tree village', function () {
    var s = S(); s.pad(20, 18, 34, 'grass');
    s.tree(8, 8, 0, 30, 'round');
    s.tree(32, 14, 0, 26, 'round');
    hut(s, 4, 22, 16, 13, 9, 'wood', 'thatch', { win:1 });
    return s;
  });
  reg('villages', 'iv_mudvillage', 'Balçık köy', 'Mud village', function () {
    var s = S(); s.pad(22, 20, 36, 'dirt');
    s.cyl(10, 10, 0, 9, 9, 'dirt'); s.cone(10, 10, 9, 10, 7, 'thatch');
    s.cyl(30, 16, 0, 8, 8, 'dirt'); s.cone(30, 16, 8, 9, 6, 'thatch');
    s.cyl(18, 32, 0, 7, 7, 'dirt'); s.cone(18, 32, 7, 8, 5.5, 'thatch');
    return s;
  });
  reg('villages', 'iv_snowvillage', 'Kar köyü', 'Snow village', function () {
    var s = S(); s.pad(22, 20, 36, 'snow');
    hut(s, 2, 6, 18, 14, 10, 'wood', 'snow', { win:1 });
    hut(s, 26, 12, 16, 13, 9, 'wood', 'snow');
    s.tree(40, 2, 0, 22, 'pine', 'tileG');
    return s;
  });
  reg('villages', 'iv_wellvillage', 'Kuyulu köy', 'Well village', function () {
    var s = S(); s.pad(22, 20, 36, 'dirt');
    hut(s, 0, 6, 17, 13, 10, 'stone', 'thatch', { win:1 });
    hut(s, 28, 14, 16, 13, 10, 'stone', 'thatch');
    s.cyl(20, 34, 0, 5, 5, 'stone');
    s.box(16, 33, 5, 1.6, 1.6, 8, 'wood', { plain:true });
    s.box(23, 33, 5, 1.6, 1.6, 8, 'wood', { plain:true });
    s.gable(14, 30, 13, 12, 8, 5, 'wood');
    return s;
  });

  /* ---------------------------------------------------------------
     KASABALAR
     --------------------------------------------------------------- */
  reg('towns', 'it_town', 'Kasaba', 'Town', function () {
    var s = S(); s.pad(30, 28, 52, 'grass');
    hut(s, 0, 8, 20, 15, 13, 'stone', 'tileR', { win:2 });
    hut(s, 26, 2, 18, 14, 14, 'wood', 'tileR', { win:1 });
    hut(s, 48, 12, 17, 14, 12, 'stone', 'tileR');
    hut(s, 12, 34, 20, 15, 13, 'wood', 'tileR', { win:2 });
    hut(s, 40, 40, 18, 14, 12, 'stone', 'tileR', { win:1 });
    return s;
  });
  reg('towns', 'it_fencetown', 'Çit surlu kasaba', 'Fenced town', function () {
    var s = S(); s.pad(30, 28, 54, 'dirt');
    s.palisade(0, 0, 0, 60, 54, 13, 'woodD');
    hut(s, 10, 12, 18, 14, 11, 'wood', 'thatch', { win:1 });
    hut(s, 34, 18, 16, 13, 11, 'wood', 'thatch');
    hut(s, 18, 34, 17, 13, 11, 'stone', 'thatch', { win:1 });
    return s;
  });
  reg('towns', 'it_stonetown', 'Taş surlu kasaba', 'Walled town', function () {
    var s = S(); s.pad(30, 28, 54, 'dirt');
    wall(s, 0, 0, 0, 60, 54, 14, 'stone', { slit:3 });
    hut(s, 12, 14, 18, 14, 12, 'stone', 'tileR', { win:1 });
    hut(s, 34, 20, 16, 13, 12, 'stone', 'tileR');
    towerSq(s, 44, 4, 0, 12, 22, 'stone', { roof:'tileR' });
    return s;
  });
  reg('towns', 'it_towertown', 'Kuleli kasaba', 'Towered town', function () {
    var s = S(); s.pad(32, 30, 56, 'dirt');
    wall(s, 0, 0, 0, 62, 56, 13, 'stone');
    towerRd(s, 4, 4, 0, 7, 24, 'stone', { roof:'tileR' });
    towerRd(s, 58, 4, 0, 7, 24, 'stone', { roof:'tileR' });
    towerRd(s, 4, 52, 0, 7, 24, 'stone', { roof:'tileR' });
    hut(s, 16, 18, 20, 15, 13, 'stone', 'tileR', { win:2 });
    hut(s, 38, 26, 16, 13, 12, 'wood', 'tileR');
    return s;
  });
  reg('towns', 'it_markettown', 'Pazar kasabası', 'Market town', function () {
    var s = S(); s.pad(28, 26, 50, 'dirt');
    hut(s, 0, 10, 18, 14, 12, 'stone', 'tileR', { win:1 });
    hut(s, 40, 16, 17, 13, 12, 'wood', 'tileR');
    s.box(14, 30, 0, 8, 8, 5, 'wood', { plain:true }); s.gable(12, 28, 5, 12, 12, 5, 'canvasT');
    s.box(28, 34, 0, 8, 8, 5, 'wood', { plain:true }); s.gable(26, 32, 5, 12, 12, 5, 'canvasT');
    s.box(42, 38, 0, 8, 8, 5, 'wood', { plain:true }); s.gable(40, 36, 5, 12, 12, 5, 'canvasT');
    return s;
  });
  reg('towns', 'it_rivertown', 'Nehir kasabası', 'River town', function () {
    var s = S(); s.pad(28, 26, 50, 'grass');
    hut(s, 0, 6, 18, 14, 12, 'stone', 'tileR', { win:1 });
    hut(s, 32, 4, 17, 13, 12, 'wood', 'tileR');
    s.box(0, 32, 0, 56, 8, 3, 'stone', { plain:true });
    s.box(10, 30, 3, 3, 12, 6, 'stone', { plain:true });
    s.box(42, 30, 3, 3, 12, 6, 'stone', { plain:true });
    return s;
  });
  reg('towns', 'it_minetown', 'Madenci kasabası', 'Mining town', function () {
    var s = S(); s.pad(28, 26, 48, 'dirt');
    hut(s, 0, 8, 18, 14, 12, 'wood', 'thatch', { win:1 });
    hut(s, 26, 4, 16, 13, 11, 'wood', 'thatch');
    s.rock(46, 30, 0, 14, 16, 'granite');
    s.box(38, 32, 0, 10, 8, 8, 'dark', { plain:true });
    s.gable(36, 30, 8, 14, 12, 6, 'woodD');
    return s;
  });
  reg('towns', 'it_inn', 'Han', 'Inn', function () {
    var s = S(); s.pad(20, 18, 32, 'dirt');
    s.box(2, 4, 0, 26, 20, 18, 'stone', { door:true, win:3 });
    s.gable(0, 2, 18, 30, 24, 14, 'tileR');
    s.box(30, 10, 0, 3, 3, 16, 'wood', { plain:true });
    s.box(24, 10, 13, 8, 1.2, 5, 'wood', { plain:true });
    return s;
  });
  reg('towns', 'it_caravanserai', 'Kervansaray', 'Caravanserai', function () {
    var s = S(); s.pad(30, 28, 54, 'dirt');
    wall(s, 0, 0, 0, 58, 52, 14, 'stoneW');
    s.box(20, 46, 0, 18, 8, 20, 'stoneW', { door:true, doorH:0.7 });
    s.onion(29, 50, 20, 8, 11, 'gold');
    s.box(6, 8, 0, 14, 10, 10, 'stoneW', { win:2 });
    s.box(36, 10, 0, 14, 10, 10, 'stoneW', { win:2 });
    return s;
  });

  /* ---------------------------------------------------------------
     ŞEHİRLER
     --------------------------------------------------------------- */
  reg('cities', 'ic_city', 'Şehir', 'City', function () {
    var s = S(); s.pad(36, 34, 62, 'dirt');
    wall(s, 0, 0, 0, 72, 66, 16, 'stone', { slit:4 });
    towerRd(s, 4, 4, 0, 8, 30, 'stone', { roof:'tileR' });
    towerRd(s, 68, 4, 0, 8, 30, 'stone', { roof:'tileR' });
    towerRd(s, 4, 62, 0, 8, 30, 'stone', { roof:'tileR' });
    hutHip(s, 14, 16, 20, 15, 16, 'stoneW', 'tileR', { win:2 });
    hutHip(s, 40, 22, 18, 14, 18, 'stoneW', 'tileR', { win:1 });
    hutHip(s, 22, 40, 18, 14, 15, 'stoneW', 'tileR', { win:2 });
    towerSq(s, 46, 44, 0, 14, 34, 'stone', { roof:'tileB', flag:'tileR' });
    return s;
  });
  reg('cities', 'ic_capital', 'Başkent', 'Capital', function () {
    var s = S(); s.pad(42, 40, 74, 'dirt');
    wall(s, 0, 0, 0, 86, 78, 17, 'stoneW', { slit:5 });
    towerRd(s, 4, 4, 0, 9, 34, 'stoneW', { roof:'tileB', flag:'tileR' });
    towerRd(s, 82, 4, 0, 9, 34, 'stoneW', { roof:'tileB' });
    towerRd(s, 4, 74, 0, 9, 34, 'stoneW', { roof:'tileB' });
    towerRd(s, 82, 74, 0, 9, 34, 'stoneW', { roof:'tileB' });
    hutHip(s, 14, 16, 20, 16, 17, 'stoneW', 'tileR', { win:2 });
    hutHip(s, 44, 14, 18, 14, 19, 'stoneW', 'tileR', { win:1 });
    hutHip(s, 18, 44, 18, 14, 16, 'stoneW', 'tileR', { win:2 });
    s.box(46, 42, 0, 24, 20, 26, 'stoneW', { win:3 });
    s.dome(58, 52, 26, 13, 16, 'gold');
    return s;
  });
  reg('cities', 'ic_hillcity', 'Tepe şehri', 'Hill city', function () {
    var s = S(); s.pad(34, 32, 58, 'grass');
    s.rock(30, 28, 0, 30, 12, 'granite');
    wall(s, 4, 4, 8, 60, 54, 13, 'stone');
    hutHip(s, 16, 18, 18, 14, 14, 'stoneW', 'tileR', { z:8, win:2 });
    hutHip(s, 38, 26, 16, 13, 15, 'stoneW', 'tileR', { z:8 });
    towerSq(s, 26, 38, 8, 14, 30, 'stone', { roof:'tileR', flag:'tileB' });
    return s;
  });
  reg('cities', 'ic_portcity', 'Liman şehri', 'Port city', function () {
    var s = S(); s.pad(36, 32, 62, 'dirt');
    wall(s, 0, 0, 0, 64, 46, 15, 'stone');
    towerRd(s, 4, 4, 0, 8, 26, 'stone', { roof:'tileR' });
    hutHip(s, 16, 14, 18, 14, 15, 'stoneW', 'tileR', { win:2 });
    hutHip(s, 38, 20, 16, 13, 14, 'stoneW', 'tileR');
    s.box(0, 50, 0, 68, 10, 3, 'wood', { plain:true });
    s.box(14, 60, 0, 4, 12, 2.6, 'wood', { plain:true });
    s.box(44, 60, 0, 4, 12, 2.6, 'wood', { plain:true });
    return s;
  });
  reg('cities', 'ic_freecity', 'Sursuz şehir', 'Free city', function () {
    var s = S(); s.pad(32, 30, 56, 'dirt');
    hutHip(s, 0, 10, 20, 15, 15, 'stoneW', 'tileR', { win:2 });
    hutHip(s, 26, 4, 18, 14, 17, 'stoneW', 'tileR', { win:1 });
    hutHip(s, 50, 14, 16, 13, 14, 'wood', 'tileR');
    hutHip(s, 12, 36, 18, 14, 15, 'stoneW', 'tileR', { win:2 });
    towerSq(s, 42, 42, 0, 13, 28, 'stone', { roof:'tileB' });
    return s;
  });

  /* ---------------------------------------------------------------
     KALELER
     --------------------------------------------------------------- */
  reg('castles', 'ik_motte', 'Höyük kalesi', 'Motte & bailey', function () {
    var s = S(); s.pad(28, 26, 48, 'grass');
    s.palisade(0, 0, 0, 52, 46, 11, 'woodD');
    s.rock(38, 34, 0, 15, 10, 'dirt');
    s.box(31, 27, 8, 14, 14, 16, 'wood', { win:1 });
    s.gable(29, 25, 24, 18, 18, 9, 'thatch');
    return s;
  });
  reg('castles', 'ik_knight', 'Şövalye kalesi', 'Knight castle', function () {
    var s = S(); s.pad(28, 26, 50, 'dirt');
    wall(s, 0, 0, 0, 54, 48, 15, 'stone', { slit:3 });
    towerSq(s, -2, -2, 0, 14, 28, 'stone', { roof:'tileR', flag:'tileR' });
    towerSq(s, 44, 40, 0, 13, 24, 'stone', { roof:'tileR' });
    s.box(20, 18, 0, 18, 16, 22, 'stone', { win:2 });
    s.gable(18, 16, 22, 22, 20, 11, 'tileR');
    return s;
  });
  reg('castles', 'ik_noble', 'Soylu şatosu', 'Noble castle', function () {
    var s = S(); s.pad(32, 30, 56, 'grass');
    wall(s, 0, 0, 0, 62, 56, 14, 'stoneW');
    towerRd(s, 3, 3, 0, 8, 30, 'stoneW', { roof:'tileB', flag:'tileR' });
    towerRd(s, 59, 3, 0, 8, 30, 'stoneW', { roof:'tileB' });
    towerRd(s, 3, 53, 0, 8, 30, 'stoneW', { roof:'tileB' });
    towerRd(s, 59, 53, 0, 8, 30, 'stoneW', { roof:'tileB' });
    s.box(20, 18, 0, 24, 22, 26, 'stoneW', { win:3 });
    s.hip(18, 16, 26, 28, 26, 14, 'tileB');
    return s;
  });
  reg('castles', 'ik_royal', 'Kral şatosu', 'Royal castle', function () {
    var s = S(); s.pad(38, 36, 66, 'grass');
    wall(s, 0, 0, 0, 76, 68, 16, 'stoneW', { slit:4 });
    towerRd(s, 3, 3, 0, 9, 36, 'stoneW', { roof:'tileB', flag:'tileR' });
    towerRd(s, 73, 3, 0, 9, 36, 'stoneW', { roof:'tileB' });
    towerRd(s, 3, 65, 0, 9, 36, 'stoneW', { roof:'tileB' });
    towerRd(s, 73, 65, 0, 9, 36, 'stoneW', { roof:'tileB' });
    s.box(24, 22, 0, 28, 24, 30, 'stoneW', { win:3 });
    s.hip(22, 20, 30, 32, 28, 16, 'tileB');
    towerRd(s, 38, 34, 46, 8, 16, 'stoneW', { roof:'gold', flag:'tileR' });
    return s;
  });
  reg('castles', 'ik_keep', 'İç kale', 'Keep', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.box(4, 4, 0, 26, 24, 34, 'stone', { win:2, slit:2 });
    s.crenel(2, 2, 34, 30, 28, 6, 8, 'stone');
    s.flag(17, 16, 42, 16, 'tileR');
    return s;
  });
  reg('castles', 'ik_donjon', 'Donjon', 'Donjon', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.box(6, 6, 0, 24, 22, 40, 'stone', { win:3, slit:2 });
    s.crenel(4, 4, 40, 28, 26, 5.5, 8, 'stone');
    towerSq(s, 4, 4, 0, 8, 46, 'stone', { crenel:true, slit:1 });
    s.flag(18, 16, 48, 14, 'tileB');
    return s;
  });
  reg('castles', 'ik_gatehouse', 'Kale kapısı', 'Gatehouse', function () {
    var s = S(); s.pad(26, 20, 44, 'dirt');
    wall(s, 0, 0, 0, 50, 20, 15, 'stone');
    s.box(16, -3, 0, 20, 26, 26, 'stone', { door:true, doorH:0.62, slit:2 });
    s.crenel(14, -5, 26, 24, 30, 5, 7, 'stone');
    towerRd(s, 12, 10, 0, 6, 32, 'stone', { roof:'tileR' });
    towerRd(s, 40, 10, 0, 6, 32, 'stone', { roof:'tileR' });
    return s;
  });
  reg('castles', 'ik_seafort', 'Deniz kalesi', 'Sea fort', function () {
    var s = S(); s.pad(26, 24, 44, 'granite');
    s.rock(24, 22, 0, 26, 8, 'granite');
    wall(s, 4, 4, 6, 42, 38, 14, 'granite');
    towerRd(s, 24, 22, 6, 10, 30, 'granite', { crenel:true, roof:false });
    s.flag(24, 22, 36, 14, 'tileB');
    return s;
  });
  reg('castles', 'ik_mountainfort', 'Dağ kalesi', 'Mountain fort', function () {
    var s = S(); s.pad(28, 26, 48, 'granite');
    s.rock(20, 20, 0, 24, 18, 'granite');
    s.rock(44, 34, 0, 16, 12, 'granite');
    s.box(14, 14, 14, 22, 18, 20, 'granite', { win:1, slit:2 });
    s.crenel(12, 12, 34, 26, 22, 5, 7, 'granite');
    towerSq(s, 34, 30, 10, 12, 26, 'granite', { roof:'tileD' });
    return s;
  });
  reg('castles', 'ik_watchtower', 'Gözetleme kulesi', 'Watchtower', function () {
    var s = S(); s.pad(14, 12, 24, 'dirt');
    towerRd(s, 12, 11, 0, 8, 38, 'stone', { crenel:true, roof:false, slit:3 });
    s.flag(12, 11, 42, 14, 'tileR');
    return s;
  });
  reg('castles', 'ik_signaltower', 'İşaret kulesi', 'Signal tower', function () {
    var s = S(); s.pad(13, 12, 22, 'dirt');
    towerSq(s, 4, 4, 0, 16, 34, 'stone', { slit:2 });
    s.cyl(12, 12, 40, 5, 5, 'basalt');
    s.cone(12, 12, 45, 5.5, 8, 'tileR');
    return s;
  });
  reg('castles', 'ik_palisadefort', 'Kazık hisar', 'Palisade fort', function () {
    var s = S(); s.pad(26, 24, 46, 'dirt');
    s.palisade(0, 0, 0, 50, 44, 15, 'woodD');
    s.box(16, 14, 0, 18, 16, 14, 'wood', { win:1 });
    s.gable(14, 12, 14, 22, 20, 10, 'thatch');
    s.box(0, 0, 0, 10, 10, 22, 'woodD', { plain:true });
    return s;
  });
  reg('castles', 'ik_ruinedcastle', 'Yıkık kale', 'Ruined castle', function () {
    var s = S(); s.pad(26, 24, 46, 'dirt');
    s.box(0, 0, 0, 46, 8, 12, 'ruin', { slit:1 });
    s.box(0, 8, 0, 8, 32, 10, 'ruin');
    s.box(4, 4, 0, 14, 14, 22, 'ruin', { win:1 });
    s.box(4, 4, 22, 6, 14, 6, 'ruin', { plain:true });
    s.rock(36, 30, 0, 10, 5, 'ruin');
    s.rock(24, 36, 0, 7, 4, 'ruin');
    return s;
  });

  /* ---------------------------------------------------------------
     GÖÇEBE / KAMP
     --------------------------------------------------------------- */
  reg('nomads', 'in_tent', 'Çadır', 'Tent', function () {
    var s = S(); s.pad(12, 11, 20, 'dirt'); tent(s, 11, 10, 11, 16, 'canvasT'); return s;
  });
  reg('nomads', 'in_tenthide', 'Deri çadır', 'Hide tent', function () {
    var s = S(); s.pad(12, 11, 20, 'dirt'); tent(s, 11, 10, 11, 17, 'hide'); return s;
  });
  reg('nomads', 'in_camp3', 'Kamp', 'Camp', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    tent(s, 8, 8, 9, 13, 'canvasT');
    tent(s, 30, 12, 8, 12, 'hide');
    tent(s, 18, 30, 9, 13, 'canvasT');
    s.rock(20, 18, 0, 4, 2, 'basalt');
    return s;
  });
  reg('nomads', 'in_yurt', 'Yurt', 'Yurt', function () {
    var s = S(); s.pad(13, 12, 22, 'grass'); yurt(s, 12, 11, 11, 10, 'canvasT'); return s;
  });
  reg('nomads', 'in_yurtcamp', 'Yurt kampı', 'Yurt camp', function () {
    var s = S(); s.pad(22, 20, 38, 'grass');
    yurt(s, 10, 10, 8, 8, 'canvasT');
    yurt(s, 32, 16, 7, 7, 'hide');
    yurt(s, 18, 32, 8, 8, 'canvasT');
    return s;
  });
  reg('nomads', 'in_khantent', 'Kağan çadırı', 'Khan tent', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    yurt(s, 18, 16, 15, 13, 'hide');
    s.flag(4, 4, 0, 30, 'tileR');
    s.flag(32, 4, 0, 26, 'gold');
    return s;
  });
  reg('nomads', 'in_shamantent', 'Şaman çadırı', 'Shaman tent', function () {
    var s = S(); s.pad(14, 13, 24, 'dirt');
    tent(s, 13, 12, 12, 18, 'hide');
    s.box(1, 1, 0, 1.8, 1.8, 22, 'woodD', { plain:true });
    s.box(24, 1, 0, 1.8, 1.8, 20, 'woodD', { plain:true });
    return s;
  });
  reg('nomads', 'in_caravan', 'Kervan', 'Caravan', function () {
    var s = S(); s.pad(22, 16, 36, 'dirt');
    s.box(2, 6, 3, 16, 10, 8, 'wood', { plain:true });
    s.cone(10, 11, 11, 9, 7, 'canvasT');
    s.cyl(3, 4, 0, 3, 2.4, 'woodD'); s.cyl(17, 4, 0, 3, 2.4, 'woodD');
    s.cyl(3, 17, 0, 3, 2.4, 'woodD'); s.cyl(17, 17, 0, 3, 2.4, 'woodD');
    s.box(26, 8, 2, 12, 8, 6, 'wood', { plain:true });
    s.cone(32, 12, 8, 7, 5, 'canvasT');
    return s;
  });
  reg('nomads', 'in_corral', 'Ağıl', 'Corral', function () {
    var s = S(); s.pad(22, 20, 38, 'dirt');
    s.fence(0, 0, 0, 46, 3, 8, 'wood');
    s.fence(0, 38, 0, 46, 3, 8, 'wood');
    s.fence(0, 3, 0, 3, 36, 8, 'wood');
    s.fence(44, 3, 0, 3, 36, 8, 'wood');
    tent(s, 34, 30, 7, 10, 'canvasT');
    return s;
  });
  reg('nomads', 'in_kurgan', 'Kurgan', 'Kurgan', function () {
    var s = S(); s.pad(20, 18, 34, 'grass');
    s.dome(18, 16, 0, 17, 12, 'grass');
    s.box(17, 15, 12, 2.4, 2.4, 14, 'granite', { plain:true });
    return s;
  });
  reg('nomads', 'in_firepit', 'Ateş yeri', 'Fire pit', function () {
    var s = S(); s.pad(11, 10, 18, 'dirt');
    var i;
    for (i = 0; i < 7; i++) {
      var a = i / 7 * Math.PI * 2;
      s.rock(10 + Math.cos(a) * 7, 9 + Math.sin(a) * 7, 0, 2.4, 2, 'basalt');
    }
    s.cone(10, 9, 0, 4, 7, 'tileR');
    return s;
  });
  reg('nomads', 'in_totem', 'Totem direği', 'Totem pole', function () {
    var s = S(); s.pad(10, 9, 16, 'dirt');
    s.box(7, 7, 0, 6, 6, 8, 'woodD');
    s.box(7, 7, 8, 6, 6, 8, 'tileR');
    s.box(7, 7, 16, 6, 6, 8, 'woodD');
    s.box(5, 5, 24, 10, 10, 4, 'gold');
    return s;
  });
  reg('nomads', 'in_tribevillage', 'Kabile köyü', 'Tribal village', function () {
    var s = S(); s.pad(24, 22, 42, 'dirt');
    var i;
    for (i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2;
      tent(s, 22 + Math.cos(a) * 17, 20 + Math.sin(a) * 17, 7, 10, i % 2 ? 'hide' : 'canvasT');
    }
    s.box(21, 19, 0, 3, 3, 16, 'woodD', { plain:true });
    return s;
  });

  /* ---------------------------------------------------------------
     DİNİ YAPILAR
     --------------------------------------------------------------- */
  reg('temples', 'ip_chapel', 'Şapel', 'Chapel', function () {
    var s = S(); s.pad(18, 16, 30, 'grass');
    s.box(2, 4, 0, 22, 16, 14, 'stoneW', { door:true, win:2 });
    s.gable(0, 2, 14, 26, 20, 11, 'tileR');
    s.box(26, 8, 0, 8, 8, 22, 'stoneW', { slit:1 });
    s.cone(30, 12, 22, 5.5, 12, 'tileB');
    return s;
  });
  reg('temples', 'ip_church', 'Kilise', 'Church', function () {
    var s = S(); s.pad(22, 20, 38, 'grass');
    s.box(2, 6, 0, 30, 18, 17, 'stoneW', { door:true, win:3 });
    s.gable(0, 4, 17, 34, 22, 14, 'tileG');
    s.box(34, 10, 0, 10, 10, 30, 'stoneW', { slit:2 });
    s.cone(39, 15, 30, 7, 18, 'tileG');
    return s;
  });
  reg('temples', 'ip_cathedral', 'Katedral', 'Cathedral', function () {
    var s = S(); s.pad(26, 24, 46, 'dirt');
    s.box(4, 8, 0, 38, 22, 22, 'stoneW', { door:true, win:4 });
    s.gable(2, 6, 22, 42, 26, 17, 'tileB');
    s.box(0, 4, 0, 12, 12, 40, 'stoneW', { slit:3 });
    s.cone(6, 10, 40, 8, 22, 'tileB');
    s.box(38, 4, 0, 12, 12, 36, 'stoneW', { slit:3 });
    s.cone(44, 10, 36, 8, 20, 'tileB');
    return s;
  });
  reg('temples', 'ip_monastery', 'Manastır', 'Monastery', function () {
    var s = S(); s.pad(26, 24, 46, 'grass');
    wall(s, 0, 0, 0, 50, 44, 11, 'stoneW');
    s.box(10, 12, 0, 24, 16, 16, 'stoneW', { win:3 });
    s.gable(8, 10, 16, 28, 20, 12, 'tileR');
    s.box(36, 30, 0, 9, 9, 24, 'stoneW', { slit:1 });
    s.cone(40, 34, 24, 6, 12, 'tileR');
    return s;
  });
  reg('temples', 'ip_greektemple', 'Sütunlu tapınak', 'Columned temple', function () {
    var s = S(); s.pad(24, 22, 42, 'stoneW');
    s.box(0, 0, 0, 46, 34, 5, 'stoneW', { plain:true });
    s.box(3, 3, 5, 40, 28, 3, 'stoneW', { plain:true });
    var i;
    for (i = 0; i < 5; i++) s.cyl(8 + i * 8, 6, 8, 2.6, 20, 'stoneW');
    for (i = 0; i < 5; i++) s.cyl(8 + i * 8, 28, 8, 2.6, 20, 'stoneW');
    s.box(3, 3, 28, 40, 28, 4, 'stoneW', { plain:true });
    s.gable(1, 1, 32, 44, 32, 12, 'stoneW');
    return s;
  });
  reg('temples', 'ip_mosque', 'Kubbeli mabet', 'Domed shrine', function () {
    var s = S(); s.pad(22, 20, 38, 'stoneW');
    s.box(4, 6, 0, 28, 24, 16, 'stoneW', { door:true, win:2 });
    s.dome(18, 18, 16, 15, 16, 'gold');
    s.cyl(0, 2, 0, 4, 34, 'stoneW');
    s.cone(0, 2, 34, 4.6, 9, 'gold');
    return s;
  });
  reg('temples', 'ip_bigmosque', 'Büyük mabet', 'Grand shrine', function () {
    var s = S(); s.pad(28, 26, 50, 'stoneW');
    s.box(6, 8, 0, 36, 30, 18, 'stoneW', { door:true, win:3 });
    s.dome(24, 23, 18, 19, 20, 'gold');
    s.cyl(0, 2, 0, 4.4, 40, 'stoneW'); s.cone(0, 2, 40, 5, 10, 'gold');
    s.cyl(46, 2, 0, 4.4, 40, 'stoneW'); s.cone(46, 2, 40, 5, 10, 'gold');
    s.cyl(0, 42, 0, 4.4, 36, 'stoneW'); s.cone(0, 42, 36, 5, 9, 'gold');
    return s;
  });
  reg('temples', 'ip_pagoda3', 'Pagoda', 'Pagoda', function () {
    var s = S(); s.pad(18, 17, 30, 'stoneW');
    s.box(4, 4, 0, 22, 22, 4, 'stoneW', { plain:true });
    s.box(7, 7, 4, 16, 16, 12, 'wood', { door:true });
    s.pagoda(3, 3, 14, 24, 24, 9, 'tileB', 1);
    s.box(9, 9, 22, 12, 12, 10, 'wood', { win:2 });
    s.pagoda(5, 5, 30, 20, 20, 8, 'tileB', 1);
    s.box(11, 11, 37, 8, 8, 8, 'wood');
    s.pagoda(7, 7, 43, 16, 16, 7, 'tileB', 1);
    return s;
  });
  reg('temples', 'ip_pagoda5', 'Büyük pagoda', 'Great pagoda', function () {
    var s = S(); s.pad(20, 19, 34, 'stoneW');
    s.box(2, 2, 0, 26, 26, 4, 'stoneW', { plain:true });
    var i, w = 20, z = 4;
    for (i = 0; i < 4; i++) {
      s.box(15 - w / 2, 15 - w / 2, z, w, w, 9, 'wood', { win:2 });
      s.pagoda(15 - (w + 7) / 2, 15 - (w + 7) / 2, z + 9, w + 7, w + 7, 7, 'tileR', 1);
      z += 15; w -= 3;
    }
    s.cyl(15, 15, z, 1.4, 8, 'gold');
    return s;
  });
  reg('temples', 'ip_stonecircle', 'Taş çember', 'Stone circle', function () {
    var s = S(); s.pad(20, 19, 34, 'grass');
    var i;
    for (i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      s.box(18 + Math.cos(a) * 15 - 2.4, 17 + Math.sin(a) * 15 - 2, 0, 5, 4, 14 + (i % 3) * 3, 'granite');
    }
    s.box(15, 14, 0, 8, 6, 2.4, 'granite', { plain:true });
    return s;
  });
  reg('temples', 'ip_druidgrove', 'Druid korusu', 'Druid grove', function () {
    var s = S(); s.pad(20, 19, 34, 'grass');
    s.tree(9, 9, 0, 30, 'round', 'tileG');
    s.tree(28, 12, 0, 26, 'round', 'tileG');
    s.tree(16, 28, 0, 28, 'round', 'tileG');
    var i;
    for (i = 0; i < 5; i++) {
      var a = i / 5 * Math.PI * 2;
      s.box(18 + Math.cos(a) * 9 - 1.6, 17 + Math.sin(a) * 9 - 1.4, 0, 3.4, 3, 8, 'granite');
    }
    return s;
  });
  reg('temples', 'ip_darktemple', 'Karanlık tapınak', 'Dark temple', function () {
    var s = S(); s.pad(22, 20, 38, 'basalt');
    s.box(2, 4, 0, 34, 26, 6, 'basalt', { plain:true });
    var i;
    for (i = 0; i < 4; i++) s.box(6 + i * 8, 8, 6, 4, 4, 18, 'basalt');
    s.box(4, 6, 24, 30, 22, 5, 'basalt', { plain:true });
    s.cone(19, 17, 29, 12, 14, 'dark');
    return s;
  });
  reg('temples', 'ip_altar', 'Sunak', 'Altar', function () {
    var s = S(); s.pad(13, 12, 22, 'dirt');
    s.box(4, 4, 0, 18, 14, 4, 'granite', { plain:true });
    s.box(7, 6, 4, 12, 10, 6, 'granite', { plain:true });
    s.box(6, 5, 10, 14, 12, 2.4, 'granite', { plain:true });
    return s;
  });
  reg('temples', 'ip_runestone', 'Rün taşı', 'Runestone', function () {
    var s = S(); s.pad(11, 10, 18, 'grass');
    s.box(6, 6, 0, 9, 5, 22, 'granite');
    s.rock(4, 12, 0, 5, 3, 'granite');
    return s;
  });
  reg('temples', 'ip_obelisk', 'Dikilitaş', 'Obelisk', function () {
    var s = S(); s.pad(14, 13, 24, 'stoneW');
    s.box(4, 4, 0, 20, 20, 5, 'stoneW', { plain:true });
    s.box(8, 8, 5, 12, 12, 4, 'stoneW', { plain:true });
    s.box(10, 10, 9, 8, 8, 34, 'stoneW');
    s.cone(14, 14, 43, 5, 8, 'gold');
    return s;
  });
  reg('temples', 'ip_ziggurat', 'Zigurat', 'Ziggurat', function () {
    var s = S(); s.pad(26, 25, 46, 'dirt');
    s.box(0, 0, 0, 48, 48, 9, 'stoneW');
    s.box(6, 6, 9, 36, 36, 9, 'stoneW');
    s.box(12, 12, 18, 24, 24, 9, 'stoneW');
    s.box(18, 18, 27, 12, 12, 8, 'gold');
    return s;
  });
  reg('temples', 'ip_pyramid', 'Piramit', 'Pyramid', function () {
    var s = S(); s.pad(26, 25, 46, 'dirt');
    var i, w = 48, z = 0;
    for (i = 0; i < 7; i++) { s.box(24 - w / 2, 24 - w / 2, z, w, w, 5.5, 'stoneW', { plain:true }); z += 5.5; w -= 6.4; }
    return s;
  });
  reg('temples', 'ip_graveyard', 'Mezarlık', 'Graveyard', function () {
    var s = S(); s.pad(22, 20, 38, 'grass');
    s.fence(0, 0, 0, 44, 3, 7, 'wood');
    s.fence(0, 36, 0, 44, 3, 7, 'wood');
    var i;
    for (i = 0; i < 6; i++) {
      var gx = 6 + (i % 3) * 14, gy = 10 + Math.floor(i / 3) * 14;
      s.box(gx, gy, 0, 6, 3, 8 + (i % 2) * 2, 'ruin');
    }
    return s;
  });
  reg('temples', 'ip_crypt', 'Kripta', 'Crypt', function () {
    var s = S(); s.pad(18, 16, 30, 'dirt');
    s.box(2, 4, 0, 24, 18, 12, 'stoneD', { door:true, doorH:0.72 });
    s.hip(0, 2, 12, 28, 22, 8, 'stoneD');
    s.box(4, 24, 0, 6, 3, 9, 'ruin');
    s.box(16, 24, 0, 6, 3, 8, 'ruin');
    return s;
  });

  /* ---------------------------------------------------------------
     LİMAN / SU
     --------------------------------------------------------------- */
  reg('ports', 'iw_jetty', 'İskele', 'Jetty', function () {
    var s = S(); s.pad(20, 12, 32, 'dirt');
    s.box(0, 10, 0, 44, 8, 3, 'wood', { plain:true });
    s.box(6, 8, 0, 2.4, 2.4, 4, 'woodD', { plain:true });
    s.box(20, 8, 0, 2.4, 2.4, 4, 'woodD', { plain:true });
    s.box(34, 8, 0, 2.4, 2.4, 4, 'woodD', { plain:true });
    return s;
  });
  reg('ports', 'iw_harbour', 'Liman', 'Harbour', function () {
    var s = S(); s.pad(28, 22, 48, 'dirt');
    s.box(0, 26, 0, 56, 12, 5, 'stone', { plain:true });
    s.box(6, 14, 0, 6, 12, 3, 'wood', { plain:true });
    s.box(28, 14, 0, 6, 12, 3, 'wood', { plain:true });
    hut(s, 8, 40, 16, 12, 10, 'stone', 'tileR', { win:1 });
    hut(s, 34, 42, 14, 11, 9, 'wood', 'tileR');
    return s;
  });
  reg('ports', 'iw_warharbour', 'Deniz üssü', 'War harbour', function () {
    var s = S(); s.pad(30, 24, 52, 'stone');
    s.box(0, 28, 0, 60, 14, 6, 'stone', { plain:true });
    towerRd(s, 6, 34, 6, 7, 26, 'stone', { crenel:true, roof:false });
    towerRd(s, 52, 34, 6, 7, 26, 'stone', { crenel:true, roof:false });
    s.box(10, 12, 0, 8, 14, 3, 'wood', { plain:true });
    s.box(34, 12, 0, 8, 14, 3, 'wood', { plain:true });
    return s;
  });
  reg('ports', 'iw_lighthouse', 'Deniz feneri', 'Lighthouse', function () {
    var s = S(); s.pad(14, 13, 24, 'granite');
    s.rock(13, 12, 0, 14, 6, 'granite');
    s.cyl(13, 12, 4, 8, 34, 'stoneW', { slit:2 });
    s.cyl(13, 12, 38, 9, 6, 'gold');
    s.cone(13, 12, 44, 9.5, 10, 'tileR');
    return s;
  });
  reg('ports', 'iw_shipyard', 'Tersane', 'Shipyard', function () {
    var s = S(); s.pad(26, 22, 46, 'dirt');
    s.box(0, 24, 0, 52, 10, 4, 'wood', { plain:true });
    s.box(8, 6, 0, 26, 16, 12, 'wood', { win:2 });
    s.gable(6, 4, 12, 30, 20, 10, 'thatch');
    s.box(38, 10, 0, 3, 3, 22, 'woodD', { plain:true });
    return s;
  });
  reg('ports', 'iw_stilthouse', 'Kazık ev', 'Stilt house', function () {
    var s = S(); s.pad(16, 14, 26, 'dirt');
    s.box(2, 2, 0, 2.4, 2.4, 10, 'woodD', { plain:true });
    s.box(22, 2, 0, 2.4, 2.4, 10, 'woodD', { plain:true });
    s.box(2, 18, 0, 2.4, 2.4, 10, 'woodD', { plain:true });
    s.box(22, 18, 0, 2.4, 2.4, 10, 'woodD', { plain:true });
    hut(s, 0, 0, 26, 22, 11, 'wood', 'thatch', { z:10, win:1 });
    return s;
  });
  reg('ports', 'iw_watermill', 'Su değirmeni', 'Watermill', function () {
    var s = S(); s.pad(18, 16, 30, 'grass');
    s.box(2, 4, 0, 22, 18, 15, 'stone', { door:true, win:2 });
    s.gable(0, 2, 15, 26, 22, 11, 'tileR');
    s.cyl(28, 12, 2, 9, 4, 'woodD');
    return s;
  });
  reg('ports', 'iw_pirate', 'Korsan üssü', 'Pirate cove', function () {
    var s = S(); s.pad(24, 20, 42, 'dirt');
    s.rock(6, 34, 0, 12, 10, 'granite');
    s.box(0, 20, 0, 46, 9, 3, 'wood', { plain:true });
    hut(s, 12, 2, 18, 13, 10, 'woodD', 'thatch', { win:1 });
    s.flag(38, 6, 0, 26, 'dark');
    return s;
  });

  /* ---------------------------------------------------------------
     MADENLER / EKONOMİ
     --------------------------------------------------------------- */
  reg('mines', 'ie_mine', 'Maden', 'Mine', function () {
    var s = S(); s.pad(18, 16, 30, 'dirt');
    s.rock(24, 22, 0, 18, 16, 'granite');
    s.box(4, 6, 0, 14, 12, 10, 'dark', { door:true, doorH:0.82 });
    s.gable(2, 4, 10, 18, 16, 7, 'woodD');
    s.box(20, 4, 0, 2.4, 2.4, 14, 'woodD', { plain:true });
    return s;
  });
  reg('mines', 'ie_deepmine', 'Derin maden', 'Deep mine', function () {
    var s = S(); s.pad(22, 20, 38, 'dirt');
    s.rock(30, 28, 0, 22, 20, 'basalt');
    s.box(4, 8, 0, 16, 14, 12, 'dark', { door:true, doorH:0.86 });
    s.gable(2, 6, 12, 20, 18, 8, 'woodD');
    s.box(24, 4, 0, 3, 3, 22, 'woodD', { plain:true });
    s.box(24, 4, 22, 12, 3, 3, 'woodD', { plain:true });
    return s;
  });
  reg('mines', 'ie_quarry', 'Taş ocağı', 'Quarry', function () {
    var s = S(); s.pad(24, 22, 42, 'stoneD');
    s.box(0, 0, 0, 46, 42, 4, 'stoneD', { plain:true });
    s.box(6, 6, 4, 34, 30, 5, 'stoneD', { plain:true });
    s.box(14, 12, 9, 20, 18, 5, 'stoneD', { plain:true });
    s.rock(38, 6, 4, 7, 6, 'granite');
    s.rock(8, 34, 4, 6, 5, 'granite');
    return s;
  });
  reg('mines', 'ie_forge', 'Demirhane', 'Forge', function () {
    var s = S(); s.pad(18, 16, 30, 'dirt');
    s.box(2, 4, 0, 24, 18, 13, 'stone', { door:true, win:1 });
    s.gable(0, 2, 13, 28, 22, 9, 'tileD');
    s.box(20, 6, 13, 7, 7, 16, 'stoneD');
    return s;
  });
  reg('mines', 'ie_windmill', 'Yel değirmeni', 'Windmill', function () {
    var s = S(); s.pad(15, 14, 26, 'grass');
    s.cyl(14, 13, 0, 10, 22, 'stoneW', { slit:2 });
    s.cone(14, 13, 22, 11, 10, 'thatch');
    s.box(0, 12, 14, 28, 1.6, 1.6, 'woodD', { plain:true });
    s.box(13, 12, 6, 1.6, 1.6, 22, 'woodD', { plain:true });
    return s;
  });
  reg('mines', 'ie_granary', 'Tahıl ambarı', 'Granary', function () {
    var s = S(); s.pad(16, 15, 28, 'dirt');
    s.cyl(14, 13, 0, 11, 18, 'wood');
    s.cone(14, 13, 18, 12, 10, 'thatch');
    return s;
  });
  reg('mines', 'ie_lumbercamp', 'Tomruk kampı', 'Lumber camp', function () {
    var s = S(); s.pad(22, 20, 38, 'dirt');
    hut(s, 2, 6, 18, 14, 10, 'wood', 'thatch', { win:1 });
    s.cyl(30, 10, 0, 3.4, 16, 'woodD');
    s.cyl(30, 10, 16, 3.4, 4, 'woodD');
    s.box(26, 26, 0, 16, 4, 3.4, 'woodD', { plain:true });
    s.box(26, 26, 3.4, 16, 4, 3.4, 'woodD', { plain:true });
    return s;
  });
  reg('mines', 'ie_market', 'Pazar', 'Market', function () {
    var s = S(); s.pad(22, 20, 38, 'dirt');
    var i;
    for (i = 0; i < 4; i++) {
      var mx = (i % 2) * 22, my = Math.floor(i / 2) * 20;
      s.box(mx + 4, my + 4, 0, 10, 8, 6, 'wood', { plain:true });
      s.gable(mx + 2, my + 2, 6, 14, 12, 5, i % 2 ? 'tileR' : 'canvasT');
    }
    return s;
  });
  reg('mines', 'ie_farm', 'Tarla', 'Farm field', function () {
    var s = S(); s.pad(24, 22, 42, 'dirt');
    var i;
    for (i = 0; i < 4; i++) s.box(2, 2 + i * 10, 0, 44, 7, 1.6, 'dirt', { plain:true });
    hut(s, 34, 34, 14, 11, 9, 'wood', 'thatch');
    return s;
  });

  /* ---------------------------------------------------------------
     ASKERİ
     --------------------------------------------------------------- */
  reg('military', 'im_camp', 'Ordugâh', 'Army camp', function () {
    var s = S(); s.pad(26, 24, 46, 'dirt');
    s.palisade(0, 0, 0, 50, 44, 10, 'woodD');
    tent(s, 14, 14, 8, 12, 'canvasT');
    tent(s, 34, 18, 7, 11, 'canvasT');
    tent(s, 22, 32, 8, 12, 'canvasT');
    s.flag(4, 40, 0, 24, 'tileR');
    return s;
  });
  reg('military', 'im_siege', 'Kuşatma kampı', 'Siege camp', function () {
    var s = S(); s.pad(26, 24, 46, 'dirt');
    tent(s, 10, 12, 8, 12, 'canvasT');
    tent(s, 28, 8, 7, 11, 'hide');
    s.box(30, 26, 0, 16, 12, 6, 'woodD', { plain:true });
    s.box(34, 30, 6, 3, 3, 18, 'woodD', { plain:true });
    s.box(34, 30, 22, 14, 3, 3, 'woodD', { plain:true });
    s.cyl(31, 27, 0, 3, 2.4, 'woodD'); s.cyl(45, 27, 0, 3, 2.4, 'woodD');
    return s;
  });
  reg('military', 'im_outpost', 'Karakol', 'Outpost', function () {
    var s = S(); s.pad(18, 16, 30, 'dirt');
    s.palisade(0, 0, 0, 34, 30, 11, 'woodD');
    s.box(10, 10, 0, 14, 12, 12, 'wood', { win:1 });
    s.gable(8, 8, 12, 18, 16, 8, 'thatch');
    s.flag(2, 26, 0, 20, 'tileB');
    return s;
  });
  reg('military', 'im_barracks', 'Kışla', 'Barracks', function () {
    var s = S(); s.pad(24, 20, 42, 'dirt');
    s.box(2, 4, 0, 44, 18, 14, 'stone', { door:true, win:5 });
    s.gable(0, 2, 14, 48, 22, 10, 'tileD');
    s.flag(24, 28, 0, 22, 'tileR');
    return s;
  });
  reg('military', 'im_battlefield', 'Savaş alanı', 'Battlefield', function () {
    var s = S(); s.pad(26, 24, 46, 'dirt');
    var i;
    for (i = 0; i < 9; i++) {
      var a = i * 2.3, r = 8 + (i % 4) * 6;
      s.box(24 + Math.cos(a) * r, 22 + Math.sin(a) * r, 0, 1.4, 1.4, 8 + (i % 3) * 3, 'woodD', { plain:true });
    }
    s.rock(10, 34, 0, 6, 3, 'ruin');
    s.rock(38, 12, 0, 5, 3, 'ruin');
    return s;
  });
  reg('military', 'im_bridgefort', 'Köprü kalesi', 'Bridge fort', function () {
    var s = S(); s.pad(28, 20, 48, 'stone');
    s.box(0, 14, 0, 56, 12, 8, 'stone', { plain:true });
    towerSq(s, 0, 10, 8, 14, 24, 'stone', { roof:'tileR' });
    towerSq(s, 42, 10, 8, 14, 24, 'stone', { roof:'tileR' });
    return s;
  });

  /* ---------------------------------------------------------------
     BÜYÜ / FANTASTİK
     --------------------------------------------------------------- */
  reg('magic', 'ig_wizard', 'Büyücü kulesi', 'Wizard tower', function () {
    var s = S(); s.pad(16, 15, 28, 'grass');
    s.rock(15, 14, 0, 15, 5, 'granite');
    s.cyl(15, 14, 3, 9, 34, 'stoneW', { slit:3 });
    s.cyl(15, 14, 37, 11, 6, 'stoneW');
    s.cone(15, 14, 43, 11, 18, 'crystal');
    s.flag(15, 14, 61, 12, 'crystal');
    return s;
  });
  reg('magic', 'ig_darktower', 'Kara kule', 'Dark tower', function () {
    var s = S(); s.pad(16, 15, 28, 'basalt');
    s.rock(15, 14, 0, 16, 6, 'basalt');
    s.cyl(15, 14, 4, 9, 40, 'basalt', { slit:3 });
    s.crenel(6, 5, 44, 18, 18, 3.4, 5, 'basalt');
    s.cone(15, 14, 49, 8, 14, 'dark');
    return s;
  });
  reg('magic', 'ig_witchhut', 'Cadı kulübesi', 'Witch hut', function () {
    var s = S(); s.pad(15, 14, 26, 'dirt');
    s.box(4, 6, 4, 16, 13, 12, 'woodD', { door:true, win:1 });
    s.cone(12, 12, 16, 12, 13, 'thatch');
    s.box(5, 8, 0, 2.4, 2.4, 4, 'woodD', { plain:true });
    s.box(18, 8, 0, 2.4, 2.4, 4, 'woodD', { plain:true });
    s.box(5, 17, 0, 2.4, 2.4, 4, 'woodD', { plain:true });
    return s;
  });
  reg('magic', 'ig_crystalcave', 'Kristal mağara', 'Crystal cave', function () {
    var s = S(); s.pad(20, 18, 34, 'basalt');
    s.rock(20, 18, 0, 22, 16, 'basalt');
    s.box(10, 4, 0, 12, 10, 10, 'dark', { door:true, doorH:0.88 });
    s.cone(30, 26, 6, 5, 14, 'crystal');
    s.cone(38, 18, 4, 4, 11, 'crystal');
    s.cone(6, 30, 4, 4.4, 12, 'crystal');
    return s;
  });
  reg('magic', 'ig_portal', 'Portal', 'Portal', function () {
    var s = S(); s.pad(16, 15, 28, 'basalt');
    s.box(2, 12, 0, 6, 6, 26, 'granite');
    s.box(22, 12, 0, 6, 6, 26, 'granite');
    s.box(0, 11, 26, 30, 8, 6, 'granite', { plain:true });
    s.cone(15, 15, 2, 7, 20, 'crystal');
    return s;
  });
  reg('magic', 'ig_dragonlair', 'Ejderha ini', 'Dragon lair', function () {
    var s = S(); s.pad(24, 22, 42, 'basalt');
    s.rock(24, 22, 0, 26, 22, 'basalt');
    s.box(8, 2, 0, 20, 14, 16, 'dark', { door:true, doorH:0.9 });
    s.cone(40, 34, 12, 5, 12, 'basalt');
    s.cone(6, 38, 10, 4.4, 10, 'basalt');
    return s;
  });
  reg('magic', 'ig_elfcity', 'Elf şehri', 'Elven city', function () {
    var s = S(); s.pad(24, 22, 42, 'grass');
    s.tree(12, 12, 0, 34, 'round', 'tileG');
    s.cyl(30, 16, 0, 6, 26, 'stoneW', { slit:2 });
    s.cone(30, 16, 26, 7, 20, 'tileG');
    s.cyl(18, 34, 0, 5, 20, 'stoneW');
    s.cone(18, 34, 20, 6, 16, 'tileG');
    return s;
  });
  reg('magic', 'ig_dwarfgate', 'Cüce kapısı', 'Dwarf gate', function () {
    var s = S(); s.pad(24, 20, 42, 'granite');
    s.rock(24, 26, 0, 26, 22, 'granite');
    s.box(10, 2, 0, 26, 14, 20, 'granite', { door:true, doorH:0.72 });
    s.box(6, 0, 20, 34, 18, 6, 'granite', { plain:true });
    s.box(6, 0, 0, 5, 5, 24, 'granite');
    s.box(35, 0, 0, 5, 5, 24, 'granite');
    return s;
  });
  reg('magic', 'ig_goblincave', 'Goblin mağarası', 'Goblin cave', function () {
    var s = S(); s.pad(22, 20, 38, 'dirt');
    s.rock(22, 22, 0, 22, 15, 'basalt');
    s.box(8, 2, 0, 16, 12, 11, 'dark', { door:true, doorH:0.9 });
    s.palisade(0, 16, 0, 44, 3, 9, 'woodD', { corner:false });
    s.box(2, 2, 0, 1.6, 1.6, 12, 'woodD', { plain:true });
    return s;
  });
  reg('magic', 'ig_necropolis', 'Ölüler şehri', 'Necropolis', function () {
    var s = S(); s.pad(26, 24, 46, 'basalt');
    wall(s, 0, 0, 0, 48, 44, 12, 'stoneD');
    s.box(12, 14, 0, 14, 12, 16, 'stoneD', { door:true });
    s.hip(10, 12, 16, 18, 16, 9, 'dark');
    s.box(30, 28, 0, 6, 4, 11, 'ruin');
    s.box(14, 32, 0, 6, 4, 9, 'ruin');
    return s;
  });
  reg('magic', 'ig_dungeon', 'Zindan girişi', 'Dungeon entrance', function () {
    var s = S(); s.pad(18, 16, 30, 'stoneD');
    s.box(0, 0, 0, 34, 30, 5, 'stoneD', { plain:true });
    s.box(8, 6, 5, 18, 14, 12, 'stoneD', { door:true, doorH:0.86 });
    s.box(6, 4, 17, 22, 18, 4, 'stoneD', { plain:true });
    s.box(6, 4, 0, 4, 4, 20, 'stoneD');
    s.box(24, 4, 0, 4, 4, 20, 'stoneD');
    return s;
  });
  reg('magic', 'ig_bonepile', 'Kemik yığını', 'Bone pile', function () {
    var s = S(); s.pad(16, 15, 28, 'dirt');
    s.rock(15, 14, 0, 15, 7, 'bone');
    s.box(4, 4, 4, 2.2, 2.2, 12, 'bone');
    s.box(24, 8, 4, 2.2, 2.2, 10, 'bone');
    s.box(12, 24, 3, 2.2, 2.2, 11, 'bone');
    return s;
  });

  /* ---------------------------------------------------------------
     DAĞ / DOĞA (izometrik)
     --------------------------------------------------------------- */
  reg('mountains', 'ir_peak', 'Zirve', 'Peak', function () {
    var s = S(); s.pad(22, 21, 38, 'granite');
    s.rock(20, 20, 0, 22, 30, 'granite');
    s.cone(20, 20, 22, 12, 16, 'snow');
    return s;
  });
  reg('mountains', 'ir_range', 'Sıradağ', 'Range', function () {
    var s = S(); s.pad(28, 26, 50, 'granite');
    s.rock(12, 14, 0, 15, 20, 'granite');
    s.rock(34, 22, 0, 18, 26, 'granite');
    s.cone(34, 22, 20, 10, 13, 'snow');
    s.rock(22, 38, 0, 13, 16, 'granite');
    return s;
  });
  reg('mountains', 'ir_volcano', 'Yanardağ', 'Volcano', function () {
    var s = S(); s.pad(24, 23, 42, 'basalt');
    s.rock(22, 22, 0, 24, 26, 'basalt');
    s.cyl(22, 22, 22, 8, 4, 'tileR');
    return s;
  });
  reg('mountains', 'ir_cliff', 'Uçurum', 'Cliff', function () {
    var s = S(); s.pad(22, 20, 38, 'granite');
    s.box(0, 0, 0, 24, 36, 26, 'granite');
    s.box(24, 8, 0, 18, 26, 10, 'granite');
    return s;
  });
  reg('mountains', 'ir_arch', 'Kaya kemeri', 'Rock arch', function () {
    var s = S(); s.pad(20, 18, 34, 'granite');
    s.box(2, 8, 0, 9, 12, 24, 'granite');
    s.box(28, 8, 0, 9, 12, 24, 'granite');
    s.box(0, 7, 24, 39, 14, 8, 'granite');
    return s;
  });
  reg('mountains', 'ir_cave', 'Mağara', 'Cave', function () {
    var s = S(); s.pad(20, 17, 34, 'granite');
    s.rock(20, 22, 0, 22, 18, 'granite');
    s.box(10, 2, 0, 18, 12, 13, 'dark', { door:true, doorH:0.92 });
    return s;
  });
  reg('mountains', 'ir_pass', 'Geçit', 'Pass', function () {
    var s = S(); s.pad(24, 20, 42, 'granite');
    s.rock(8, 12, 0, 14, 24, 'granite');
    s.rock(38, 14, 0, 14, 22, 'granite');
    s.box(18, 20, 0, 14, 20, 1.8, 'dirt', { plain:true });
    return s;
  });
  reg('mountains', 'ir_glacier', 'Buzul', 'Glacier', function () {
    var s = S(); s.pad(22, 21, 38, 'ice');
    s.rock(20, 20, 0, 22, 22, 'ice');
    s.cone(30, 12, 12, 6, 14, 'ice');
    s.cone(10, 28, 10, 5, 12, 'ice');
    return s;
  });

  reg('forests', 'if_pine', 'Çam', 'Pine', function () {
    var s = S(); s.pad(11, 10, 18, 'grass'); s.tree(10, 9, 0, 36, 'pine', 'tileG'); return s;
  });
  reg('forests', 'if_pinegrove', 'Çamlık', 'Pine grove', function () {
    var s = S(); s.pad(18, 17, 30, 'grass');
    s.tree(8, 9, 0, 26, 'pine', 'tileG');
    s.tree(24, 14, 0, 30, 'pine', 'tileG');
    s.tree(14, 26, 0, 24, 'pine', 'tileG');
    return s;
  });
  reg('forests', 'if_oak', 'Meşe', 'Oak', function () {
    var s = S(); s.pad(12, 11, 20, 'grass'); s.tree(11, 10, 0, 34, 'round', 'grass'); return s;
  });
  reg('forests', 'if_grove', 'Koru', 'Grove', function () {
    var s = S(); s.pad(19, 18, 32, 'grass');
    s.tree(9, 10, 0, 26, 'round', 'grass');
    s.tree(26, 15, 0, 30, 'round', 'grass');
    s.tree(15, 28, 0, 24, 'round', 'tileG');
    return s;
  });
  reg('forests', 'if_deadwood', 'Kuru orman', 'Dead wood', function () {
    var s = S(); s.pad(18, 17, 30, 'dirt');
    s.cyl(9, 10, 0, 1.8, 22, 'woodD');
    s.cyl(24, 14, 0, 1.6, 18, 'woodD');
    s.cyl(15, 27, 0, 1.7, 20, 'woodD');
    return s;
  });
  reg('forests', 'if_stump', 'Kütük', 'Stump', function () {
    var s = S(); s.pad(11, 10, 18, 'dirt');
    s.cyl(10, 9, 0, 6, 6, 'woodD');
    return s;
  });

  /* ---------------------------------------------------------------
     HARABELER
     --------------------------------------------------------------- */
  reg('ruins', 'iu_ruinwall', 'Yıkık sur', 'Ruined wall', function () {
    var s = S(); s.pad(24, 20, 42, 'dirt');
    s.box(0, 8, 0, 12, 8, 14, 'ruin');
    s.box(14, 8, 0, 10, 8, 8, 'ruin');
    s.box(28, 8, 0, 14, 8, 12, 'ruin');
    s.rock(20, 28, 0, 6, 3, 'ruin');
    return s;
  });
  reg('ruins', 'iu_ruintower', 'Yıkık kule', 'Ruined tower', function () {
    var s = S(); s.pad(16, 15, 28, 'dirt');
    s.cyl(14, 13, 0, 9, 24, 'ruin', { slit:2 });
    s.box(5, 4, 24, 8, 8, 6, 'ruin');
    s.rock(26, 22, 0, 6, 3, 'ruin');
    return s;
  });
  reg('ruins', 'iu_ruincolumns', 'Sütunlar', 'Columns', function () {
    var s = S(); s.pad(22, 20, 38, 'stoneW');
    s.box(0, 0, 0, 42, 36, 3, 'stoneW', { plain:true });
    s.cyl(8, 8, 3, 3.4, 22, 'ruin');
    s.cyl(22, 8, 3, 3.4, 16, 'ruin');
    s.cyl(34, 8, 3, 3.4, 20, 'ruin');
    s.cyl(8, 26, 3, 3.4, 12, 'ruin');
    s.box(4, 4, 25, 34, 8, 4, 'ruin', { plain:true });
    return s;
  });
  reg('ruins', 'iu_ruinarch', 'Yıkık kemer', 'Ruined arch', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.box(2, 8, 0, 8, 10, 22, 'ruin');
    s.box(26, 8, 0, 8, 10, 18, 'ruin');
    s.box(0, 7, 22, 22, 12, 6, 'ruin');
    return s;
  });
  reg('ruins', 'iu_ruinvillage', 'Yıkık köy', 'Ruined village', function () {
    var s = S(); s.pad(22, 20, 38, 'dirt');
    s.box(2, 6, 0, 14, 11, 8, 'ruin');
    s.box(24, 4, 0, 12, 10, 5, 'ruin');
    s.box(12, 26, 0, 13, 10, 7, 'ruin');
    s.rock(38, 30, 0, 5, 3, 'ruin');
    return s;
  });

  /* ---------------------------------------------------------------
     KÜLTÜREL
     --------------------------------------------------------------- */
  reg('cultures', 'ix_longhouse', 'Longhouse', 'Longhouse', function () {
    var s = S(); s.pad(24, 18, 42, 'grass');
    longhouse(s, 2, 6, 44, 16, 13, 'wood', 'thatch');
    return s;
  });
  reg('cultures', 'ix_vikingvillage', 'Viking köyü', 'Viking village', function () {
    var s = S(); s.pad(26, 22, 46, 'grass');
    longhouse(s, 0, 6, 30, 13, 11, 'wood', 'thatch');
    longhouse(s, 6, 30, 26, 12, 10, 'wood', 'thatch');
    s.box(40, 12, 0, 5, 3, 18, 'granite');
    return s;
  });
  reg('cultures', 'ix_samurai', 'Samuray kalesi', 'Samurai castle', function () {
    var s = S(); s.pad(26, 24, 46, 'stoneW');
    s.box(0, 0, 0, 48, 44, 12, 'stoneW');
    s.box(10, 10, 12, 28, 24, 14, 'wood', { win:3 });
    s.pagoda(6, 6, 26, 36, 32, 10, 'tileD', 1);
    s.box(16, 15, 34, 16, 14, 11, 'wood', { win:2 });
    s.pagoda(12, 11, 43, 24, 22, 9, 'tileD', 1);
    return s;
  });
  reg('cultures', 'ix_desertfort', 'Çöl kalesi', 'Desert fort', function () {
    var s = S(); s.pad(26, 24, 46, 'stoneW');
    wall(s, 0, 0, 0, 48, 44, 16, 'stoneW');
    towerSq(s, -2, -2, 0, 12, 26, 'stoneW', { crenel:true });
    towerSq(s, 38, 34, 0, 12, 26, 'stoneW', { crenel:true });
    s.box(16, 16, 0, 16, 14, 20, 'stoneW', { win:2 });
    s.onion(24, 23, 20, 9, 12, 'gold');
    return s;
  });
  reg('cultures', 'ix_bedouin', 'Bedevi kampı', 'Bedouin camp', function () {
    var s = S(); s.pad(24, 20, 42, 'dirt');
    s.box(2, 8, 8, 22, 14, 1.6, 'canvasT', { plain:true });
    s.box(2, 8, 0, 1.6, 1.6, 8, 'woodD', { plain:true });
    s.box(22, 8, 0, 1.6, 1.6, 8, 'woodD', { plain:true });
    s.box(2, 20, 0, 1.6, 1.6, 8, 'woodD', { plain:true });
    s.box(22, 20, 0, 1.6, 1.6, 8, 'woodD', { plain:true });
    tent(s, 34, 28, 8, 11, 'canvasT');
    return s;
  });
  reg('cultures', 'ix_oasis', 'Vaha', 'Oasis', function () {
    var s = S(); s.pad(22, 21, 38, 'dirt');
    s.cyl(20, 19, 0, 12, 1.4, 'ice');
    s.cyl(6, 8, 0, 1.8, 18, 'woodD'); s.cone(6, 8, 18, 8, 7, 'tileG');
    s.cyl(34, 12, 0, 1.6, 15, 'woodD'); s.cone(34, 12, 15, 7, 6, 'tileG');
    tent(s, 32, 32, 7, 9, 'canvasT');
    return s;
  });
  reg('cultures', 'ix_arena', 'Arena', 'Arena', function () {
    var s = S(); s.pad(26, 25, 46, 'stoneW');
    s.cyl(24, 23, 0, 24, 12, 'stoneW', { slit:6 });
    s.cyl(24, 23, 12, 20, 3, 'dirt');
    return s;
  });
  reg('cultures', 'ix_forum', 'Forum', 'Forum', function () {
    var s = S(); s.pad(26, 24, 46, 'stoneW');
    s.box(0, 0, 0, 48, 44, 4, 'stoneW', { plain:true });
    var i;
    for (i = 0; i < 5; i++) s.cyl(6 + i * 9, 6, 4, 2.6, 20, 'stoneW');
    for (i = 0; i < 5; i++) s.cyl(6 + i * 9, 38, 4, 2.6, 20, 'stoneW');
    s.box(2, 2, 24, 44, 40, 3, 'stoneW', { plain:true });
    return s;
  });
  reg('cultures', 'ix_orcfort', 'Ork istihkâmı', 'Orc stronghold', function () {
    var s = S(); s.pad(26, 24, 46, 'dirt');
    s.palisade(0, 0, 0, 48, 42, 16, 'woodD');
    s.box(14, 14, 0, 18, 14, 12, 'woodD', { door:true });
    s.gable(12, 12, 12, 22, 18, 9, 'hide');
    s.box(4, 4, 0, 1.8, 1.8, 22, 'woodD', { plain:true });
    s.box(42, 4, 0, 1.8, 1.8, 20, 'woodD', { plain:true });
    return s;
  });
  reg('cultures', 'ix_teahouse', 'Çay evi', 'Tea house', function () {
    var s = S(); s.pad(16, 15, 28, 'grass');
    s.box(2, 4, 3, 22, 18, 10, 'wood', { door:true, win:2 });
    s.pagoda(0, 2, 13, 26, 22, 8, 'tileD', 1);
    s.box(3, 5, 0, 1.6, 1.6, 3, 'woodD', { plain:true });
    s.box(22, 5, 0, 1.6, 1.6, 3, 'woodD', { plain:true });
    return s;
  });

  /* ---------------------------------------------------------------
     GEÇİTLER / YOL
     --------------------------------------------------------------- */
  reg('passes', 'iq_bridge', 'Taş köprü', 'Stone bridge', function () {
    var s = S(); s.pad(26, 16, 46, 'stone');
    s.box(0, 8, 6, 52, 12, 5, 'stone', { plain:true });
    s.box(4, 8, 0, 8, 12, 6, 'stone');
    s.box(22, 8, 0, 8, 12, 6, 'stone');
    s.box(40, 8, 0, 8, 12, 6, 'stone');
    s.box(0, 8, 11, 52, 1.6, 3, 'stone', { plain:true });
    s.box(0, 18.4, 11, 52, 1.6, 3, 'stone', { plain:true });
    return s;
  });
  reg('passes', 'iq_woodbridge', 'Ahşap köprü', 'Wooden bridge', function () {
    var s = S(); s.pad(24, 14, 42, 'wood');
    s.box(0, 8, 5, 46, 10, 2.4, 'wood', { plain:true });
    s.box(6, 8, 0, 2.4, 10, 5, 'woodD', { plain:true });
    s.box(22, 8, 0, 2.4, 10, 5, 'woodD', { plain:true });
    s.box(38, 8, 0, 2.4, 10, 5, 'woodD', { plain:true });
    s.fence(0, 7, 7.4, 46, 2, 5, 'wood');
    return s;
  });
  reg('passes', 'iq_gate', 'Sınır kapısı', 'Border gate', function () {
    var s = S(); s.pad(22, 16, 38, 'dirt');
    towerSq(s, 0, 6, 0, 12, 22, 'stone', { roof:'tileR' });
    towerSq(s, 30, 6, 0, 12, 22, 'stone', { roof:'tileR' });
    s.box(12, 10, 0, 18, 4, 14, 'woodD');
    return s;
  });
  reg('passes', 'iq_milestone', 'Yol taşı', 'Milestone', function () {
    var s = S(); s.pad(10, 9, 16, 'dirt');
    s.box(7, 7, 0, 6, 5, 12, 'stoneW');
    s.cone(10, 9.5, 12, 3.4, 4, 'stoneW');
    return s;
  });
  reg('passes', 'iq_ford', 'Sığ geçit', 'Ford', function () {
    var s = S(); s.pad(22, 18, 38, 'dirt');
    s.box(0, 12, 0, 44, 12, 1.2, 'ice', { plain:true });
    s.rock(8, 10, 0, 4, 3, 'granite');
    s.rock(22, 26, 0, 4.5, 3, 'granite');
    s.rock(34, 12, 0, 4, 3, 'granite');
    return s;
  });

  global.IsoCatalog = { ITEMS:ITEMS };
})(window);
