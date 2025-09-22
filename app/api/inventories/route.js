import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const { db } = await connectDB();

    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const guestId = searchParams.get('guestId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build query
    let query = { userId: user.id };
    
    if (propertyId) query.propertyId = propertyId;
    if (guestId) query.guestId = guestId;
    if (status) query.status = status;
    if (type) query.type = type;

    // Get inventories with property and guest information
    const inventories = await db.collection('inventories').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'properties',
          localField: 'propertyId',
          foreignField: 'id',
          as: 'property'
        }
      },
      {
        $lookup: {
          from: 'guests',
          localField: 'guestId',
          foreignField: 'id',
          as: 'guest'
        }
      },
      {
        $project: {
          id: 1,
          type: 1,
          status: 1,
          progress: 1,
          createdAt: 1,
          updatedAt: 1,
          dueDate: 1,
          completedAt: 1,
          description: 1,
          roomsCount: { $size: { $ifNull: ['$rooms', []] } },
          itemsCount: {
            $sum: {
              $map: {
                input: { $ifNull: ['$rooms', []] },
                as: 'room',
                in: { $size: { $ifNull: ['$$room.items', []] } }
              }
            }
          },
          issuesCount: {
            $sum: {
              $map: {
                input: { $ifNull: ['$rooms', []] },
                as: 'room',
                in: {
                  $size: {
                    $filter: {
                      input: { $ifNull: ['$$room.items', []] },
                      as: 'item',
                      cond: { $lt: ['$$item.condition', 4] }
                    }
                  }
                }
              }
            }
          },
          propertyName: { $arrayElemAt: ['$property.name', 0] },
          guestName: { 
            $concat: [
              { $arrayElemAt: ['$guest.firstName', 0] }, 
              ' ', 
              { $arrayElemAt: ['$guest.lastName', 0] }
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    return NextResponse.json(inventories);

  } catch (error) {
    console.error('Inventories GET error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération des inventaires' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const data = await request.json();
    const { db } = await connectDB();

    const { propertyId, guestId, type, description, dueDate, rooms } = data;

    // Validate required fields
    if (!propertyId || !type) {
      return NextResponse.json(
        { message: 'PropertyId et type sont requis' },
        { status: 400 }
      );
    }

    // Verify property belongs to user
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

    const inventoryId = uuidv4();

    const inventory = {
      id: inventoryId,
      userId: user.id,
      propertyId,
      guestId: guestId || null,
      type, // checkin, checkout
      status: 'pending',
      description: description?.trim() || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      rooms: rooms || [],
      progress: 0,
      qrCodeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inventory/${inventoryId}/fill`,
      signature: null,
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    };

    const result = await db.collection('inventories').insertOne(inventory);

    // Log activity
    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId: user.id,
      type: 'inventory',
      action: 'created',
      details: {
        inventoryId: inventoryId,
        propertyId: propertyId,
        propertyName: property.name,
        type: type
      },
      timestamp: new Date()
    });

    return NextResponse.json(inventory, { status: 201 });

  } catch (error) {
    console.error('Inventories POST error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la création de l\'inventaire' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}