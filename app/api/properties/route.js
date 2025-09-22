import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const { db } = await connectDB();

    const properties = await db.collection('properties')
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(properties);

  } catch (error) {
    console.error('Properties GET error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération des propriétés' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const data = await request.json();
    const { db } = await connectDB();

    const { name, address, description, type, maxGuests, bedrooms, bathrooms, amenities } = data;

    // Validate required fields
    if (!name || !address || !type || !maxGuests) {
      return NextResponse.json(
        { message: 'Nom, adresse, type et nombre max d\'invités sont requis' },
        { status: 400 }
      );
    }

    const propertyId = uuidv4();

    const property = {
      id: propertyId,
      userId: user.id,
      name: name.trim(),
      address: address.trim(),
      description: description?.trim() || '',
      type, // apartment, house, studio, etc.
      maxGuests: parseInt(maxGuests),
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      amenities: amenities || [],
      status: 'active',
      settings: {
        autoCheckIn: true,
        requireDeposit: true,
        depositAmount: 300,
        cleaningFee: 50,
        accessCode: generateAccessCode(),
        checkInTime: '15:00',
        checkOutTime: '11:00'
      },
      stats: {
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        occupancyRate: 0
      },
      lastMaintenance: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('properties').insertOne(property);

    // Log activity
    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId: user.id,
      type: 'property',
      action: 'created',
      details: {
        propertyId: propertyId,
        propertyName: property.name
      },
      timestamp: new Date()
    });

    return NextResponse.json(property, { status: 201 });

  } catch (error) {
    console.error('Properties POST error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la création de la propriété' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}

function generateAccessCode() {
  return Math.random().toString().slice(-6);
}