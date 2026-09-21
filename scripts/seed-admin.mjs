/**
 * Promove uma conta existente a administrador.
 *
 *   npm run seed-admin -- <username>
 *
 * O papel de administrador nunca é atribuído pelo registo público: tem de ser
 * dado aqui, à mão, com acesso à máquina. Não cria contas — cria-se a conta
 * normalmente na aplicação e depois promove-se.
 */
import { openDb } from "./_mongo.mjs";

const username = (process.argv[2] ?? "").trim().toLowerCase();
if (!username) {
  console.error("Uso: npm run seed-admin -- <username>");
  process.exit(1);
}

const { client, db } = await openDb();
try {
  const users = db.collection("users");
  const doc = await users.findOne({ username });
  if (!doc) {
    console.error(
      `Não existe nenhum utilizador "${username}". Cria a conta na aplicação primeiro.`
    );
    process.exit(1);
  }

  await users.updateOne(
    { _id: doc._id },
    { $set: { role: "admin", status: "active", approvedAt: new Date() } }
  );
  console.log(`"${username}" é agora administrador.`);

  // Garante que o documento de definições existe, com os valores por omissão.
  const settings = db.collection("app_settings");
  if (!(await settings.findOne({ _id: "app" }))) {
    await settings.insertOne({
      _id: "app",
      apiEnabled: true,
      disabledMessage:
        "A correção automática está temporariamente indisponível. Tenta novamente mais tarde.",
      registrationMode: "approval",
      model: "claude-sonnet-5",
      eurPerUsd: 0.92,
      warnThreshold: 0.8,
      globalMonthlyBudgetCents: 1000,
      updatedAt: new Date(),
      updatedBy: "seed-admin",
    });
    console.log("Definições de servidor criadas (registo: approval, teto: 10 €).");
  }
} finally {
  await client.close();
}
