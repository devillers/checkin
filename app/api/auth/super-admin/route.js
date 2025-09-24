import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { connectDB } from '@/lib/mongodb';
import { buildSuperAdminUserDocument } from '@/lib/models/user';

const SETUP_TOKEN = process.env.SUPERADMIN_SETUP_TOKEN;

const payloadSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  newsletter: z.boolean().optional().default(false)
});

function extractToken(request, payloadToken) {
  if (!SETUP_TOKEN) {
    throw new Error('SETUP_TOKEN_MISSING');
  }

  const providedToken =
    (typeof payloadToken === 'string' && payloadToken) ||
    request.headers.get('x-setup-token') ||
    request.headers.get('X-Setup-Token') ||
    request.headers.get('authorization');

  if (!providedToken) {
    return null;
  }

  if (providedToken.startsWith('Bearer ')) {
    return providedToken.substring(7);
  }

  return providedToken;
}

export async function POST(request) {
  try {
    const rawPayload = await request.json();
    const token = extractToken(request, rawPayload?.setupToken);

    if (token !== SETUP_TOKEN) {
      return NextResponse.json({ message: 'Accès interdit' }, { status: 403 });
    }

    const { setupToken, ...rest } = rawPayload || {};
    const { firstName, lastName, email, password, newsletter } = payloadSchema.parse(rest);

    const { db } = await connectDB();

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Un compte existe déjà pour cet email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const userDocument = buildSuperAdminUserDocument({
      id: userId,
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword,
      newsletter,
      subscription: {
        plan: 'enterprise',
        status: 'active',
        trialEnds: new Date()
      }
    });

    await db.collection('users').insertOne(userDocument);

    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId,
      type: 'auth',
      action: 'create_superadmin',
      details: {
        email,
        firstName,
        lastName
      },
      timestamp: new Date()
    });

    return NextResponse.json(
      {
        message: 'Compte super administrateur créé',
        user: {
          id: userDocument.id,
          firstName: userDocument.firstName,
          lastName: userDocument.lastName,
          email: userDocument.email,
          role: userDocument.role,
          createdAt: userDocument.createdAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Format des données invalide',
          issues: error.issues
        },
        { status: 400 }
      );
    }

    if (error.message === 'SETUP_TOKEN_MISSING') {
      console.error('SUPERADMIN_SETUP_TOKEN manquant.');
      return NextResponse.json(
        { message: 'Configuration super administrateur invalide' },
        { status: 500 }
      );
    }

    console.error('Erreur création super administrateur:', error);
    return NextResponse.json(
      { message: 'Impossible de créer le compte super administrateur' },
      { status: 500 }
    );
  }
}
