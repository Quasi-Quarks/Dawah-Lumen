// /Dawah-Lumen/firebase-messaging-sw.js
/* iOS/Safari-friendly FCM service worker
   - Safari 16.4+ (also works when installed to Home Screen)
   - Avoids duplicate notifications (let FCM render when notification payload exists)
   - Focuses an existing tab/app window or opens the app on click
*/

importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDOZU1AJi7ONWlKYgiIJXWoj7X8VAoZ9rM",
  authDomain: "dawah-lumen-v1.firebaseapp.com",
  projectId: "dawah-lumen-v1",
  storageBucket: "dawah-lumen-v1.firebasestorage.app",
  messagingSenderId: "796313906776",
  appId: "1:796313906776:web:045884e106cf4ee5f2e42d"
});

const messaging = firebase.messaging();

// --- constants for data-only fallback ---
const APP_URL = 'https://quasi-quarks.github.io/Dawah-Lumen/';
const ICON    = '/Dawah-Lumen/icons/icon-192.png'; // better than favicon on iOS
const BADGE   = '/Dawah-Lumen/icons/icon-192.png'; // Safari ignores but harmless

// Take over immediately (helps iOS PWAs update without manual refresh)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evt) => evt.waitUntil(self.clients.claim()));

// If FCM includes a notification payload, browser shows it by itself.
// We only render our own for data-only payloads to avoid duplicates.
messaging.onBackgroundMessage((payload) => {
  try {
    if (payload && payload.notification) {
      // Let FCM/browser handle it to prevent double notifications.
      return;
    }

    const title = (payload?.data?.title) || 'New message';
    const body  = (payload?.data?.body)  || '';
    const url   = (payload?.data?.url)   || APP_URL;

    self.registration.showNotification(title, {
      body,
      icon: ICON,
      badge: BADGE,
      data: { url },
    });
  } catch (err) {
    // Swallow errors quietly; notification rendering should never crash the SW.
    // console.error('[sw] onBackgroundMessage error', err);
  }
});

// Extra safety: some environments may fire a raw 'push' with JSON data.
// If the browser already showed a notification (via FCM), this won't run;
// if it's data-only, we render similarly to the handler above.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json?.() ?? {};
    if (data?.notification) {
      // Browser will have shown it already.
      return;
    }
    const title = (data?.data?.title) || data.title || 'New message';
    const body  = (data?.data?.body)  || data.body  || '';
    const url   = (data?.data?.url)   || data.url   || APP_URL;

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: ICON,
        badge: BADGE,
        data: { url },
      })
    );
  } catch {
    // Ignore malformed payloads
  }
});

// Focus an existing window or open a new one on click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || APP_URL;

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of allClients) {
      // Match by path segment so it works from the GitHub Pages project path
      if (c.url.includes('/Dawah-Lumen/') && 'focus' in c) {
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});

// Optional: debug hook
self.addEventListener('notificationclose', () => {
  // console.log('[sw] notification closed');
});
