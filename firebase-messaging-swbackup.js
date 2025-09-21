// firebase-messaging-sw.js
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

// If the message already has a notification payload, FCM will show it.
// Avoid calling showNotification yourself to prevent duplicates.
messaging.onBackgroundMessage((payload) => {
  if (payload && payload.notification) {
    // Skip custom display to avoid double notifications.
    console.log('[sw] Skipping showNotification (notification payload present).');
    return;
  }
  // Only handle data-only messages yourself:
  const title = (payload?.data?.title) || 'New message';
  const body  = (payload?.data?.body)  || '';
  self.registration.showNotification(title, {
    body,
    icon: '/Dawah-Lumen/favicon.ico',
    data: { url: 'https://quasi-quarks.github.io/Dawah-Lumen/' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || 'https://quasi-quarks.github.io/Dawah-Lumen/';
  event.waitUntil((async () => {
    const clientsArr = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clientsArr) {
      if (c.url.includes('/Dawah-Lumen/') && 'focus' in c) return c.focus();
    }
    return clients.openWindow(url);
  })());
});
