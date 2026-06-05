var CACHE_NAME = 'kilimowise-v1';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/advisor.html',
  '/budget.html',
  '/insights.html',
  '/css/style.css',
  '/js/i18n.js',
  '/js/utils.js',
  '/js/api.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/advisor.js',
  '/js/budget.js',
  '/js/insights.js',
  '/config.js',
  '/manifest.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (response) {
        return caches.open(CACHE_NAME).then(function (cache) {
          if (event.request.method === 'GET' && response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    }).catch(function () {
      return caches.match('/index.html');
    })
  );
});
