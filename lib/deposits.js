import { ObjectId } from 'mongodb';
import { getCollections } from './mongo';
import stripe from './stripe';
// import logger from './logger';

function ensureObjectId(value, errorMessage) {
  if (!value || !ObjectId.isValid(value)) {
    throw new Error(errorMessage);
  }
  return new ObjectId(value);
}

function serializeDeposit(doc) {
  if (!doc) return null;
  const serialized = {
    ...doc,
    _id: doc._id?.toString(),
    guest_id: doc.guest_id ? doc.guest_id.toString() : null,
    property_id: doc.property_id ? doc.property_id.toString() : null,
    refunds: Array.isArray(doc.refunds)
      ? doc.refunds.map((entry) => ({
          ...entry,
          created_at: entry.created_at instanceof Date ? entry.created_at.toISOString() : entry.created_at,
        }))
      : [],
    created_at: doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at,
    updated_at: doc.updated_at instanceof Date ? doc.updated_at.toISOString() : doc.updated_at,
  };
  if (doc.guest && doc.guest._id) {
    serialized.guest = {
      ...doc.guest,
      _id: doc.guest._id.toString(),
    };
  }
  if (doc.property && doc.property._id) {
    serialized.property = {
      ...doc.property,
      _id: doc.property._id.toString(),
    };
  }
  return serialized;
}

export async function assertRefs({ guestId, propertyId }) {
  const { guests, properties } = await getCollections();
  const guestObjectId = ensureObjectId(guestId, 'Guest introuvable');
  const propertyObjectId = ensureObjectId(propertyId, 'Property introuvable');

  const [guest, property] = await Promise.all([
    guests.findOne({ _id: guestObjectId }, { projection: { _id: 1 } }),
    properties.findOne({ _id: propertyObjectId }, { projection: { _id: 1 } }),
  ]);

  if (!guest) {
    throw new Error('Guest introuvable');
  }

  if (!property) {
    throw new Error('Property introuvable');
  }

  return { guestObjectId, propertyObjectId };
}

export async function createCapturedDeposit({
  amount,
  currency = 'eur',
  guestId,
  propertyId,
  description = '',
  paymentMethodId,
  customerId,
}) {
  if (!amount || Number(amount) <= 0) {
    throw new Error('Montant invalide');
  }

  if (!paymentMethodId) {
    throw new Error('paymentMethodId requis');
  }

  const normalizedAmount = Math.round(Number(amount));
  const { guestObjectId, propertyObjectId } = await assertRefs({ guestId, propertyId });

  const paymentIntentPayload = {
    amount: normalizedAmount,
    currency,
    confirm: true,
    capture_method: 'automatic',
    payment_method: paymentMethodId,
    description: description || undefined,
  };

  if (customerId) {
    paymentIntentPayload.customer = customerId;
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload);
  const chargeId = paymentIntent.latest_charge || (paymentIntent.charges?.data?.[0]?.id ?? null);

  const now = new Date();
  const depositDocument = {
    amount: normalizedAmount,
    currency,
    status: 'captured',
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: chargeId,
    property_id: propertyObjectId,
    guest_id: guestObjectId,
    description: description || '',
    created_at: now,
    updated_at: now,
    refunds: [],
    refundable_remaining: normalizedAmount,
  };

  const { deposits } = await getCollections();
  const insertResult = await deposits.insertOne(depositDocument);

  return serializeDeposit({ ...depositDocument, _id: insertResult.insertedId });
}

export async function refundDeposit({ depositId, amount, reason }) {
  const { deposits } = await getCollections();
  const targetId = ensureObjectId(depositId, 'Deposit introuvable');
  const deposit = await deposits.findOne({ _id: targetId });

  if (!deposit) {
    throw new Error('Deposit introuvable');
  }

  if (!deposit.refundable_remaining || deposit.refundable_remaining <= 0) {
    throw new Error('Plus rien à rembourser');
  }

  const refundAmount = amount != null ? Math.round(Number(amount)) : deposit.refundable_remaining;

  if (!refundAmount || refundAmount <= 0 || refundAmount > deposit.refundable_remaining) {
    throw new Error('Montant invalide');
  }

  const refund = await stripe.refunds.create({
    charge: deposit.stripe_charge_id,
    amount: refundAmount,
    reason: reason || undefined,
  });

  const remaining = Math.max(0, deposit.refundable_remaining - refundAmount);
  const status = remaining === 0 ? 'refunded' : 'partially_refunded';
  const refundEntry = {
    stripe_refund_id: refund.id,
    amount: refundAmount,
    reason: reason || null,
    created_at: refund.created ? new Date(refund.created * 1000) : new Date(),
  };

  await deposits.updateOne(
    { _id: targetId },
    {
      $set: {
        refundable_remaining: remaining,
        status,
        updated_at: new Date(),
      },
      $push: { refunds: refundEntry },
    }
  );

  return { ok: true, refund_id: refund.id, refundable_remaining: remaining, status };
}

export async function listDeposits({
  q,
  propertyId,
  guestId,
  status,
  minAmount,
  maxAmount,
  dateFrom,
  dateTo,
  page = 1,
  pageSize = 20,
  expand,
} = {}) {
  const { deposits } = await getCollections();
  const filter = {};

  if (q) {
    filter.description = { $regex: q, $options: 'i' };
  }

  if (propertyId) {
    filter.property_id = ensureObjectId(propertyId, 'Property introuvable');
  }

  if (guestId) {
    filter.guest_id = ensureObjectId(guestId, 'Guest introuvable');
  }

  if (status) {
    filter.status = status;
  }

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) {
      filter.amount.$gte = Math.round(Number(minAmount));
    }
    if (maxAmount) {
      filter.amount.$lte = Math.round(Number(maxAmount));
    }
  }

  if (dateFrom || dateTo) {
    filter.created_at = {};
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!Number.isNaN(fromDate.getTime())) {
        filter.created_at.$gte = fromDate;
      }
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      if (!Number.isNaN(toDate.getTime())) {
        filter.created_at.$lte = toDate;
      }
    }
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safePageSize = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const skip = (safePage - 1) * safePageSize;

  const expandSet = new Set();
  if (typeof expand === 'string') {
    expand
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => expandSet.add(item));
  }

  const pipeline = [{ $match: filter }, { $sort: { created_at: -1 } }, { $skip: skip }, { $limit: safePageSize }];

  if (expandSet.has('guest')) {
    pipeline.push(
      {
        $lookup: {
          from: 'guests',
          localField: 'guest_id',
          foreignField: '_id',
          as: 'guest_data',
        },
      },
      {
        $unwind: {
          path: '$guest_data',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          guest: '$guest_data',
          guest_name: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$guest_data.first_name', ''] },
                  ' ',
                  { $ifNull: ['$guest_data.last_name', ''] },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          guest_data: 0,
        },
      }
    );
  }

  if (expandSet.has('property')) {
    pipeline.push(
      {
        $lookup: {
          from: 'properties',
          localField: 'property_id',
          foreignField: '_id',
          as: 'property_data',
        },
      },
      {
        $unwind: {
          path: '$property_data',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          property: '$property_data',
          property_title: '$property_data.title',
        },
      },
      {
        $project: {
          property_data: 0,
        },
      }
    );
  }

  const [items, total] = await Promise.all([
    deposits.aggregate(pipeline).toArray(),
    deposits.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

  return {
    items: items.map(serializeDeposit),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}

export async function deleteDeposit({ depositId }) {
  const { deposits } = await getCollections();
  const targetId = ensureObjectId(depositId, 'Deposit introuvable');
  await deposits.deleteOne({ _id: targetId });
  return { ok: true };
}
