import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export function hasMongoConfig() {
  return Boolean(uri && !uri.includes("<db_username>") && !uri.includes("<db_password>"));
}

export function getDatabaseName() {
  return process.env.MONGODB_DB || "bloom-diary";
}

export async function getMongoClient() {
  if (!hasMongoConfig() || !uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (client) {
    return client;
  }

  if (!clientPromise) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}
