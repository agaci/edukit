import { NextResponse } from "next/server";
import { callClaude, MAX_TOKENS_GENERATION } from "@/lib/anthropic";
import { apiError, requireAiAccess } from "@/lib/guard";
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
  // Rota paga: exige sessão, conta activa e interruptor geral ligado.
  const gate = await requireAiAccess();
  if (gate.error) return gate.error;

  try {
    const body = (await req.json()) as Body;
    const gradeLevel = Number(body.gradeLevel) || 5;
    const difficulty = body.difficulty ?? "medio";
    const kind = body.kind ?? "traducao-en-pt";
    const userPrompt = (body.prompt ?? "").trim();

    if (kind === "interpretacao-en") {
      const count = clamp(Number(body.count) || 4, 2, 8);
      const raw = await callClaude({
        actor: gate.user,
        operation: "gerar-interpretacao",
        system: PROMPTS.gerarInterpretacaoIngles(gradeLevel, difficulty, count),
        content:
          userPrompt ||
          `Gera um texto e ${count} perguntas adequados ao ${gradeLevel}.º ano.`,
        maxTokens: MAX_TOKENS_GENERATION,
      });
      const parsed = parseJsonFromLLM<{
        text?: string;
        questions?: Array<{ question: string; options: string[]; correctIndex: number }>;
      }>(raw);

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
    const raw = await callClaude({
      actor: gate.user,
      operation: "gerar-traducao",
      system: PROMPTS.gerarTraducaoTexto(gradeLevel, difficulty, direction),
      content: userPrompt || `Gera um texto adequado ao ${gradeLevel}.º ano.`,
      maxTokens: MAX_TOKENS_GENERATION,
    });
    const parsed = parseJsonFromLLM<{ text?: string }>(raw);
    const text = (parsed.text ?? "").trim();
    if (!text) throw new Error("O modelo não devolveu texto.");
    return NextResponse.json({ text });
  } catch (error) {
    return apiError("/api/gerar-ingles", error, "Erro ao gerar o exercício.");
  }
}
