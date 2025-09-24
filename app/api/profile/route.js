import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatProfileResponse(user) {
  const profile = user.profile || {};

  return {
    id: user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    profile: {
      phone: profile.phone || '',
      jobTitle: profile.jobTitle || '',
      bio: profile.bio || '',
      photoUrl: profile.photoUrl || ''
    }
  };
}

export async function GET(request) {
  try {
    const authUser = await requireAuth(request);
    const { db } = await connectDB();

    const user = await db.collection('users').findOne(
      { id: authUser.id },
      {
        projection: {
          password: 0,
          passwordHash: 0
        }
      }
    );

    if (!user) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json(formatProfileResponse(user));
  } catch (error) {
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    console.error('Error while fetching profile:', error);
    return NextResponse.json({ message: 'Impossible de récupérer le profil' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authUser = await requireAuth(request);
    const { db } = await connectDB();

    const payload = await request.json();
    const firstName = payload.firstName?.trim();
    const lastName = payload.lastName?.trim();
    const email = payload.email?.trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'Prénom, nom et email sont requis' },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Format d'email invalide" }, { status: 400 });
    }

    const existingUser = await db.collection('users').findOne({ id: authUser.id });

    if (!existingUser) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 });
    }

    if (existingUser.email !== email) {
      const emailInUse = await db.collection('users').findOne({
        email,
        id: { $ne: authUser.id }
      });

      if (emailInUse) {
        return NextResponse.json(
          { message: 'Cette adresse email est déjà utilisée par un autre compte' },
          { status: 409 }
        );
      }
    }

    const updatedProfile = {
      ...((existingUser.profile && typeof existingUser.profile === 'object') ? existingUser.profile : {}),
      phone: typeof payload.phone === 'string' ? payload.phone.trim() : existingUser.profile?.phone || '',
      jobTitle:
        typeof payload.jobTitle === 'string' ? payload.jobTitle.trim() : existingUser.profile?.jobTitle || '',
      bio: typeof payload.bio === 'string' ? payload.bio.trim() : existingUser.profile?.bio || ''
    };

    const updateResult = await db.collection('users').findOneAndUpdate(
      { id: authUser.id },
      {
        $set: {
          firstName,
          lastName,
          email,
          profile: updatedProfile,
          updatedAt: new Date()
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          passwordHash: 0
        }
      }
    );

    const updatedUser = updateResult.value;

    if (!updatedUser) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      ...formatProfileResponse(updatedUser),
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        { message: 'Cette adresse email est déjà utilisée par un autre compte' },
        { status: 409 }
      );
    }

    console.error('Error while updating profile:', error);
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
