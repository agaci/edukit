import { NextResponse } from "next/server";
import {
  getAnthropic,
  MODEL,
  MAX_TOKENS_GENERATION,
  extractText,
} from "@/lib/anthropic";
import { PROMPTS } from "@/lib/prompts";
import { parseJsonFromLLM, clamp } from "@/lib/utils";
import type { Difficulty, McQuestion } from "@/types";

export const runtime = "nodejs";

interface Body {
  kind?: "traducao-en-pt" | "traducao-pt-en" | "interpretacao-en";
  gradeLevel?: number;
  difficulty?: Difficulty;
  count?: number;
  prompt?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const gradeLevel = Number(body.gradeLevel) || 5;
    const difficulty = body.difficulty ?? "medio";
    const kind = body.kind ?? "traducao-en-pt";
    const userPrompt = (body.prompt ?? "").trim();

    const anthropic = getAnthropic();

    if (kind === "interpretacao-en") {
      const count = clamp(Number(body.count) || 4, 2, 8);
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS_GENERATION,
        system: PROMPTS.gerarInterpretacaoIngles(gradeLevel, difficulty, count),
        messages: [
          {
            role: "user",
            content:
              userPrompt ||
              `Gera um texto e ${count} perguntas adequados ao ${gradeLevel}.º ano.`,
          },
        ],
      });
      const parsed = parseJsonFromLLM<{
        text?: string;
        questions?: Array<{ question: string; options: string[]; correctIndex: number }>;
      }>(extractText(message));

      const text = (parsed.text ?? "").trim();
      const questions: McQuestion[] = (parsed.questions ?? [])
        .filter((q) => q.question && Array.isArray(q.options) && q.options.length >= 2)
        .map((q, i) => ({
          id: i + 1,
          question: q.question,
          options: q.options,
          correctIndex: clamp(Number(q.correctIndex) || 0, 0, q.options.length - 1),
        }));

      if (!text || questions.length === 0) {
        throw new Error("O modelo não devolveu texto/perguntas.");
      }
      return NextResponse.json({ text, questions });
    }

    // Traduções (en-pt / pt-en): gera o texto-fonte.
    const direction = kind === "traducao-en-pt" ? "en-pt" : "pt-en";
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_GENERATION,
      system: PROMPTS.gerarTraducaoTexto(gradeLevel, difficulty, direction),
      messages: [
        {
          role: "user",
          content:
            userPrompt || `Gera um texto adequado ao ${gradeLevel}.º ano.`,
        },
      ],
    });
    const parsed = parseJsonFromLLM<{ text?: string }>(extractText(message));
    const text = (parsed.text ?? "").trim();
    if (!text) throw new Error("O modelo não devolveu texto.");
    return NextResponse.json({ text });
  } catch (error) {
    console.error("[/api/gerar-ingles]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao gerar o exercício.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
