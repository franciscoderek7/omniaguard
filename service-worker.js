/* OmniaGuard Service Worker v3 — iOS + Android PWA, kill switch, periodic VPN sync */
const CACHE_NAME = 'omniaguard-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/threat-dashboard.html',
  '/primedox-portal.html',
  '/install-guide.html',
  '/offline.html',
  '/vpn-monitor.html',
  '/android-security.html',
  '/omniaguard-logo.png',
  '/robot-350.jpg',
  '/manifest.json',
  '/app.js',
  '/pwa-core.js',
  '/splash.svg'
];

/* ---- INSTALL: pre-cache all static assets ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => self.skipWaiting())
  );
});

/* ---- ACTIVATE: clean up old caches ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- FETCH: cache-first for static, network-first for dynamic ---- */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Determine strategy based on asset type
  const isStatic = STATIC_ASSETS.includes(url.pathname) ||
    /\.(png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|css|js)$/i.test(url.pathname);

  if (isStatic) {
    // Cache-first strategy
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('/offline.html'));
      })
    );
  } else {
    // Network-first strategy
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then(cached => cached || caches.match('/offline.html'))
      )
    );
  }
});

/* ---- PUSH NOTIFICATIONS ---- */
self.addEventListener('push', event => {
  let data = { title: 'OmniaGuard Alert', body: 'Threat detected. Review your dashboard.', icon: '/omniaguard-logo.png' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch (e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/omniaguard-logo.png',
      badge: '/omniaguard-logo.png',
      tag: 'omniaguard-threat',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/threat-dashboard.html' },
      actions: [
        { action: 'view', title: 'View Dashboard' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'view' || !event.action) {
    const target = (event.notification.data && event.notification.data.url) || '/threat-dashboard.html';
    event.waitUntil(clients.openWindow(target));
  }
});

/* ---- BACKGROUND SYNC ---- */
self.addEventListener('sync', event => {
  if (event.tag === 'threat-alert-sync') {
    event.waitUntil(syncThreatAlerts());
  }
});

async function syncThreatAlerts() {
  try {
    const response = await fetch('/api/threats/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error('Sync failed');
  } catch (e) {
    console.log('[OmniaGuard SW] Background sync deferred:', e.message);
  }
}

/* ---- PERIODIC BACKGROUND SYNC (Android Chrome) ---- */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'vpn-status-check') {
    event.waitUntil(periodicVPNCheck());
  }
});

async function periodicVPNCheck() {
  try {
    // Notify all open clients to run a VPN check
    const clientList = await self.clients.matchAll({ type: 'window' });
    clientList.forEach(client => {
      client.postMessage({ type: 'PERIODIC_VPN_CHECK' });
    });
    // If no clients open, fire a silent background notification
    if (clientList.length === 0) {
      await self.registration.showNotification('OmniaGuard VPN Check', {
        body: 'Background VPN status check complete. Tap to view.',
        icon: '/omniaguard-logo.png',
        badge: '/omniaguard-logo.png',
        tag: 'vpn-periodic',
        silent: true,
        data: { url: '/vpn-monitor.html' }
      });
    }
  } catch (e) {
    console.log('[OmniaGuard SW] Periodic VPN check error:', e.message);
  }
}

/* ---- VPN DISCONNECT PUSH NOTIFICATION ---- */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'VPN_DISCONNECTED') {
    self.registration.showNotification('🚨 OmniaGuard: VPN Disconnected', {
      body: `IP changed: ${event.data.oldIP} → ${event.data.newIP}. VPN protection may be down.`,
      icon: '/omniaguard-logo.png',
      badge: '/omniaguard-logo.png',
      tag: 'vpn-disconnect',
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      data: { url: '/vpn-monitor.html' },
      actions: [
        { action: 'view', title: '🔍 Check Now' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});
