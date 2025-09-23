// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/checkin';

// Extrait le nom de base depuis l'URI (fonctionne avec mongodb et mongodb+srv)
function getDbNameFromUri(u) {
  try {
    const url = new URL(u);
    const path = (url.pathname || '').replace(/^\//, '');
    if (path) return decodeURIComponent(path);
    const qp = url.searchParams.get('dbName');
    if (qp) return qp;
  } catch (_) {
    // Fallback regex si URL() n'aime pas un format exotique
    const m = u.match(/^[^?]+\/([^/?]+)(?:\?|$)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return 'checkin';
}

const dbName = getDbNameFromUri(uri);
export const DATABASE_NAME = dbName;

let client;
let clientPromise;

const clientOptions = {
  retryWrites: true,
  w: 'majority',
  readPreference: 'primary',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, clientOptions);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, clientOptions);
  clientPromise = client.connect();
}

export async function connectDB() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName); // ← utilise le nom extrait de l’URI

    await createIndexes(db);
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function createIndexes(db) {
  try {
    // Users
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });

    // Properties
    await db.collection('properties').createIndex({ userId: 1 });
    await db.collection('properties').createIndex({ id: 1 }, { unique: true });

    // Inventories
    await db.collection('inventories').createIndex({ userId: 1 });
    await db.collection('inventories').createIndex({ propertyId: 1 });
    await db.collection('inventories').createIndex({ id: 1 }, { unique: true });

    // Guests
    await db.collection('guests').createIndex({ userId: 1 });
    await db.collection('guests').createIndex({ email: 1, userId: 1 });
    await db.collection('guests').createIndex(
      { 'account.email': 1, userId: 1 },
      {
        unique: true,
        partialFilterExpression: { 'account.email': { $exists: true, $type: 'string' } },
      }
    );
    await db.collection('guests').createIndex({ 'account.status': 1 });
    await db.collection('guests').createIndex({ 'deposit.status': 1 });
    await db.collection('guests').createIndex({ 'deposit.paymentIntentId': 1 }, { sparse: true });
    await db.collection('guests').createIndex({ id: 1 }, { unique: true });

    // Bookings
    await db.collection('bookings').createIndex({ userId: 1 });
    await db.collection('bookings').createIndex({ propertyId: 1 });
    await db.collection('bookings').createIndex({ guestId: 1 });
    await db.collection('bookings').createIndex({ checkIn: 1, checkOut: 1 });
    await db.collection('bookings').createIndex({ id: 1 }, { unique: true });

    // Deposits
    await db.collection('deposits').createIndex({ userId: 1 });
    await db.collection('deposits').createIndex({ bookingId: 1 });
    await db.collection('deposits').createIndex({ stripePaymentIntentId: 1 });
    await db.collection('deposits').createIndex({ status: 1 });
    await db.collection('deposits').createIndex({ id: 1 }, { unique: true });

    // Activity logs
    await db.collection('activity_logs').createIndex({ userId: 1 });
    await db.collection('activity_logs').createIndex({ timestamp: -1 });
    await db.collection('activity_logs').createIndex({ type: 1, action: 1 });

    console.log('Database indexes created successfully');
  } catch {
    console.log('Index creation completed (some may already exist)');
  }
}

export default clientPromise;
