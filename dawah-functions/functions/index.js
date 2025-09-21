// functions/index.js (Firebase Functions v2)
const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();
const db = admin.firestore();

// Use a region that works well with Firestore & Eventarc defaults.
// us-central1 is the safest default for 2nd-gen.
exports.notifyOnNewMessage = onDocumentCreated(
  { region: 'us-central1' },          // <- important
  'messages/{id}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const m = snap.data(); // { username, chat, createdAt }

    const tokenSnap = await db.collection('tokens').limit(500).get();
    const tokens = tokenSnap.docs.map(d => d.data().token).filter(Boolean);
    if (!tokens.length) return;

    const message = {
      notification: {
        title: `${m.username} says:`,
        body: (m.chat || '').slice(0, 160),
      },
      tokens,
    };

    const res = await admin.messaging().sendEachForMulticast(message);
    console.log('Push sent:', res.successCount, 'success,', res.failureCount, 'failed');
  }
);
