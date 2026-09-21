import { settingsCol, type SettingsDoc } from "@/lib/models";
import type { ServerSettings } from "@/types";

// ============================================================================
// Definições globais do servidor. Server-only.
//
// Até agora o EduKit só tinha definições no localStorage do browser, o que
// significa que não havia forma de travar nada do lado do servidor. Este
// módulo dá esse travão: um único documento em `app_settings`, lido com cache
// curta para não fazer uma ida à base de dados em cada pedido.
// ============================================================================

export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  apiEnabled: true,
  disabledMessage:
    "A correção automática está temporariamente indisponível. Tenta novamente mais tarde.",
  // Público com orçamento apertado: contas novas ficam à espera de aprovação.
  registrationMode: "approval",
  // Sonnet 5 por decisão do administrador. Muda-se aqui na base de dados, não
  // no código — e só um administrador lhe pode tocar.
  model: "claude-sonnet-5",
  eurPerUsd: 0.92,
  warnThreshold: 0.8,
  globalMonthlyBudgetCents: 1000, // 10 €
};

const CACHE_MS = 15_000;

type CacheHolder = typeof globalThis & {
  _edukitSettingsCache?: { value: ServerSettings; at: number };
};

export function invalidateSettingsCache(): void {
  const g = globalThis as CacheHolder;
  g._edukitSettingsCache = undefined;
}

export async function getServerSettings(): Promise<ServerSettings> {
  const g = globalThis as CacheHolder;
  const cached = g._edukitSettingsCache;
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  let value = DEFAULT_SERVER_SETTINGS;
  try {
    const col = await settingsCol();
    const doc = await col.findOne({ _id: "app" });
    if (doc) {
      value = {
        ...DEFAULT_SERVER_SETTINGS,
        ...doc,
        updatedAt: doc.updatedAt?.toISOString(),
      };
    }
  } catch (error) {
    // Base de dados indisponível: não é motivo para abrir as portas. Ficamos
    // pelos valores por omissão, que são os mais restritivos.
    console.error("[settings] falha a ler app_settings", error);
  }

  g._edukitSettingsCache = { value, at: Date.now() };
  return value;
}

export async function updateServerSettings(
  patch: Partial<ServerSettings>,
  updatedBy: string
): Promise<ServerSettings> {
  const col = await settingsCol();
  const set: Partial<SettingsDoc> = {
    ...patch,
    updatedAt: new Date(),
    updatedBy,
  };
  delete (set as { _id?: unknown })._id;
  await col.updateOne({ _id: "app" }, { $set: set }, { upsert: true });
  invalidateSettingsCache();
  return getServerSettings();
}
