// firebase-messaging-sw.js (must be served at /Dawah-Lumen/firebase-messaging-sw.js)
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js');

// Use the same config (Analytics not needed here)
firebase.initializeApp({
  apiKey: "AIzaSyDOZU1AJi7ONWlKYgiIJXWoj7X8VAoZ9rM",
  authDomain: "dawah-lumen-v1.firebaseapp.com",
  projectId: "dawah-lumen-v1",
  storageBucket: "dawah-lumen-v1.firebasestorage.app",
  messagingSenderId: "796313906776",
  appId: "1:796313906776:web:045884e106cf4ee5f2e42d"
});

const messaging = firebase.messaging();

// Background notifications (tab closed)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New message';
  const options = {
    body: payload.notification?.body || '',
    // For a project site, prefix with the repo folder:
    icon: '/Dawah-Lumen/favicon.ico'
  };
  self.registration.showNotification(title, options);
});
