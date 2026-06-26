import { MongoClient, type Db } from "mongodb";

// ============================================================================
// Cliente MongoDB (Atlas) — APENAS no servidor.
// Liga de forma preguiçosa (só quando uma API route precisa). Reutiliza a
// ligação entre hot-reloads em desenvolvimento através do objecto global.
// ============================================================================

type GlobalWithMongo = typeof globalThis & {
  _edukitMongoClientPromise?: Promise<MongoClient>;
  _edukitIndexesReady?: boolean;
};

function clientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<user>") || uri.includes("<password>")) {
    throw new Error(
      "MONGODB_URI não configurada. Define a connection string do MongoDB Atlas em .env.local."
    );
  }
  const g = globalThis as GlobalWithMongo;
  if (!g._edukitMongoClientPromise) {
    const client = new MongoClient(uri);
    g._edukitMongoClientPromise = client.connect();
  }
  return g._edukitMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  const db = client.db(process.env.MONGODB_DB || "edukit");
  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(db: Db): Promise<void> {
  const g = globalThis as GlobalWithMongo;
  if (g._edukitIndexesReady) return;
  await db
    .collection("users")
    .createIndex({ username: 1 }, { unique: true });
  await db.collection("assignments").createIndex({ studentId: 1, createdAt: -1 });
  await db.collection("assignments").createIndex({ tutorId: 1, createdAt: -1 });
  g._edukitIndexesReady = true;
}
