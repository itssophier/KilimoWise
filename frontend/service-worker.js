/* =====================================================================
   KiliMoWise service worker
   - App shell: cache-first, versioned
   - Same-origin GET: stale-while-revalidate
   - Cross-origin (GraphQL): network-first, fallback to cache
   - Navigation: network-first, fallback to offline.html
   ===================================================================== */

var VERSION = 'v1.0.0';
var SHELL_CACHE = 'kmw-shell-' + VERSION;
var ASSET_CACHE = 'kmw-assets-' + VERSION;
var API_CACHE = 'kmw-api-' + VERSION;

var SHELL_ASSETS = [
  './',
  './index.html',
  './login.html',
  './advisor.html',
  './budget.html',
  './insights.html',
  './profile.html',
  './offline.html',
  './404.html',
  './manifest.json',
  './config.js',
  './css/tokens.css',
  './css/app.css',
  './js/icons.js',
  './js/i18n.js',
  './js/utils.js',
  './js/api.js',
  './js/auth.js',
  './js/ui.js',
  './js/shell.js',
  './js/dashboard.js',
  './js/advisor.js',
  './js/budget.js',
  './js/insights.js',
  './icons/icon.svg',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return cache.addAll(SHELL_ASSETS).then(function () { return self.skipWaiting(); });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k.indexOf('kmw-') === 0 && k !== SHELL_CACHE && k !== ASSET_CACHE && k !== API_CACHE; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isHtmlRequest(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').indexOf('text/html') !== -1);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  var isSameOrigin = url.origin === self.location.origin;
  var isApi = isSameOrigin && url.pathname.indexOf('/graphql') !== -1;
  var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  var isCdn = url.hostname === 'cdn.jsdelivr.net';

  // ---- GraphQL / API: network-first, fallback cache, no offline page ----
  if (isApi) {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(API_CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) { return cached || new Response(JSON.stringify({ errors: [{ message: 'offline' }] }), { status: 503, headers: { 'Content-Type': 'application/json' } }); });
      })
    );
    return;
  }

  // ---- HTML navigation: network-first, fallback to shell, fallback to offline ----
  if (isHtmlRequest(req)) {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(SHELL_CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          if (cached) return cached;
          return caches.match('./offline.html') || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // ---- Static assets: stale-while-revalidate ----
  if (isSameOrigin || isFont || isCdn) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        var fetchPromise = fetch(req).then(function (res) {
          if (res.ok) {
            var copy = res.clone();
            var target = isSameOrigin ? ASSET_CACHE : (isFont ? ASSET_CACHE : ASSET_CACHE);
            caches.open(ASSET_CACHE).then(function (cache) { cache.put(req, copy); });
          }
          return res;
        }).catch(function () { return cached; });
        return cached || fetchPromise;
      })
    );
  }
});
