import type {
  Difficulty,
  Exercise,
  ExerciseResult,
  GeneratedText,
  MathResult,
} from "@/types";

// ============================================================================
// Helpers client-side para falar com as API Routes do Next.js.
// ============================================================================

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Ocorreu um erro inesperado.");
  }
  return data as T;
}

export function gerarTexto(input: {
  prompt: string;
  gradeLevel: number;
  difficulty: Difficulty;
  type: "ditado" | "compreensao";
}): Promise<GeneratedText> {
  return postJson<GeneratedText>("/api/gerar-texto", input);
}

export function gerarExercicios(input: {
  prompt: string;
  gradeLevel: number;
  exerciseTypes: string[];
  count: number;
  difficulty: Difficulty;
}): Promise<{ exercises: Exercise[] }> {
  return postJson<{ exercises: Exercise[] }>("/api/gerar-exercicio", input);
}

export function corrigirDitado(input: {
  originalText: string;
  studentText?: string;
  photoBase64?: string;
  mimeType?: string;
  gradeLevel?: number;
  timeSpent?: number;
}): Promise<ExerciseResult> {
  return postJson<ExerciseResult>("/api/corrigir", { type: "ditado", ...input });
}

export function corrigirCompreensao(input: {
  originalText: string;
  studentText: string;
  gradeLevel: number;
  timeSpent?: number;
}): Promise<ExerciseResult> {
  return postJson<ExerciseResult>("/api/corrigir", {
    type: "compreensao",
    ...input,
  });
}

export function corrigirMatematica(input: {
  exercises: Exercise[];
  photoBase64: string;
  mimeType: string;
  gradeLevel: number;
  timeSpent?: number;
}): Promise<MathResult> {
  return postJson<MathResult>("/api/corrigir", { type: "matematica", ...input });
}
