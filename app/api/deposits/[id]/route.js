import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollections } from '@/lib/mongo';
import { deleteDeposit, refundDeposit } from '@/lib/deposits';
import logger from '@/lib/logger';

function serialize(doc) {
  if (!doc) return null;
  return {
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
}

export async function GET(_request, { params }) {
  try {
    const depositId = params.id;
    if (!depositId || !ObjectId.isValid(depositId)) {
      return NextResponse.json({ error: 'Deposit introuvable' }, { status: 404 });
    }
    const { deposits } = await getCollections();
    const deposit = await deposits.findOne({ _id: new ObjectId(depositId) });
    if (!deposit) {
      return NextResponse.json({ error: 'Deposit introuvable' }, { status: 404 });
    }
    return NextResponse.json(serialize(deposit));
  } catch (error) {
    logger.error(`GET /api/deposits/${params.id} failed`, error);
    return NextResponse.json({ error: error.message || 'Requête invalide' }, { status: 400 });
  }
}

export async function POST(request, { params }) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action !== 'refund') {
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
    const payload = await request.json();
    const result = await refundDeposit({ depositId: params.id, ...(payload || {}) });
    return NextResponse.json(result);
  } catch (error) {
    logger.error(`POST /api/deposits/${params.id} failed`, error);
    return NextResponse.json({ error: error.message || 'Requête invalide' }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const result = await deleteDeposit({ depositId: params.id });
    return NextResponse.json(result);
  } catch (error) {
    logger.error(`DELETE /api/deposits/${params.id} failed`, error);
    return NextResponse.json({ error: error.message || 'Requête invalide' }, { status: 400 });
  }
}

/*
Rembourser partiellement un deposit :
fetch('/api/deposits/64f...abc?action=refund', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 20000, reason: 'Fin de séjour' })
});
*/
