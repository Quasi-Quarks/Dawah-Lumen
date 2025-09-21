// functions/index.js — Gen-2 (v2) Firestore trigger + web-push payload + debug logs
const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();
const db = admin.firestore();

exports.notifyOnNewMessage = onDocumentCreated(
  { region: 'us-central1' },
  'messages/{id}',
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) { console.log('No snapshot on event'); return; }

      const m = snap.data();  // { username, chat, createdAt }
      console.log('New message payload:', m);

      const tokenSnap = await db.collection('tokens').limit(500).get();
      const tokens = tokenSnap.docs.map(d => d.data().token).filter(Boolean);
      const masked = tokens.map(t => (t || '').slice(0, 10) + '…');
      console.log('Token count:', tokens.length, masked);

      if (!tokens.length) { console.log('No tokens to send'); return; }

      const title = `${m.username} says:`;
      const body  = (m.chat || '').slice(0, 160);
      const icon  = 'https://quasi-quarks.github.io/Dawah-Lumen/favicon.ico'; // ensure exists or swap

      const msg = {
        notification: { title, body },              // fallback for some UAs
        webpush: {
          notification: { title, body, icon },
          fcmOptions:   { link: 'https://quasi-quarks.github.io/Dawah-Lumen/' }
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
