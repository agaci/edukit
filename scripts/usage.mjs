/**
 * Consumo da API do Claude.
 *
 *   npm run usage                 # mês actual
 *   npm run usage -- 2026-08      # outro mês
 *   npm run usage -- --events 20  # últimas N chamadas
 */
import { openDb } from "./_mongo.mjs";

const args = process.argv.slice(2);
const period = args.find((a) => /^\d{4}-\d{2}$/.test(a)) ?? new Date().toISOString().slice(0, 7);
const eventsIdx = args.indexOf("--events");
const eventsN = eventsIdx >= 0 ? Number(args[eventsIdx + 1]) || 10 : 0;

const usd = (micros) => `$${(micros / 1e6).toFixed(4)}`;

const { client, db } = await openDb();
try {
  const settings = (await db.collection("app_settings").findOne({ _id: "app" })) ?? {};
  const budgetCents = settings.globalMonthlyBudgetCents ?? 1000;
  const eurPerUsd = settings.eurPerUsd ?? 0.92;
  const budget = Math.round((budgetCents * 10_000) / eurPerUsd);
  const model = settings.model ?? "claude-sonnet-5";

  const counters = db.collection("usage_counters");
  const global = await counters.findOne({ scope: "global", key: "global", period });
  const spent = global?.costMicros ?? 0;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;

  console.log(`\nPeríodo ${period}   modelo: ${model}`);
  console.log(
    `Gasto: ${usd(spent)} de ${usd(budget)} (${pct.toFixed(1)}%)  ·  ${global?.calls ?? 0} chamadas`
  );
  const bars = Math.min(40, Math.round((pct / 100) * 40));
  console.log(`[${"#".repeat(bars)}${".".repeat(40 - bars)}]`);
  if (pct >= 100) console.log("TETO ATINGIDO — as chamadas estão bloqueadas.");
  else if (pct >= (settings.warnThreshold ?? 0.8) * 100) console.log("Acima do limiar de aviso.");

  const events = db.collection("usage_events");
  const start = new Date(`${period}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const match = { ts: { $gte: start, $lt: end } };

  const byOp = await events
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: "$operation",
          calls: { $sum: 1 },
          cost: { $sum: "$costMicros" },
          inTok: { $sum: "$inputTokens" },
          outTok: { $sum: "$outputTokens" },
          img: { $sum: { $ifNull: ["$imageBytes", 0] } },
        },
      },
      { $sort: { cost: -1 } },
    ])
    .toArray();

  if (byOp.length) {
    console.log("\nPor operação");
    console.log("  operação                 chamadas      custo   tok-in  tok-out   médio");
    for (const r of byOp) {
      console.log(
        `  ${String(r._id).padEnd(24)} ${String(r.calls).padStart(8)} ${usd(r.cost).padStart(10)}` +
          ` ${String(r.inTok).padStart(8)} ${String(r.outTok).padStart(8)} ${usd(Math.round(r.cost / r.calls)).padStart(9)}`
      );
    }
  }

  const byUser = await events
    .aggregate([
      { $match: match },
      { $group: { _id: "$username", calls: { $sum: 1 }, cost: { $sum: "$costMicros" } } },
      { $sort: { cost: -1 } },
      { $limit: 15 },
    ])
    .toArray();

  if (byUser.length) {
    console.log("\nPor utilizador");
    for (const r of byUser) {
      console.log(`  ${String(r._id).padEnd(24)} ${String(r.calls).padStart(6)} ${usd(r.cost).padStart(10)}`);
    }
  }

  const failures = await events.countDocuments({ ...match, ok: false });
  if (failures) console.log(`\nChamadas falhadas: ${failures}`);

  if (eventsN) {
    console.log(`\nÚltimas ${eventsN} chamadas`);
    const last = await events.find(match).sort({ ts: -1 }).limit(eventsN).toArray();
    for (const e of last) {
      const img = e.imageBytes ? ` img:${Math.round(e.imageBytes / 1024)}kB` : "";
      console.log(
        `  ${e.ts.toISOString().slice(0, 19)} ${String(e.username).padEnd(14)} ` +
          `${String(e.operation).padEnd(22)} ${usd(e.costMicros).padStart(10)} ` +
          `${String(e.inputTokens).padStart(6)}/${String(e.outputTokens).padStart(5)} ` +
          `${e.latencyMs}ms${e.ok ? "" : ` ERRO:${e.errorCode}`}${img}`
      );
    }
  }

  if (!global && !byOp.length) {
    console.log("\nAinda não há consumo registado neste período.");
  }
  console.log("");
} finally {
  await client.close();
}
