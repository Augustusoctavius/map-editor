/* ============================================================
   Wayborne Map Editor — sw.js
   Çevrimdışı önbellek: uygulama zaten hiç ağ isteği yapmıyor,
   bu worker onu bir kez açıldıktan sonra internetsiz de
   çalışır hâle getiriyor. Kurulabilir uygulama (manifest/install
   prompt) değil — sadece önbellek.
   ============================================================ */
'use strict';

var CACHE = 'wayborne-v1';

var ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/toolbar.css',
  './css/canvas.css',
  './css/shell.css',
  './js/iso.js',
  './js/catalog.js',
  './js/catalog2.js',
  './js/symbols.js',
  './js/i18n-names.js',
  './js/names.js',
  './js/history.js',
  './js/layers.js',
  './js/canvas.js',
  './js/tools.js',
  './js/export.js',
  './js/ui.js',
  './js/app.js'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Önbellek-öncelikli: önce yerelden sun, arka planda ağdan tazele.
   Ağ hatası (çevrimdışı) durumunda önbellek zaten cevabı vermiş olur. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var network = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          caches.open(CACHE).then(function (c) { c.put(e.request, res.clone()); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
