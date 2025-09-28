import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { getCollections } from '@/lib/mongo';
import logger from '@/lib/logger';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET manquant');
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const config = { api: { bodyParser: false } }; // Node runtime dans Next 15 conserve request.text() intact

async function syncRefundedCharge(charge) {
  const { deposits } = await getCollections();
  const deposit = await deposits.findOne({ stripe_charge_id: charge.id });
  if (!deposit) {
    return;
  }

  const refunds = Array.isArray(charge.refunds?.data)
    ? charge.refunds.data.map((refund) => ({
        stripe_refund_id: refund.id,
        amount: refund.amount,
        reason: refund.reason || null,
        created_at: refund.created ? new Date(refund.created * 1000) : new Date(),
      }))
    : deposit.refunds;

  const refundableRemaining = Math.max(0, deposit.amount - (charge.amount_refunded || 0));
  let status = deposit.status;
  if (refundableRemaining === 0) {
    status = 'refunded';
  } else if (refundableRemaining < deposit.amount) {
    status = 'partially_refunded';
  }

  await deposits.updateOne(
    { _id: deposit._id },
    {
      $set: {
        refundable_remaining: refundableRemaining,
        status,
        refunds,
        updated_at: new Date(),
      },
    }
  );
}

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  const payload = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logger.error('Webhook Stripe invalide', error);
    return NextResponse.json({ error: `Webhook invalide: ${error.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'charge.refunded':
        await syncRefundedCharge(event.data.object);
        break;
      case 'payment_intent.succeeded':
        // Synchronisation optionnelle si nécessaire
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Traitement webhook Stripe échoué', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}
