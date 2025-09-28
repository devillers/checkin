import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY manquant');
}

const stripe = new Stripe(secretKey, {
  apiVersion: '2024-06-20',
});

export default stripe;
export { stripe };
