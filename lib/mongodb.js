import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/checkinly';
const dbName = process.env.MONGODB_DB_NAME || 'checkinly';

export const DATABASE_NAME = dbName;

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, {
    retryWrites: true,
    w: 'majority',
    readPreference: 'primary',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  clientPromise = client.connect();
}

export async function connectDB() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    
    // Create indexes on first connection
    await createIndexes(db);
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function createIndexes(db) {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    
    // Properties collection indexes
    await db.collection('properties').createIndex({ userId: 1 });
    await db.collection('properties').createIndex({ id: 1 }, { unique: true });
    
    // Inventories collection indexes
    await db.collection('inventories').createIndex({ userId: 1 });
    await db.collection('inventories').createIndex({ propertyId: 1 });
    await db.collection('inventories').createIndex({ id: 1 }, { unique: true });
    
    // Guests collection indexes
    await db.collection('guests').createIndex({ userId: 1 });
    await db.collection('guests').createIndex({ email: 1, userId: 1 });
    await db.collection('guests').createIndex({ 'account.email': 1, userId: 1 }, {
      unique: true,
      partialFilterExpression: { 'account.email': { $exists: true, $type: 'string' } }
    });
    await db.collection('guests').createIndex({ 'account.status': 1 });
    await db.collection('guests').createIndex({ 'deposit.status': 1 });
    await db.collection('guests').createIndex({ 'deposit.paymentIntentId': 1 }, { sparse: true });
    await db.collection('guests').createIndex({ id: 1 }, { unique: true });
    
    // Bookings collection indexes
    await db.collection('bookings').createIndex({ userId: 1 });
    await db.collection('bookings').createIndex({ propertyId: 1 });
    await db.collection('bookings').createIndex({ guestId: 1 });
    await db.collection('bookings').createIndex({ checkIn: 1, checkOut: 1 });
    await db.collection('bookings').createIndex({ id: 1 }, { unique: true });
    
    // Deposits collection indexes
    await db.collection('deposits').createIndex({ userId: 1 });
    await db.collection('deposits').createIndex({ bookingId: 1 });
    await db.collection('deposits').createIndex({ stripePaymentIntentId: 1 });
    await db.collection('deposits').createIndex({ status: 1 });
    await db.collection('deposits').createIndex({ id: 1 }, { unique: true });
    
    // Activity logs indexes
    await db.collection('activity_logs').createIndex({ userId: 1 });
    await db.collection('activity_logs').createIndex({ timestamp: -1 });
    await db.collection('activity_logs').createIndex({ type: 1, action: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.log('Index creation completed (some may already exist)');
  }
}

export default clientPromise;