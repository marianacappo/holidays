// sw.js — Service Worker con soporte de Push Notifications reales
const CACHE   = 'feriados-ar-v3';
const ASSETS  = [
  '/holidays/',
  '/holidays/index.html',
  '/holidays/manifest.json',
  '/holidays/icons/icon-192.png',
  '/holidays/icons/icon-512.png',
];

// ── INSTALL ────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ───────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first ─────────────────────────────────────────
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── PUSH: recibe notificaciones del servidor Vercel ────────────
self.addEventListener('push', e => {
  let data = { title: '📅 Feriados AR', body: 'Revisá los próximos feriados', url: '/holidays/' };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch(_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/holidays/icons/icon-192.png',
      badge:   '/holidays/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag:     'feriado',
      renotify: true,
      data:    { url: data.url }
    })
  );
});

// ── CLICK en notificación: abrir la app ───────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/holidays/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('/holidays/') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
