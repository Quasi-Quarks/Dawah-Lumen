// firebase-messaging-sw.js (must be at /Dawah-Lumen/firebase-messaging-sw.js)
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js');

console.log('[sw] loading...');

firebase.initializeApp({
  apiKey: "AIzaSyDOZU1AJi7ONWlKYgiIJXWoj7X8VAoZ9rM",
  authDomain: "dawah-lumen-v1.firebaseapp.com",
  projectId: "dawah-lumen-v1",
  storageBucket: "dawah-lumen-v1.firebasestorage.app",
  messagingSenderId: "796313906776",
  appId: "1:796313906776:web:045884e106cf4ee5f2e42d"
});

const messaging = firebase.messaging();
console.log('[sw] messaging initialized');

// Called when a message arrives and the page is in the background
messaging.onBackgroundMessage((payload) => {
  console.log('[sw] onBackgroundMessage', payload);
  const title = payload.notification?.title || 'New message';
  const options = {
    body: payload.notification?.body || '',
    icon: '/Dawah-Lumen/favicon.ico', // ensure this exists or replace with a valid icon
    data: { url: (payload.fcmOptions && payload.fcmOptions.link) || 'https://quasi-quarks.github.io/Dawah-Lumen/' }
  };
  self.registration.showNotification(title, options);
});

// Make clicks open/focus the chat
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || 'https://quasi-quarks.github.io/Dawah-Lumen/';
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if (client.url.includes('/Dawah-Lumen/') && 'focus' in client) {
        return client.focus();
      }
    }
    return clients.openWindow(url);
  })());
});
