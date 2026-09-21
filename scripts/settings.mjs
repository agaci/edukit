/**
 * Definições de servidor — a superfície de administração até o painel existir.
 * Corre na máquina, portanto só quem tem acesso a ela lhe toca.
 *
 *   npm run settings                              # mostrar
 *   npm run settings -- model claude-haiku-4-5
 *   npm run settings -- budget 1000               # cêntimos de euro (1000 = 10 €)
 *   npm run settings -- registration approval     # open | approval | closed
 *   npm run settings -- api off                   # interruptor geral
 */
import { openDb } from "./_mongo.mjs";

const MODELS = ["claude-sonnet-5", "claude-haiku-4-5", "claude-opus-4-8"];
const MODES = ["open", "approval", "closed"];

const [key, value] = process.argv.slice(2);

const { client, db } = await openDb();
try {
  const col = db.collection("app_settings");
  const set = {};

  if (key === "model") {
    if (!MODELS.includes(value)) {
      console.error(`Modelo inválido. Permitidos: ${MODELS.join(", ")}`);
      process.exit(1);
    }
    set.model = value;
  } else if (key === "budget") {
    const cents = Number(value);
    if (!Number.isInteger(cents) || cents < 0) {
      console.error("Uso: npm run settings -- budget <cêntimos de euro>");
      process.exit(1);
    }
    set.globalMonthlyBudgetCents = cents;
  } else if (key === "registration") {
    if (!MODES.includes(value)) {
      console.error(`Modo inválido. Permitidos: ${MODES.join(", ")}`);
      process.exit(1);
    }
    set.registrationMode = value;
  } else if (key === "api") {
    if (value !== "on" && value !== "off") {
      console.error("Uso: npm run settings -- api <on|off>");
      process.exit(1);
    }
    set.apiEnabled = value === "on";
  } else if (key) {
    console.error("Chaves: model | budget | registration | api");
    process.exit(1);
  }

  if (Object.keys(set).length) {
    set.updatedAt = new Date();
    set.updatedBy = "cli";
    await col.updateOne({ _id: "app" }, { $set: set }, { upsert: true });
    console.log("Actualizado:", set);
    console.log("(a aplicação relê as definições em até 15 segundos)");
  }

  const doc = (await col.findOne({ _id: "app" })) ?? {};
  console.log("\nDefinições actuais");
  console.log(`  modelo          ${doc.model ?? "claude-sonnet-5 (por omissão)"}`);
  console.log(`  API ligada      ${doc.apiEnabled ?? true}`);
  console.log(`  registo         ${doc.registrationMode ?? "approval (por omissão)"}`);
  console.log(
    `  teto mensal     ${((doc.globalMonthlyBudgetCents ?? 1000) / 100).toFixed(2)} €`
  );
  console.log(`  aviso a         ${((doc.warnThreshold ?? 0.8) * 100).toFixed(0)}%`);
  console.log("");
} finally {
  await client.close();
}
