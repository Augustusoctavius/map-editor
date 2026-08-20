/* ============================================================
   Wayborne — names.js
   Fantastik yer adı üreteci. Hece tabanlı, sözlük yok: her kültür
   kendi ses dağarcığından (onset / nucleus / coda) ad kurar, sonra
   coğrafi türe göre ek/önek alır. Harici veri veya bağımlılık yok.

   Kültür kimlikleri catalog2.js'teki CIVIC_CULTURE ile aynı ruhu
   taşır (batı / akdeniz / kuzey / doğu / taş) ve ırk mimarisiyle
   uyumlu üç fantastik kültür eklenir.
   ============================================================ */
(function (global) {
  'use strict';

  /* Her kültür: bas (başlangıç sesleri), orta (çekirdek), son (bitiş),
     bag (heceler arası bağlayıcı, opsiyonel). */
  var CULTURES = {
    western: {
      tr:'Batı', en:'Western',
      bas:['Ash','Black','Bram','Cald','Dun','East','Fal','Gar','Green','Hal','Kend','Mar','North','Oak','Red','Stone','Thorn','Weald','Wold','Wyn'],
      orta:['a','e','i','o','u','ae','ea'],
      son:['bury','cross','dale','fell','ford','gate','hold','mere','moor','ridge','shire','stead','thorpe','ton','vale','wick','worth'],
      birlesik: true
    },
    med: {
      tr:'Akdeniz', en:'Mediterranean',
      bas:['Al','Bar','Cast','Cor','Fen','Lor','Mal','Mer','Nov','Ol','Port','Rav','Sal','Sier','Tal','Val','Ver'],
      orta:['a','e','i','o','ia','io','ei'],
      son:['ana','ara','ella','enna','ino','ola','oro','osa','ura','vera','anza','etto'],
      birlesik: false
    },
    north: {
      tr:'Kuzey', en:'Northern',
      bas:['Ang','Bjor','Drang','Eld','Fross','Grim','Hald','Ís','Jarn','Kald','Mor','Nord','Rag','Skar','Thor','Ulf','Var'],
      orta:['a','o','u','au','ei','y'],
      son:['berg','fjell','gard','heim','holm','marr','nes','rok','stad','strand','vik','ström','dal'],
      birlesik: true
    },
    east: {
      tr:'Doğu', en:'Eastern',
      bas:['Ak','Bey','Çağ','Der','Er','Gök','Han','Kar','Kız','Lal','Mer','Oğ','Sar','Şeh','Tan','Yıl','Zer'],
      orta:['a','e','ı','i','u','ü','ay','ey'],
      son:['abad','bahçe','han','kent','köy','pınar','saray','tepe','yurt','ova','kale','dere'],
      birlesik: true
    },
    stone: {
      tr:'Taş', en:'Stonefolk',
      bas:['Bar','Dor','Dur','Grun','Kaz','Khar','Mor','Nul','Thar','Thrum','Uld','Vor','Zar'],
      orta:['a','o','u','ai','uu'],
      son:['dun','dûm','gost','grim','hal','kar','mar','nak','rim','thek','vald','zad'],
      birlesik: false
    },
    sylvan: {
      tr:'Orman halkı', en:'Sylvan',
      bas:['Ael','Cel','El','Fae','Gal','Il','Lae','Lor','Mith','Nae','Ryl','Sil','Thal','Vael','Yl'],
      orta:['a','e','i','ae','ia','ie','ye'],
      son:['dor','lian','loth','mar','nor','rien','riel','thil','wen','wyn','ael','ith'],
      birlesik: false
    },
    savage: {
      tr:'Yaban', en:'Savage',
      bas:['Brak','Drok','Gash','Gor','Grum','Kra','Mog','Nar','Rak','Skul','Thok','Ug','Vrag','Zug'],
      orta:['a','o','u','aa','uu'],
      son:['dar','gash','grot','kar','mash','nak','rok','shak','thar','ug','zul','drak'],
      birlesik: false
    }
  };

  /* Coğrafi türe göre süsleme. {on:[], ard:[]} — biri seçilir ya da
     hiçbiri (sade ad). tr/en ayrı, çünkü bunlar gerçek kelimeler. */
  var FEATURES = {
    settlement: { tr:{on:[], ard:[]}, en:{on:[], ard:[]} },
    city:       { tr:{on:[], ard:[' Şehri',' Kenti']},          en:{on:[], ard:[' City']} },
    river:      { tr:{on:[], ard:[' Irmağı',' Deresi',' Suyu']},en:{on:[], ard:[' River',' Brook']} },
    mountain:   { tr:{on:[], ard:[' Dağı',' Sırtı',' Zirvesi']},en:{on:[], ard:[' Peak',' Ridge',' Mount']} },
    forest:     { tr:{on:[], ard:[' Ormanı',' Korusu']},        en:{on:[], ard:[' Wood',' Forest']} },
    region:     { tr:{on:[], ard:[' Diyarı',' Toprakları',' Bölgesi']}, en:{on:[], ard:[' Lands',' Reach',' March']} },
    sea:        { tr:{on:[], ard:[' Denizi',' Körfezi',' Boğazı']},     en:{on:[], ard:[' Sea',' Gulf',' Strait']} },
    lake:       { tr:{on:[], ard:[' Gölü']},                    en:{on:[], ard:[' Lake',' Mere']} }
  };

  function pick(a, rnd) { return a[Math.floor(rnd() * a.length)]; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* Tohumlanabilir üreteç: aynı tohum aynı adı verir (test edilebilirlik) */
  function rngFrom(seed) {
    if (seed === undefined || seed === null) return Math.random;
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* Tek bir kök ad üretir (coğrafi ek olmadan) */
  function stem(cultureKey, rnd) {
    var c = CULTURES[cultureKey] || CULTURES.western;
    var a = pick(c.bas, rnd);
    var b = pick(c.son, rnd);
    if (c.birlesik) {
      /* birleşik adlar: "Ashford", "Nordvik" — çekirdek sesi araya girmez */
      return cap(a) + b;
    }
    /* akıcı adlar: araya bir çekirdek ses girer — "Valeria", "Mithriel" */
    var m = pick(c.orta, rnd);
    var joined = cap(a) + m + b;
    return joined.replace(/([aeiouıüö])\1+/gi, '$1');   /* üçlü sesli yığılmasını sadeleştir */
  }

  var Names = {
    CULTURES: CULTURES,

    cultureList: function (lang) {
      return Object.keys(CULTURES).map(function (k) {
        return { key:k, name: (lang === 'tr' ? CULTURES[k].tr : CULTURES[k].en) };
      });
    },

    featureList: function () { return Object.keys(FEATURES); },

    /* Bir ad üret. feature: settlement/city/river/mountain/forest/region/sea/lake */
    generate: function (cultureKey, feature, lang, seed) {
      var rnd = rngFrom(seed);
      var base = stem(cultureKey, rnd);
      var f = FEATURES[feature] || FEATURES.settlement;
      var loc = f[lang === 'tr' ? 'tr' : 'en'] || f.en;
      var suf = loc.ard.length ? pick(loc.ard, rnd) : '';
      var pre = loc.on.length  ? pick(loc.on,  rnd) : '';
      return pre + base + suf;
    },

    /* n farklı ad — aynı adın tekrarı elenerek */
    generateMany: function (cultureKey, feature, lang, n, seed) {
      var out = [], seen = {}, rnd = rngFrom(seed), guard = 0;
      while (out.length < n && guard++ < n * 40) {
        var s = this.generate(cultureKey, feature, lang, Math.floor(rnd() * 1e9));
        if (!seen[s]) { seen[s] = 1; out.push(s); }
      }
      return out;
    }
  };

  global.Names = Names;
})(window);
