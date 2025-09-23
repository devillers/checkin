import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { buildAdminUserDocument } from '@/lib/models/user';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function POST(request) {
  try {
    const {
      firstName: rawFirstName,
      lastName: rawLastName,
      email: rawEmail,
      password,
      newsletter
    } = await request.json();

    const firstName = rawFirstName?.trim();
    const lastName = rawLastName?.trim();
    const email = rawEmail?.trim().toLowerCase();

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Tous les champs sont requis' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      email
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Un compte existe déjà avec cette adresse email' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const user = buildAdminUserDocument({
      id: userId,
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword,
      newsletter: Boolean(newsletter),
      subscription: {
        plan: 'free',
        status: 'active',
        trialEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    try {
      await db.collection('users').insertOne(user);
    } catch (error) {
      if (error?.code === 11000) {
        return NextResponse.json(
          { message: 'Un compte existe déjà avec cette adresse email' },
          { status: 409 }
        );
      }
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userId,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove sensitive data
    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      settings: user.settings,
      createdAt: user.createdAt
    };

    // Log registration event
    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      userId: userId,
      type: 'auth',
      action: 'register',
      details: {
        email: user.email,
        newsletter: Boolean(newsletter)
      },
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      message: 'Compte créé avec succès',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la création du compte' },
      { status: 500 }
    );
  }
}