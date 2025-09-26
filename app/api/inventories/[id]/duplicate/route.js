import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);
    const inventoryId = params?.id;

    if (!inventoryId) {
      return NextResponse.json(
        { message: "Identifiant d'inventaire requis" },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    const existingInventory = await db.collection('inventories').findOne({
      id: inventoryId,
      userId: user.id
    });

    if (!existingInventory) {
      return NextResponse.json(
        { message: "Inventaire introuvable" },
        { status: 404 }
      );
    }

    const newInventoryId = uuidv4();
    const now = new Date();
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`;

    const {
      _id,
      rooms: existingRooms = [],
      photos: existingPhotos = [],
      ...inventoryData
    } = existingInventory;

    const clonedRooms = Array.isArray(existingRooms)
      ? existingRooms.map((room) => ({
          ...room,
          items: Array.isArray(room.items)
            ? room.items.map((item) => ({ ...item }))
            : []
        }))
      : [];

    const duplicatedInventory = {
      ...inventoryData,
      id: newInventoryId,
      status: 'pending',
      progress: 0,
      qrCodeUrl: `${baseUrl}/dashboard/inventory/${newInventoryId}/fill`,
      signature: null,
      photos: Array.isArray(existingPhotos) ? [...existingPhotos] : [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      rooms: clonedRooms
    };

    await db.collection('inventories').insertOne(duplicatedInventory);

    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId: user.id,
      type: 'inventory',
      action: 'duplicated',
      details: {
        sourceInventoryId: inventoryId,
        newInventoryId,
        propertyId: duplicatedInventory.propertyId,
        type: duplicatedInventory.type
      },
      timestamp: now
    });

    return NextResponse.json(duplicatedInventory, { status: 201 });
  } catch (error) {
    console.error('Inventory duplicate error:', error);
    return NextResponse.json(
      { message: error.message || "Erreur lors de la duplication de l'inventaire" },
      {
        status:
          error.message === 'Invalid token' || error.message === 'No token provided'
            ? 401
            : 500
      }
    );
  }
}
