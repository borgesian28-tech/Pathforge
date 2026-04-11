import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    var body = await request.json();
    var customerId = body.customerId;

    if (!customerId) {
      return Response.json({ error: 'Missing customer ID' }, { status: 400 });
    }

    var session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.NEXT_PUBLIC_APP_URL || 'https://pathforge-omega.vercel.app',
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
