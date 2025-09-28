import { NextResponse } from 'next/server';
import { createCapturedDeposit, listDeposits } from '@/lib/deposits';
import logger from '@/lib/logger';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listDeposits({
      q: searchParams.get('q') || undefined,
      propertyId: searchParams.get('propertyId') || undefined,
      guestId: searchParams.get('guestId') || undefined,
      status: searchParams.get('status') || undefined,
      minAmount: searchParams.get('minAmount') || undefined,
      maxAmount: searchParams.get('maxAmount') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      expand: searchParams.get('expand') || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    logger.error('GET /api/deposits failed', error);
    return NextResponse.json({ error: error.message || 'Requête invalide' }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const deposit = await createCapturedDeposit(payload || {});
    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    logger.error('POST /api/deposits failed', error);
    return NextResponse.json({ error: error.message || 'Requête invalide' }, { status: 400 });
  }
}

/*
Exemple création d'un deposit :
fetch('/api/deposits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 50000,
    currency: 'eur',
    guestId: '<ObjectId guest>',
    propertyId: '<ObjectId property>',
    description: 'Deposit séjour Chalet ...',
    paymentMethodId: 'pm_***',
    // customerId: 'cus_***'
  })
});

Exemple de listing paginé avec expansions :
fetch('/api/deposits?status=captured&page=1&pageSize=20&expand=guest,property');
*/
