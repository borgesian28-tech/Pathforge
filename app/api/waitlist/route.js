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
    var email = (body.email || '').trim().toLowerCase();
    var plan = body.plan || 'general';

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Store in waitlist collection
    var docId = email.replace(/[^a-zA-Z0-9]/g, '_');
    await adminDb.collection('waitlist').doc(docId).set({
      email: email,
      plan: plan,
      joinedAt: new Date().toISOString(),
      source: 'website',
    }, { merge: true });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Waitlist error:', err);
    return Response.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }
}
