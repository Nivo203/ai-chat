import { MongoClient, Collection, Db } from "mongodb";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing from .env");
}

const client = new MongoClient(mongoUri);

let database: Db;

export async function connectDatabase(): Promise<void> {
  await client.connect();

  database = client.db("ai_chat");

  console.log("Connected to MongoDB");
}

export function getMessagesCollection(): Collection {
  if (!database) {
    throw new Error("Database is not connected");
  }

  return database.collection("messages");
}