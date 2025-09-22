import jwt from 'jsonwebtoken';
import { connectDB } from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { db } = await connectDB();
    
    const user = await db.collection('users').findOne({ id: decoded.userId });
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      settings: user.settings
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function getAuthToken(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function requireAuth(request) {
  const token = getAuthToken(request);
  if (!token) {
    throw new Error('No token provided');
  }
  
  return await verifyToken(token);
}

export function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}