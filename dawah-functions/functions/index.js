// functions/index.js — Firebase Functions v2 + Firestore onCreate
const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();
const db = admin.firestore();

exports.notifyOnNewMessage = onDocumentCreated(
  { region: 'us-central1' },       // keep us-central1
  'messages/{id}',
  async (event) => {
    try {
      // v2: the QueryDocumentSnapshot is on event.data
      const snap = event.data;
      if (!snap) {
        console.log('No snapshot on event');
        return;
      }

      const m = snap.data(); // { username, chat, createdAt }
      console.log('New message payload:', m);

      const tokenSnap = await db.collection('tokens').limit(500).get();
      const tokens = tokenSnap.docs.map(d => d.data().token).filter(Boolean);
      console.log('Token count:', tokens.length);
      if (!tokens.length) return;

      // Web Push payload for browsers
      const msg = {
        webpush: {
          notification: {
            title: `${m.username} says:`,
            body: (m.chat || '').slice(0, 160),
            icon: 'https://quasi-quarks.github.io/Dawah-Lumen/favicon.ico'
          },
          fcmOptions: { link: 'https://quasi-quarks.github.io/Dawah-Lumen/' }
        },
        tokens
      };

      const res = await admin.messaging().sendEachForMulticast(msg);
      console.log('Push sent:', res.successCount, 'success,', res.failureCount, 'failed');
      res.responses.forEach((r, i) => {
        if (!r.success) console.log('Token error', i, r.error?.message);
      });
    } catch (err) {
      console.error('notifyOnNewMessage error:', err);
    }
  }
);
