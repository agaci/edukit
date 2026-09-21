/**
 * Gestão de contas por linha de comandos, até o painel de administração
 * existir.
 *
 *   npm run users -- list
 *   npm run users -- pending
 *   npm run users -- approve <username>
 *   npm run users -- suspend <username>
 *   npm run users -- activate <username>
 */
import { openDb } from "./_mongo.mjs";

const [action, username] = process.argv.slice(2);
const ACTIONS = ["list", "pending", "approve", "suspend", "activate"];

if (!ACTIONS.includes(action)) {
  console.error(`Uso: npm run users -- <${ACTIONS.join("|")}> [username]`);
  process.exit(1);
}

const { client, db } = await openDb();
try {
  const users = db.collection("users");

  if (action === "list" || action === "pending") {
    const filter = action === "pending" ? { status: "pending" } : {};
    const docs = await users
      .find(filter, {
        projection: { username: 1, displayName: 1, role: 1, status: 1, createdAt: 1 },
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (docs.length === 0) {
      console.log(action === "pending" ? "Nada à espera de aprovação." : "Sem contas.");
    }
    for (const d of docs) {
      const status = d.status ?? "active";
      const date = d.createdAt?.toISOString?.().slice(0, 10) ?? "";
      console.log(
        `${d.username.padEnd(20)} ${String(d.role).padEnd(8)} ${status.padEnd(10)} ${date}  ${d.displayName ?? ""}`
      );
    }
  } else {
    if (!username) {
      console.error(`Falta o username: npm run users -- ${action} <username>`);
      process.exit(1);
    }
    const status =
      action === "approve" ? "active" : action === "suspend" ? "suspended" : "active";
    const set = { status };
    if (action === "approve") {
      set.approvedAt = new Date();
      set.approvedBy = "cli";
    }

    const res = await users.updateOne(
      { username: username.trim().toLowerCase() },
      { $set: set }
    );
    if (res.matchedCount === 0) {
      console.error(`Não existe nenhum utilizador "${username}".`);
      process.exit(1);
    }
    console.log(`"${username}" -> ${status}`);
    if (action === "suspend") {
      console.log(
        "A sessão dele deixa de poder gastar API de imediato (o estado é lido da base de dados a cada chamada paga)."
      );
    }
  }
} finally {
  await client.close();
}
