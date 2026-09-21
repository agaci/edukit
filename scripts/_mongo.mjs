/** Ligação ao Mongo para os scripts de administração (fora do Next). */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Lê .env.local / .env sem depender do dotenv. */
export function loadEnv() {
  const out = {};
  for (const name of [".env.local", ".env"]) {
    let raw;
    try {
      raw = readFileSync(path.join(root, name), "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (out[m[1]] === undefined) out[m[1]] = value;
    }
  }
  return { ...out, ...process.env };
}

export async function openDb() {
  const env = loadEnv();
  if (!env.MONGODB_URI) {
    console.error("MONGODB_URI não encontrada em .env.local.");
    process.exit(1);
  }
  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  return { client, db: client.db(env.MONGODB_DB || "edukit") };
}
