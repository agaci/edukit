import {
  getAnthropic,
  MODEL,
  MAX_TOKENS_CORRECTION,
  extractText,
  buildUserContent,
  type ImagePayload,
} from "@/lib/anthropic";
import { PROMPTS } from "@/lib/prompts";
import { parseJsonFromLLM, clamp } from "@/lib/utils";
import type {
  Exercise,
  ExerciseResult,
  MathResult,
  McAnswer,
  McQuestion,
} from "@/types";

// ============================================================================
// Lógica de correção partilhada (server-only). Usada pela API de correção
// avulsa e pela submissão de trabalhos atribuídos.
// ============================================================================

async function runCorrection(
  systemPrompt: string,
  userText: string,
  image?: ImagePayload
): Promise<string> {
  const anthropic = getAnthropic();
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS_CORRECTION,
    system: systemPrompt,
    messages: [{ role: "user", content: buildUserContent(userText, image) }],
  });
  return extractText(message);
}

export async function gradeDitado(input: {
  originalText: string;
  studentText?: string;
  image?: ImagePayload;
  gradeLevel: number;
  timeSpent?: number;
}): Promise<ExerciseResult> {
  const userText = input.image
    ? "Lê o ditado manuscrito na imagem e corrige-o comparando com o texto original."
    : `Texto escrito pelo aluno:\n${input.studentText ?? ""}`;
  const raw = await runCorrection(
    PROMPTS.corrigirDitado(input.originalText, input.gradeLevel),
    userText,
    input.image
  );
  const parsed = parseJsonFromLLM<Partial<ExerciseResult>>(raw);
  return {
    score: clamp(Number(parsed.score) || 0, 0, 20),
    feedback: parsed.feedback ?? "",
    corrections: parsed.corrections ?? [],
    timeSpent: input.timeSpent,
    readableText: parsed.readableText,
  };
}

export async function gradeCompreensao(input: {
  originalText: string;
  studentText: string;
  gradeLevel: number;
  timeSpent?: number;
}): Promise<ExerciseResult> {
  const raw = await runCorrection(
    PROMPTS.corrigirCompreensao(input.originalText, input.gradeLevel),
    `Texto escrito pelo aluno sobre o que leu:\n${input.studentText}`
  );
  const parsed = parseJsonFromLLM<Partial<ExerciseResult>>(raw);
  return {
    score: clamp(Number(parsed.score) || 0, 0, 20),
    feedback: parsed.feedback ?? "",
    corrections: parsed.corrections ?? [],
    criteria: parsed.criteria,
    timeSpent: input.timeSpent,
  };
}

export async function gradeTraducao(input: {
  sourceText: string;
  direction: "en-pt" | "pt-en";
  studentText: string;
  gradeLevel: number;
  timeSpent?: number;
}): Promise<ExerciseResult> {
  const raw = await runCorrection(
    PROMPTS.corrigirTraducao(input.sourceText, input.direction, input.gradeLevel),
    `Tradução escrita pelo aluno:\n${input.studentText}`
  );
  const parsed = parseJsonFromLLM<Partial<ExerciseResult>>(raw);
  return {
    score: clamp(Number(parsed.score) || 0, 0, 20),
    feedback: parsed.feedback ?? "",
    corrections: parsed.corrections ?? [],
    timeSpent: input.timeSpent,
  };
}

// Interpretação (escolha múltipla) — corrigida localmente, sem IA.
export function gradeInterpretacao(input: {
  questions: McQuestion[];
  answers: number[];
  timeSpent?: number;
}): ExerciseResult {
  const mcResults: McAnswer[] = input.questions.map((q, i) => {
    const selectedIndex = Number.isInteger(input.answers?.[i])
      ? input.answers[i]
      : -1;
    return {
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedIndex,
      correctIndex: q.correctIndex,
      correct: selectedIndex === q.correctIndex,
    };
  });
  const total = input.questions.length || 1;
  const correct = mcResults.filter((r) => r.correct).length;
  const score = Math.round((correct / total) * 20 * 10) / 10;
  const feedback =
    `Acertaste ${correct} de ${total} perguntas.` +
    (score >= 14
      ? " Muito bem!"
      : " Continua a treinar a leitura em inglês — para a próxima vais melhorar.");
  return { score, feedback, corrections: [], mcResults, timeSpent: input.timeSpent };
}

export async function gradeMatematica(input: {
  exercises: Exercise[];
  image: ImagePayload;
  gradeLevel: number;
  timeSpent?: number;
}): Promise<MathResult> {
  const raw = await runCorrection(
    PROMPTS.corrigirMatematica(input.exercises, input.gradeLevel),
    "Analisa a fotografia da resolução manuscrita e corrige cada exercício da lista.",
    input.image
  );
  const parsed = parseJsonFromLLM<Partial<MathResult>>(raw);
  return {
    score: clamp(Number(parsed.score) || 0, 0, 20),
    feedback: parsed.feedback ?? "",
    corrections: parsed.corrections ?? [],
    illegible: parsed.illegible ?? false,
    timeSpent: input.timeSpent,
    exerciseResults: parsed.exerciseResults ?? [],
  };
}
