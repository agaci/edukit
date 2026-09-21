import { NextResponse } from "next/server";
import { callClaude, MAX_TOKENS_GENERATION } from "@/lib/anthropic";
import { apiError, requireAiAccess } from "@/lib/guard";
import { PROMPTS } from "@/lib/prompts";
import { parseJsonFromLLM } from "@/lib/utils";
import type { Difficulty, Exercise } from "@/types";

export const runtime = "nodejs";

interface Body {
  prompt?: string;
  gradeLevel?: number;
  exerciseTypes?: string[];
  count?: number;
  difficulty?: Difficulty;
}

export async function POST(req: Request) {
  // Rota paga: exige sessão, conta activa e interruptor geral ligado.
  const gate = await requireAiAccess();
  if (gate.error) return gate.error;

  try {
    const body = (await req.json()) as Body;
    const gradeLevel = Number(body.gradeLevel) || 2;
    const count = Number(body.count) || 5;
    const difficulty = body.difficulty ?? "medio";
    const exerciseTypes = body.exerciseTypes ?? [];
    const userPrompt = (body.prompt ?? "").trim();

    const raw = await callClaude({
      actor: gate.user,
      operation: "gerar-matematica",
      system: PROMPTS.gerarExerciciosMatematica(
        gradeLevel,
        exerciseTypes,
        count,
        difficulty
      ),
      content:
        userPrompt || `Gera ${count} exercícios adequados ao ${gradeLevel}.º ano.`,
      maxTokens: MAX_TOKENS_GENERATION,
    });
    const parsed = parseJsonFromLLM<{ exercises?: Exercise[] }>(raw);

    const exercises = (parsed.exercises ?? []).map((ex, i) => ({
      id: ex.id ?? i + 1,
      type: ex.type ?? "exercício",
      statement: ex.statement ?? "",
      correctAnswer: ex.correctAnswer ?? "",
      expectedSolution: ex.expectedSolution ?? "",
    }));

    if (exercises.length === 0) {
      throw new Error("O modelo não devolveu exercícios.");
    }

    return NextResponse.json({ exercises });
  } catch (error) {
    return apiError("/api/gerar-exercicio", error, "Erro ao gerar os exercícios.");
  }
}
