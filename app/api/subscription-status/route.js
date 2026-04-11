import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

var adminDb = getFirestore();

export async function POST(request) {
  try {
    var body = await request.json();
    var userId = body.userId;

    if (!userId) {
      return Response.json({ tier: 'free', status: null });
    }

    var docRef = adminDb.collection('users').doc(userId);
    var snap = await docRef.get();

    if (snap.exists) {
      var data = snap.data();
      var sub = data.subscription;
      if (sub && sub.status === 'active') {
        return Response.json({
          tier: sub.tier || 'student',
          status: 'active',
          customerId: sub.stripeCustomerId,
          currentPeriodEnd: sub.currentPeriodEnd,
        });
      }
    }

    return Response.json({ tier: 'free', status: null });
  } catch (err) {
    console.error('Subscription status error:', err);
    return Response.json({ tier: 'free', status: null });
  }
}
