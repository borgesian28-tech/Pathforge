import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    var body = await request.json();
    var priceId = body.priceId;
    var userId = body.userId;
    var userEmail = body.userEmail;

    if (!priceId) {
      return Response.json({ error: 'Missing price ID' }, { status: 400 });
    }

    var sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: (process.env.NEXT_PUBLIC_APP_URL || 'https://pathforge-omega.vercel.app') + '/?success=true',
      cancel_url: (process.env.NEXT_PUBLIC_APP_URL || 'https://pathforge-omega.vercel.app') + '/?canceled=true',
      allow_promotion_codes: true,
    };

    if (userEmail) {
      sessionConfig.customer_email = userEmail;
    }

    if (userId) {
      sessionConfig.metadata = { firebaseUid: userId };
      sessionConfig.subscription_data = { metadata: { firebaseUid: userId } };
    }

    var session = await stripe.checkout.sessions.create(sessionConfig);

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
