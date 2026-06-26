import type { AppSettings, ModuleId, SessionResult } from "@/types";
import { makeId } from "@/lib/utils";

// ============================================================================
// Persistência local (localStorage). Tudo é client-side.
// ============================================================================

const SETTINGS_KEY = "edukit:settings";
const HISTORY_KEY = "edukit:history";

export const DEFAULT_SETTINGS: AppSettings = {
  inputMode: "both",
  gradeLevel: 3,
  tutorPin: "1234",
  studentName: "",
  maxTTSPlays: 3,
  ttsVoiceURI: "",
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// --- Definições ---------------------------------------------------------------

export function loadSettings(): AppSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Histórico ----------------------------------------------------------------

export function loadHistory(): SessionResult[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionResult[];
  } catch {
    return [];
  }
}

export function addSession(entry: {
  module: ModuleId;
  score: number;
  timeSpent: number;
  feedback: string;
}): SessionResult {
  const record: SessionResult = {
    id: makeId(),
    date: new Date().toISOString(),
    ...entry,
  };
  if (!isBrowser()) return record;
  const history = loadHistory();
  history.unshift(record);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 500)));
  return record;
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(HISTORY_KEY);
}

// --- Estatísticas derivadas ---------------------------------------------------

export interface ModuleStats {
  module: ModuleId;
  count: number;
  average: number | null;
  last: SessionResult | null;
}

export function moduleStats(history: SessionResult[], module: ModuleId): ModuleStats {
  const entries = history.filter((h) => h.module === module);
  if (entries.length === 0) {
    return { module, count: 0, average: null, last: null };
  }
  const sum = entries.reduce((acc, e) => acc + e.score, 0);
  return {
    module,
    count: entries.length,
    average: Math.round((sum / entries.length) * 10) / 10,
    last: entries[0],
  };
}

/** Conta dias consecutivos com actividade, terminando hoje. */
export function computeStreak(history: SessionResult[]): number {
  if (history.length === 0) return 0;

  const days = new Set(
    history.map((h) => new Date(h.date).toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();
  // Se não houve actividade hoje, começa a contar a partir de ontem.
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
