import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function POST(request) {
  try {
    const { email, password, remember } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    // Find user in database
    const user = await db.collection('users').findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    if (!user.password) {
      console.error('User record missing password hash for:', user.email);
      return NextResponse.json(
        { message: 'Impossible de se connecter pour le moment. Merci de contacter le support.' },
        { status: 500 }
      );
    }

    // Verify password using stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const tokenExpiry = remember ? '30d' : '24h';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Remove password from user data
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      settings: user.settings,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la connexion' },
      { status: 500 }
    );
  }
}