const CACHE = 'feriados-ar-v2';
const ASSETS = [
  '/holidays/',
  '/holidays/index.html',
  '/holidays/manifest.json',
  '/holidays/icons/icon-192.png',
  '/holidays/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap'
];

// ── INSTALL: cachear assets ────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar caches viejos ───────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first ─────────────────────────────────────────
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── FERIADOS DATA (copia del index.html para usar en SW) ───────
const FERIADOS = [
  { fecha: '2026-01-01', nombre: 'Año Nuevo' },
  { fecha: '2026-02-16', nombre: 'Carnaval' },
  { fecha: '2026-02-17', nombre: 'Carnaval' },
  { fecha: '2026-03-24', nombre: 'Día Nacional de la Memoria por la Verdad y la Justicia' },
  { fecha: '2026-04-02', nombre: 'Día del Veterano y de los Caídos en la Guerra de Malvinas' },
  { fecha: '2026-04-03', nombre: 'Viernes Santo' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajador' },
  { fecha: '2026-05-25', nombre: 'Día de la Revolución de Mayo' },
  { fecha: '2026-06-15', nombre: 'Paso a la Inmortalidad del Gral. Martín M. de Güemes' },
  { fecha: '2026-06-20', nombre: 'Paso a la Inmortalidad del Gral. Manuel Belgrano' },
  { fecha: '2026-07-09', nombre: 'Día de la Independencia' },
  { fecha: '2026-08-17', nombre: 'Paso a la Inmortalidad del Gral. José de San Martín' },
  { fecha: '2026-10-12', nombre: 'Día del Respeto a la Diversidad Cultural' },
  { fecha: '2026-11-23', nombre: 'Día de la Soberanía Nacional' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción de María' },
  { fecha: '2026-12-25', nombre: 'Navidad' },
];

const parseDate = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); };
const DIAS_S = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES_F = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const fmtFull = d => `${DIAS_S[d.getDay()]} ${d.getDate()} de ${MESES_F[d.getMonth()]}`;

// ── SYNC PERIÓDICO: revisar feriados cada día ──────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-feriados') {
    e.waitUntil(checkAndNotify());
  }
});

// ── PUSH NOTIFICATION desde servidor (si se integra luego) ─────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || '📅 Feriado próximo', {
      body: data.body || '',
      icon: '/holidays/icons/icon-192.png',
      badge: '/holidays/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'feriado',
      renotify: true
    })
  );
});

// ── AL CLICK EN LA NOTIFICACIÓN ────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/holidays/');
    })
  );
});

// ── CHECK DIARIO (llamado desde la app o por periodicsync) ─────
async function checkAndNotify() {
  const now = new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const f of FERIADOS) {
    const d = parseDate(f.fecha);
    const diff = Math.round((d - hoy) / 86400000);

    if (diff === 5) {
      await self.registration.showNotification('📅 Feriado en 5 días', {
        body: `${f.nombre}\n${fmtFull(d)}`,
        icon: '/holidays/icons/icon-192.png',
        badge: '/holidays/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: `feriado-${f.fecha}`,
        data: { fecha: f.fecha }
      });
    }

    if (diff === 0) {
      await self.registration.showNotification('🎉 ¡Hoy es feriado!', {
        body: `${f.nombre} — ¡A descansar!`,
        icon: '/holidays/icons/icon-192.png',
        badge: '/holidays/icons/icon-192.png',
        vibrate: [300, 100, 300, 100, 300],
        tag: `feriado-hoy-${f.fecha}`,
      });
    }
  }
}
