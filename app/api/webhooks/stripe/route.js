import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin (server-side)
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

var PRICE_TO_TIER = {
  'price_1TL79YLKCFxaSE7TdYrpy40U': 'student',
  'price_1TL79xLKCFxaSE7TNalXHXjm': 'student',
  'price_1TL7AJLKCFxaSE7TXw3pEI2R': 'premium',
  'price_1TL7AZLKCFxaSE7TSFHzy09N': 'premium',
};

export async function POST(request) {
  var body = await request.text();
  var sig = request.headers.get('stripe-signature');

  var event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook Error: ' + err.message, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      var session = event.data.object;
      var firebaseUid = session.metadata && session.metadata.firebaseUid;
      var customerId = session.customer;
      var subscriptionId = session.subscription;

      if (firebaseUid && subscriptionId) {
        // Get subscription details to determine tier
        var subscription = await stripe.subscriptions.retrieve(subscriptionId);
        var priceId = subscription.items.data[0].price.id;
        var tier = PRICE_TO_TIER[priceId] || 'student';

        await adminDb.collection('users').doc(firebaseUid).set({
          subscription: {
            status: 'active',
            tier: tier,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            priceId: priceId,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }, { merge: true });

        console.log('Subscription activated:', firebaseUid, tier);
      }
    }

    if (event.type === 'customer.subscription.updated') {
      var subscription = event.data.object;
      var firebaseUid = subscription.metadata && subscription.metadata.firebaseUid;
      
      if (!firebaseUid) {
        // Try to find user by customer ID
        var snapshot = await adminDb.collection('users')
          .where('subscription.stripeCustomerId', '==', subscription.customer)
          .limit(1).get();
        if (!snapshot.empty) {
          firebaseUid = snapshot.docs[0].id;
        }
      }

      if (firebaseUid) {
        var priceId = subscription.items.data[0].price.id;
        var tier = PRICE_TO_TIER[priceId] || 'student';
        var status = subscription.status;

        await adminDb.collection('users').doc(firebaseUid).set({
          subscription: {
            status: status === 'active' || status === 'trialing' ? 'active' : status,
            tier: tier,
            priceId: priceId,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }, { merge: true });

        console.log('Subscription updated:', firebaseUid, tier, status);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      var subscription = event.data.object;
      var firebaseUid = subscription.metadata && subscription.metadata.firebaseUid;

      if (!firebaseUid) {
        var snapshot = await adminDb.collection('users')
          .where('subscription.stripeCustomerId', '==', subscription.customer)
          .limit(1).get();
        if (!snapshot.empty) {
          firebaseUid = snapshot.docs[0].id;
        }
      }

      if (firebaseUid) {
        await adminDb.collection('users').doc(firebaseUid).set({
          subscription: {
            status: 'canceled',
            tier: 'free',
            updatedAt: new Date().toISOString(),
          },
        }, { merge: true });

        console.log('Subscription canceled:', firebaseUid);
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  return new Response('OK', { status: 200 });
}
