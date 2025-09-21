/**
 * Firebase Functions (Gen-2) — push notify on new chat message
 * Node.js 20/22
 *
 * Trigger: Firestore onCreate at collection "messages"
 * Payload saved by your site: { username, chat, createdAt }
 *
 * Sends Web Push (FCM) to all tokens stored under collection "tokens"
 * Each token doc: { token: string, createdAt: serverTimestamp() }
 */

const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

// ---------- Init ----------
admin.initializeApp();
const db = admin.firestore();

// Small helper: chunk an array into groups of N (FCM limit is 500 per multicast)
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// Remove invalid tokens after a send
async function cleanupBadTokens(tokens, responses) {
  const batch = db.batch();
  let removed = 0;

  responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code || r.error?.errorInfo?.code;
      // Common invalid/expired token signals from FCM:
      const fatal =
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token';

      if (fatal) {
        const badToken = tokens[i];
        // Find the doc by token (each doc stores {token})
        // NOTE: if tokens collection is large, consider caching a map from token->docId
        // or storing docId=token to skip this query.
        batch.delete(db.collection('tokens').doc(badToken.__docId));
        removed++;
      }
    }
  });

  if (removed) {
    await batch.commit();
    console.log('[notify] cleaned up invalid tokens:', removed);
  }
}

// Load up to N tokens, attaching their docId so we can delete quickly
async function loadTokens(limit = 2000) {
  const snap = await db.collection('tokens').limit(limit).get();
  const list = [];
  snap.forEach((doc) => {
    const data = doc.data();
    if (data?.token) {
      // attach doc id so we can delete quickly without an extra query
      data.__docId = doc.id;
      list.push(data);
    }
  });
  return list;
}

// ------------- Trigger -------------
exports.notifyOnNewMessage = onDocumentCreated(
  {
    region: 'us-central1',
    document: 'messages/{id}', // IMPORTANT: path goes inside options in Gen-2
    // You can also set memory/timeout if you want:
    // memory: '256MiB',
    // timeoutSeconds: 30,
  },
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) {
        console.log('[notify] No snapshot on event');
        return;
      }

      const m = snap.data(); // { username, chat, createdAt }
      const username = (m?.username || 'Someone').toString();
      const body = (m?.chat || '').toString().slice(0, 300);

      console.log('[notify] New message:', { username, bodyLen: body.length });

      // Load tokens
      const tokenDocs = await loadTokens(5000); // raise if you expect more devices
      const tokens = tokenDocs.map((t) => t.token);
      console.log('[notify] Token count:', tokens.length);

      if (!tokens.length) {
        console.log('[notify] No tokens; skipping send.');
        return;
      }

      // Build message (webpush + notification fallback)
      const title = `${username} says:`;
      const icon =
        'https://quasi-quarks.github.io/Dawah-Lumen/favicon.ico'; // ensure this exists

      // FCM allows up to 500 tokens per multicast
      const groups = chunk(tokenDocs, 500);

      let totalSuccess = 0;
      let totalFailure = 0;

      for (const group of groups) {
        const groupTokens = group.map((g) => g.token);

        const msg = {
          notification: { title, body }, // fallback for some browsers
          webpush: {
            notification: { title, body, icon },
            fcmOptions: { link: 'https://quasi-quarks.github.io/Dawah-Lumen/' },
          },
          tokens: groupTokens,
        };

        const res = await admin.messaging().sendEachForMulticast(msg);
        totalSuccess += res.successCount;
        totalFailure += res.failureCount;

        // Attach docIds so we can delete bad ones fast
        res.responses.forEach((r, i) => {
          if (!r.success) {
            console.log(
              '[notify] token error:',
              groupTokens[i].slice(0, 12) + '…',
              r.error?.code || r.error?.message
            );
          }
          // copy docId to the token position for cleanup
          groupTokens[i].__docId = group[i].__docId;
        });

        await cleanupBadTokens(groupTokens, res.responses);
      }

      console.log(
        `[notify] Done. Sent: ${totalSuccess} success, ${totalFailure} failed.`
      );
    } catch (err) {
      console.error('[notify] Uncaught error:', err);
    }
  }
);
