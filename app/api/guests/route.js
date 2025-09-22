import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth, generateAccessCode } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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
      emergencyContact
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

    const guestId = uuidv4();

    const guest = {
      id: guestId,
      userId: user.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      phone: phone?.trim() || '',
      language,
      nationality: nationality?.trim() || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address: address ? {
        street: address.street?.trim() || '',
        city: address.city?.trim() || '',
        zipCode: address.zipCode?.trim() || '',
        country: address.country?.trim() || ''
      } : null,
      emergencyContact: emergencyContact ? {
        name: emergencyContact.name?.trim() || '',
        phone: emergencyContact.phone?.trim() || '',
        relation: emergencyContact.relation?.trim() || ''
      } : null,
      accessCode: generateAccessCode(),
      status: 'active',
      preferences: {
        communication: 'email',
        notifications: true
      },
      stats: {
        totalStays: 0,
        totalSpent: 0,
        averageRating: 0,
        lastStay: null
      },
      notes: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

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

    const result = await db.collection('guests').insertOne(guest);

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

    return NextResponse.json(guest, { status: 201 });

  } catch (error) {
    console.error('Guests POST error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la création du guest' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}