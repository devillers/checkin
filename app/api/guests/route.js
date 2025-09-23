import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { requireAuth, generateAccessCode } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { buildGuestDocument } from '@/lib/models/guest';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const { db } = await connectDB();

    const guests = await db.collection('guests')
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(guests);

  } catch (error) {
    console.error('Guests GET error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération des guests' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const data = await request.json();
    const { db } = await connectDB();

    const {
      firstName,
      lastName,
      email,
      phone,
      language = 'fr',
      nationality,
      dateOfBirth,
      address,
      emergencyContact,
      temporaryPassword,
      temporaryAccountExpiresAt,
      guidebookId,
      depositAmount,
      depositCurrency = 'EUR'
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'Prénom, nom et email sont requis' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    if (temporaryPassword && temporaryPassword.length < 8) {
      return NextResponse.json(
        { message: 'Le mot de passe invité doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const normalizedDepositAmount = Number(depositAmount ?? 0);
    if (Number.isNaN(normalizedDepositAmount) || normalizedDepositAmount < 0) {
      return NextResponse.json(
        { message: 'Le montant de la caution ne peut pas être négatif' },
        { status: 400 }
      );
    }

    const guestId = uuidv4();
    const temporaryPasswordHash = temporaryPassword
      ? await bcrypt.hash(temporaryPassword, 12)
      : null;

    const currency = typeof depositCurrency === 'string'
      ? depositCurrency.trim().toUpperCase() || 'EUR'
      : 'EUR';

    const guest = buildGuestDocument({
      id: guestId,
      userId: user.id,
      firstName,
      lastName,
      email,
      phone,
      language,
      nationality,
      dateOfBirth,
      address,
      emergencyContact,
      accessCode: generateAccessCode(),
      account: {
        email,
        passwordHash: temporaryPasswordHash,
        expiresAt: temporaryAccountExpiresAt ? new Date(temporaryAccountExpiresAt) : null
      },
      guidebook: {
        guidebookId: guidebookId || null
      },
      deposit: {
        amount: normalizedDepositAmount,
        currency
      }
    });

    // Check if guest with same email already exists for this user
    const existingGuest = await db.collection('guests').findOne({
      userId: user.id,
      email: guest.email
    });

    if (existingGuest) {
      return NextResponse.json(
        { message: 'Un guest avec cet email existe déjà' },
        { status: 409 }
      );
    }

    await db.collection('guests').insertOne(guest);

    const { passwordHash, ...account } = guest.account;
    const guestResponse = {
      ...guest,
      account
    };

    // Log activity
    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId: user.id,
      type: 'guest',
      action: 'added',
      details: {
        guestId: guestId,
        guestName: `${guest.firstName} ${guest.lastName}`,
        email: guest.email
      },
      timestamp: new Date()
    });

    return NextResponse.json(guestResponse, { status: 201 });

  } catch (error) {
    console.error('Guests POST error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la création du guest' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}