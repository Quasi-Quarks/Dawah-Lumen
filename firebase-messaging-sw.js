// /Dawah-Lumen/firebase-messaging-sw.js
/* iOS/Safari-friendly FCM service worker
   - Works for Safari 16.4+ (including installed PWA)
   - Avoids duplicate notifications (let FCM display when a notification payload is present)
   - Focuses existing tab/app window or opens your app on click
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

// --- constants used for fallback data-only messages ---
const APP_URL = 'https://quasi-quarks.github.io/Dawah-Lumen/';
const ICON   = '/Dawah-Lumen/icons/icon-192.png';   // better than favicon for iOS
const BADGE  = '/Dawah-Lumen/icons/icon-192.png';   // Safari ignores "badge", but harmless

// Ensure the new SW takes control immediately (helps iOS PWA updates)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// If FCM sends a *notification* payload, the browser shows it automatically.
// We only show our own when it's *data-only* to prevent duplicates.
messaging.onBackgroundMessage((payload) => {
  // If a notification payload exists, do nothing (avoid duplicate)
  if (payload && payload.notification) {
    // console.log('[sw] Notification payload present: letting FCM display it.');
    return;
  }

  // Handle data-only payloads
  const title = (payload?.data?.title) || 'New message';
  const body  = (payload?.data?.body)  || '';
  const url   = (payload?.data?.url)   || APP_URL;

  self.registration.showNotification(title, {
    body,
    icon: ICON,
    badge: BADGE,
    data: { url },
  });
});

// Focus an existing window or open a new one on click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || APP_URL;

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of allClients) {
      if (c.url.includes('/Dawah-Lumen/') && 'focus' in c) {
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});

// Optional: track dismissals (handy for debugging, doesn’t affect UX)
self.addEventListener('notificationclose', () => {
  // console.log('[sw] notification closed');
});
