// Service worker: keeps the app's own files available offline.
// F1 data is not cached here – js/api.js already keeps it in localStorage.
//
// Strategy: stale-while-revalidate. A file is answered from the cache at once
// and refreshed from the network in the background, so an update shows up on
// the next visit. Bump CACHE when the list of files changes.
const CACHE = 'pitlane-v2';

const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/fonts.css',
  'css/style.css',
  'js/app.js',
  'js/router.js',
  'js/api.js',
  'js/utils.js',
  'js/status.js',
  'js/skeleton.js',
  'js/sessions.js',
  'js/tabs.js',
  'js/teams.js',
  'js/ics.js',
  'js/views/pitwall.js',
  'js/views/calendar.js',
  'js/views/results.js',
  'js/views/standings.js',
  'js/views/records.js',
  'js/views/weekend.js',
  'js/views/driver.js',
  'js/views/team.js',
  'data/champions.json',
  'fonts/barlow-400-latin.woff2',
  'fonts/barlow-500-latin.woff2',
  'fonts/barlow-600-latin.woff2',
  'fonts/barlow-700-latin.woff2',
  'fonts/bebas-neue-400-latin.woff2',
  'icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

// remove caches from older versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // only the app's own files; API calls go straight to the network
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(request, { ignoreSearch: true });
    const fresh = fetch(request)
      .then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(() => cached);
    if (cached) {
      event.waitUntil(fresh);
      return cached;
    }
    return fresh;
  }));
});
