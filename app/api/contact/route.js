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
    var name = (body.name || '').trim();
    var email = (body.email || '').trim().toLowerCase();
    var subject = (body.subject || '').trim();
    var message = (body.message || '').trim();

    if (!name || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    await adminDb.collection('contact_messages').add({
      name,
      email,
      subject: subject || 'General question',
      message,
      createdAt: new Date().toISOString(),
      read: false,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Contact route error:', err);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
