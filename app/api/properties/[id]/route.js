import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { validateAndNormalizePropertyPayload } from '../utils';

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);
    const { id } = params || {};

    if (!id) {
      return NextResponse.json(
        { message: 'Identifiant de propriété manquant' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { errorResponse, normalizedData } = validateAndNormalizePropertyPayload(data);

    if (errorResponse) {
      return errorResponse;
    }

    const { db } = await connectDB();

    const updateResult = await db.collection('properties').findOneAndUpdate(
      { id, userId: user.id },
      {
        $set: {
          ...normalizedData,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!updateResult.value) {
      return NextResponse.json(
        { message: 'Propriété introuvable' },
        { status: 404 }
      );
    }

    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId: user.id,
      type: 'property',
      action: 'updated',
      details: {
        propertyId: id,
        propertyName: updateResult.value.name
      },
      timestamp: new Date()
    });

    return NextResponse.json(updateResult.value);
  } catch (error) {
    console.error('Property PUT error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la mise à jour de la propriété' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);
    const { id } = params || {};

    if (!id) {
      return NextResponse.json(
        { message: 'Identifiant de propriété manquant' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    const deleteResult = await db.collection('properties').findOneAndDelete({ id, userId: user.id });

    if (!deleteResult.value) {
      return NextResponse.json(
        { message: 'Propriété introuvable' },
        { status: 404 }
      );
    }

    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId: user.id,
      type: 'property',
      action: 'deleted',
      details: {
        propertyId: id,
        propertyName: deleteResult.value.name
      },
      timestamp: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Property DELETE error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la suppression de la propriété' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}
