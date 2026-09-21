import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Collection } from "mongodb";
import type {
  ClaudeModelId,
  Operation,
  Role,
  ServerSettings,
  SpendSummary,
  UsageEventDTO,
} from "@/types";

// ============================================================================
// Medição de consumo da API. Server-only.
//
// Duas coleções, com papéis diferentes:
//
//   usage_events   — o ledger: uma linha por chamada, nunca alterada. É a
//                    fonte da verdade e o que permite responder a "porque é
//                    que gastei isto".
//   usage_counters — agregados por período, actualizados com $inc atómico. É
//                    o que se lê antes de cada chamada, para a verificação de
//                    orçamento custar uma leitura indexada e não uma varredura.
// ============================================================================

export interface UsageEventDoc {
  _id?: ObjectId;
  ts: Date;
  userId: ObjectId;
  username: string;
  role: Role;
  operation: Operation;
  model: ClaudeModelId;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  imageBytes?: number;
  costMicros: number;
  latencyMs: number;
  ok: boolean;
  errorCode?: string;
}

export interface UsageCounterDoc {
  _id?: ObjectId;
  scope: "global" | "user";
  key: string; // "global" ou o id do utilizador
  period: string; // "2026-09"
  calls: number;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
  updatedAt: Date;
}

/** Lançado quando o teto mensal foi atingido. As rotas traduzem para HTTP 402. */
export class BudgetExceededError extends Error {
  readonly code = "budget_exceeded";
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export async function usageEventsCol(): Promise<Collection<UsageEventDoc>> {
  const db = await getDb();
  return db.collection<UsageEventDoc>("usage_events");
}

export async function usageCountersCol(): Promise<Collection<UsageCounterDoc>> {
  const db = await getDb();
  return db.collection<UsageCounterDoc>("usage_counters");
}

/** Período actual, em UTC: "2026-09". */
export function currentPeriod(at: Date = new Date()): string {
  return at.toISOString().slice(0, 7);
}

/**
 * Teto mensal convertido de cêntimos de euro para milionésimos de dólar — a
 * Anthropic factura em dólares, o orçamento está definido em euros.
 */
export function budgetMicros(settings: ServerSettings): number {
  const rate = settings.eurPerUsd > 0 ? settings.eurPerUsd : 0.92;
  return Math.round((settings.globalMonthlyBudgetCents * 10_000) / rate);
}

export async function getGlobalSpend(
  settings: ServerSettings,
  period = currentPeriod()
): Promise<SpendSummary> {
  const col = await usageCountersCol();
  const doc = await col.findOne({ scope: "global", key: "global", period });
  const limit = budgetMicros(settings);
  const spent = doc?.costMicros ?? 0;
  return {
    periodMonth: period,
    costMicros: spent,
    calls: doc?.calls ?? 0,
    budgetMicros: limit,
    ratio: limit > 0 ? spent / limit : 0,
  };
}

/**
 * Travão do orçamento. Avisar **e** bloquear: acima do limiar de aviso deixa
 * rasto nos logs; atingido o teto, deixa de haver chamadas.
 *
 * Nota: a verificação é feita antes da chamada, com o custo já gasto. Como o
 * custo desta chamada só se conhece no fim, é possível ultrapassar o teto pelo
 * valor de uma chamada (ou de N, se forem concorrentes). Para 10 €/mês o
 * excesso é de cêntimos; quando houver planos por tutor, passa a reserva.
 */
export async function assertWithinBudget(settings: ServerSettings): Promise<void> {
  const spend = await getGlobalSpend(settings);

  if (spend.ratio >= 1) {
    throw new BudgetExceededError(
      "O orçamento mensal do EduKit esgotou-se. A correção automática volta no início do próximo mês."
    );
  }
  if (spend.ratio >= settings.warnThreshold) {
    console.warn(
      `[usage] ATENÇÃO: ${(spend.ratio * 100).toFixed(0)}% do orçamento mensal gasto ` +
        `($${(spend.costMicros / 1e6).toFixed(2)} de $${(spend.budgetMicros / 1e6).toFixed(2)}).`
    );
  }
}

export async function recordUsage(input: {
  actor: { id: string; username: string; role: Role };
  operation: Operation;
  model: ClaudeModelId;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costMicros: number;
  imageBytes?: number;
  latencyMs: number;
  ok: boolean;
  errorCode?: string;
}): Promise<void> {
  const ts = new Date();
  const period = currentPeriod(ts);

  try {
    const events = await usageEventsCol();
    await events.insertOne({
      ts,
      userId: new ObjectId(input.actor.id),
      username: input.actor.username,
      role: input.actor.role,
      operation: input.operation,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      cacheReadTokens: input.cacheReadTokens,
      cacheWriteTokens: input.cacheWriteTokens,
      imageBytes: input.imageBytes,
      costMicros: input.costMicros,
      latencyMs: input.latencyMs,
      ok: input.ok,
      errorCode: input.errorCode,
    });

    const counters = await usageCountersCol();
    const inc = {
      calls: 1,
      costMicros: input.costMicros,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
    };
    await Promise.all([
      counters.updateOne(
        { scope: "global", key: "global", period },
        { $inc: inc, $set: { updatedAt: ts } },
        { upsert: true }
      ),
      counters.updateOne(
        { scope: "user", key: input.actor.id, period },
        { $inc: inc, $set: { updatedAt: ts } },
        { upsert: true }
      ),
    ]);
  } catch (error) {
    // Falhar a registar não pode fazer falhar a correção do aluno — mas tem de
    // gritar nos logs, porque significa que há despesa fora do ledger.
    console.error("[usage] FALHA A REGISTAR CONSUMO", error);
  }
}

export function toUsageEventDTO(doc: UsageEventDoc): UsageEventDTO {
  return {
    id: doc._id!.toString(),
    ts: doc.ts.toISOString(),
    userId: doc.userId.toString(),
    username: doc.username,
    role: doc.role,
    operation: doc.operation,
    model: doc.model,
    inputTokens: doc.inputTokens,
    outputTokens: doc.outputTokens,
    cacheReadTokens: doc.cacheReadTokens,
    cacheWriteTokens: doc.cacheWriteTokens,
    imageBytes: doc.imageBytes,
    costMicros: doc.costMicros,
    latencyMs: doc.latencyMs,
    ok: doc.ok,
    errorCode: doc.errorCode,
  };
}
