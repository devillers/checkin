import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request, { params }) {
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

    const inventory = await db.collection('inventories').findOne({
      id: inventoryId,
      userId: user.id
    });

    if (!inventory) {
      return NextResponse.json(
        { message: "Inventaire introuvable" },
        { status: 404 }
      );
    }

    const { _id, ...inventoryData } = inventory;

    const [property, guest] = await Promise.all([
      inventory.propertyId
        ? db.collection('properties').findOne({
            id: inventory.propertyId,
            userId: user.id
          })
        : Promise.resolve(null),
      inventory.guestId
        ? db.collection('guests').findOne({
            id: inventory.guestId,
            userId: user.id
          })
        : Promise.resolve(null)
    ]);

    const responseData = {
      ...inventoryData,
      propertyName: property?.name || null,
      propertyAddress: property?.address || null,
      guest: guest
        ? {
            id: guest.id,
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email || null,
            phone: guest.phone || null
          }
        : null,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json(
      { message: error.message || "Erreur lors de la récupération de l'inventaire" },
      {
        status:
          error.message === 'Invalid token' || error.message === 'No token provided'
            ? 401
            : 500
      }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);
    const inventoryId = params?.id;

    if (!inventoryId) {
      return NextResponse.json(
        { message: "Identifiant d'inventaire requis" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { propertyId, guestId, type, description, dueDate, rooms, status } = data;

    if (!propertyId || !type) {
      return NextResponse.json(
        { message: 'PropertyId et type sont requis' },
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

    const property = await db.collection('properties').findOne({
      id: propertyId,
      userId: user.id
    });

    if (!property) {
      return NextResponse.json(
        { message: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    const updatePayload = {
      propertyId,
      guestId: guestId || null,
      type,
      description: description?.trim() || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      rooms: Array.isArray(rooms) ? rooms : [],
      status: status || existingInventory.status,
      updatedAt: new Date()
    };

    await db.collection('inventories').updateOne(
      { id: inventoryId, userId: user.id },
      { $set: updatePayload }
    );

    const updatedInventory = await db.collection('inventories').findOne({
      id: inventoryId,
      userId: user.id
    });

    const { _id, ...inventoryData } = updatedInventory;

    const [updatedProperty, guest] = await Promise.all([
      db.collection('properties').findOne({
        id: inventoryData.propertyId,
        userId: user.id
      }),
      inventoryData.guestId
        ? db.collection('guests').findOne({
            id: inventoryData.guestId,
            userId: user.id
          })
        : Promise.resolve(null)
    ]);

    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId: user.id,
      type: 'inventory',
      action: 'updated',
      details: {
        inventoryId,
        propertyId: inventoryData.propertyId,
        propertyName: updatedProperty?.name || null,
        type: inventoryData.type
      },
      timestamp: new Date()
    });

    const responseData = {
      ...inventoryData,
      propertyName: updatedProperty?.name || null,
      propertyAddress: updatedProperty?.address || null,
      guest: guest
        ? {
            id: guest.id,
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email || null,
            phone: guest.phone || null
          }
        : null,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Inventory PUT error:', error);
    return NextResponse.json(
      { message: error.message || "Erreur lors de la mise à jour de l'inventaire" },
      {
        status:
          error.message === 'Invalid token' || error.message === 'No token provided'
            ? 401
            : 500
      }
    );
  }
}
