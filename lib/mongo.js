import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI manquant');
}

let client;
let clientPromise;

function getDatabaseNameFromUri(connectionUri) {
  const url = new URL(connectionUri);
  const pathname = url.pathname.replace(/^\//, '');
  if (!pathname) {
    throw new Error('Le nom de base doit être présent dans MONGODB_URI');
  }
  return decodeURIComponent(pathname);
}

const dbName = getDatabaseNameFromUri(uri);

function getClientOptions() {
  return {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
  };
}

function getClient() {
  if (!clientPromise) {
    client = new MongoClient(uri, getClientOptions());
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb() {
  const mongoClient = await getClient();
  return mongoClient.db(dbName);
}

export async function getCollections() {
  const db = await getDb();
  return {
    guests: db.collection('guests'),
    properties: db.collection('properties'),
    deposits: db.collection('deposits'),
  };
}

export default getClient;
