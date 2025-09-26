// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is not defined. Please set it in your environment.');
}

function getDbNameFromUri(u) {
  try {
    const url = new URL(u);
    const path = (url.pathname || '').replace(/^\//, '');
    if (path) return decodeURIComponent(path);
    const qp = url.searchParams.get('dbName');
    if (qp) return qp;
  } catch (_) {
    const match = u.match(/^[^?]+\/([^/?]+)(?:\?|$)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}

const dbName = getDbNameFromUri(uri);

let clientPromise;

const options = {
  retryWrites: true,
  w: 'majority',
};

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectDB() {
  const client = await clientPromise;
  const db = dbName ? client.db(dbName) : client.db();
  await ensureArrivalGuideIndexes(db);
  return { client, db };
}

async function ensureArrivalGuideIndexes(db) {
  try {
    await db.collection('arrival_guides').createIndex({ qrToken: 1 }, { unique: true });
    await db.collection('arrival_guides').createIndex({ createdAt: -1 });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('arrival_guides index creation warning:', error.message);
    }
  }
}

export default clientPromise;
