import { NextResponse } from "next/server";
import {
  getAnthropic,
  MODEL,
  MAX_TOKENS_GENERATION,
  extractText,
} from "@/lib/anthropic";
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
  try {
    const body = (await req.json()) as Body;
    const gradeLevel = Number(body.gradeLevel) || 2;
    const count = Number(body.count) || 5;
    const difficulty = body.difficulty ?? "medio";
    const exerciseTypes = body.exerciseTypes ?? [];
    const userPrompt = (body.prompt ?? "").trim();

    const systemPrompt = PROMPTS.gerarExerciciosMatematica(
      gradeLevel,
      exerciseTypes,
      count,
      difficulty
    );

    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_GENERATION,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            userPrompt ||
            `Gera ${count} exercícios adequados ao ${gradeLevel}.º ano.`,
        },
      ],
    });

    const raw = extractText(message);
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
    console.error("[/api/gerar-exercicio]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao gerar os exercícios.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
