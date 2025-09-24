import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { validateAndNormalizePropertyPayload } from '../utils';

function normalizeSettingsPayload(settings = {}, existingSettings = {}) {
  const {
    autoCheckIn,
    requireDeposit,
    depositAmount,
    cleaningFee,
    accessCode,
    checkInTime,
    checkOutTime
  } = settings;

  const normalized = {};

  if (autoCheckIn !== undefined) {
    normalized.autoCheckIn = Boolean(autoCheckIn);
  }

  if (requireDeposit !== undefined) {
    normalized.requireDeposit = Boolean(requireDeposit);
  }

  if (depositAmount !== undefined) {
    const amount = parseFloat(depositAmount);
    if (Number.isNaN(amount) || amount < 0) {
      return {
        errorResponse: NextResponse.json(
          { message: 'Le montant de dépôt doit être un nombre positif ou nul' },
          { status: 400 }
        )
      };
    }
    normalized.depositAmount = amount;
  }

  if (cleaningFee !== undefined) {
    const fee = parseFloat(cleaningFee);
    if (Number.isNaN(fee) || fee < 0) {
      return {
        errorResponse: NextResponse.json(
          { message: 'Les frais de ménage doivent être un nombre positif ou nul' },
          { status: 400 }
        )
      };
    }
    normalized.cleaningFee = fee;
  }

  if (accessCode !== undefined) {
    normalized.accessCode = String(accessCode).trim();
  }

  if (checkInTime !== undefined) {
    normalized.checkInTime = String(checkInTime);
  }

  if (checkOutTime !== undefined) {
    normalized.checkOutTime = String(checkOutTime);
  }

  if (Object.keys(normalized).length === 0) {
    return { normalizedSettings: existingSettings };
  }

  return {
    normalizedSettings: {
      ...existingSettings,
      ...normalized
    }
  };
}

export async function GET(request, { params }) {
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

    const property = await db.collection('properties').findOne({ id, userId: user.id });

    if (!property) {
      return NextResponse.json(
        { message: 'Propriété introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Property GET error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération de la propriété' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}

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

    const { db } = await connectDB();

    const existingProperty = await db.collection('properties').findOne({ id, userId: user.id });

    if (!existingProperty) {
      return NextResponse.json(
        { message: 'Propriété introuvable' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { settings, ...propertyData } = data || {};

    let updatePayload = {};

    if (Object.keys(propertyData).length > 0) {
      const { errorResponse, normalizedData } = validateAndNormalizePropertyPayload(propertyData);

      if (errorResponse) {
        return errorResponse;
      }

      updatePayload = { ...updatePayload, ...normalizedData };
    }

    if (settings !== undefined) {
      const { errorResponse, normalizedSettings } = normalizeSettingsPayload(
        settings,
        existingProperty.settings || {}
      );

      if (errorResponse) {
        return errorResponse;
      }

      updatePayload = { ...updatePayload, settings: normalizedSettings };
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { message: "Aucune donnée valide fournie pour la mise à jour" },
        { status: 400 }
      );
    }

    const updateResult = await db.collection('properties').findOneAndUpdate(
      { id, userId: user.id },
      {
        $set: {
          ...updatePayload,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    const updatedProperty = updateResult?.value ?? updateResult;

    if (!updatedProperty) {
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
        propertyName: updatedProperty.name ?? existingProperty.name ?? ''
      },
      timestamp: new Date()
    });

    return NextResponse.json(updatedProperty);
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
