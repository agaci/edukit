import type { Difficulty, ModuleId, Role } from "@/types";

/** Concatena classes condicionalmente (utilitário simples tipo clsx). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formata uma data ISO em dd de mês de aaaa (pt-PT). */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Um trabalho está atrasado se tem prazo, não está concluído e o prazo passou. */
export function isOverdue(a: { dueDate?: string; status: string }): boolean {
  return (
    !!a.dueDate &&
    a.status !== "completed" &&
    Date.now() > new Date(a.dueDate).getTime()
  );
}

/** Foi entregue fora do prazo? (concluído depois do prazo) */
export function wasLate(a: {
  dueDate?: string;
  status: string;
  completedAt?: string;
}): boolean {
  return (
    !!a.dueDate &&
    a.status === "completed" &&
    !!a.completedAt &&
    new Date(a.completedAt).getTime() > new Date(a.dueDate).getTime()
  );
}

/** Formata segundos em MM:SS. */
export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Conta palavras de um texto. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Rótulo legível para a dificuldade. */
export function difficultyLabel(d: Difficulty): string {
  return { facil: "Fácil", medio: "Médio", dificil: "Difícil" }[d];
}

/** Rótulo do ano escolar. */
export function gradeLabel(grade: number): string {
  return `${grade}.º ano`;
}

/** Nome legível do módulo. */
export function moduleName(id: ModuleId): string {
  return {
    ditado: "Ditado",
    compreensao: "Compreensão Escrita",
    matematica: "Matemática",
  }[id];
}

/** Rótulo de qualquer tipo de exercício (inclui os de Inglês). */
export function exerciseLabel(type: string): string {
  const map: Record<string, string> = {
    ditado: "Ditado",
    compreensao: "Compreensão Escrita",
    matematica: "Matemática",
    "traducao-en-pt": "Tradução Inglês→Português",
    "traducao-pt-en": "Tradução Português→Inglês",
    "interpretacao-en": "Interpretação (Inglês)",
  };
  return map[type] ?? type;
}

/** Rótulo curto (para cabeçalhos compactos). */
export function exerciseLabelShort(type: string): string {
  const map: Record<string, string> = {
    ditado: "Ditado",
    compreensao: "Compreensão",
    matematica: "Matemática",
    "traducao-en-pt": "Inglês→PT",
    "traducao-pt-en": "PT→Inglês",
    "interpretacao-en": "Interpretação EN",
  };
  return map[type] ?? type;
}

/**
 * Cor associada a uma nota (0-20), com nome semântico.
 * 0-9 vermelho · 10-13 laranja · 14-17 verde · 18-20 dourado
 */
export function scoreColor(score: number): {
  band: "weak" | "ok" | "good" | "excellent";
  hex: string;
  text: string;
} {
  if (score >= 18) return { band: "excellent", hex: "#FBBF24", text: "text-gold" };
  if (score >= 14) return { band: "good", hex: "#22C55E", text: "text-success" };
  if (score >= 10) return { band: "ok", hex: "#F59E0B", text: "text-warning" };
  return { band: "weak", hex: "#F87171", text: "text-danger" };
}

/** Gera um id curto único o suficiente para uso local. */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Extrai e faz parse de um objeto JSON de uma resposta de LLM,
 * tolerando blocos markdown ```json ... ``` e texto à volta.
 */
export function parseJsonFromLLM<T>(raw: string): T {
  let text = raw.trim();

  // Remove cercas de código markdown se existirem.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    text = fence[1].trim();
  }

  // Tenta parse directo.
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fallback: isola o primeiro objeto/array completo.
    const start = text.search(/[[{]/);
    const lastObj = text.lastIndexOf("}");
    const lastArr = text.lastIndexOf("]");
    const end = Math.max(lastObj, lastArr);
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    throw new Error("Não foi possível interpretar a resposta do modelo como JSON.");
  }
}

/** Limita um número a um intervalo. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Converte um nome num username válido (minúsculas, sem acentos nem espaços). */
export function slugifyUsername(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  return slug || "aluno";
}

/**
 * O administrador faz tudo o que um tutor faz: tem os seus alunos e cria os
 * seus trabalhos. Sempre que se testar "é tutor?", é esta a pergunta certa —
 * comparar com `"tutor"` à letra deixa o administrador de fora da sua própria
 * aplicação.
 */
export function isTutorLike(role?: Role): boolean {
  return role === "tutor" || role === "admin";
}
