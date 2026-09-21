import { NextResponse } from "next/server";
import { callClaude, MAX_TOKENS_GENERATION } from "@/lib/anthropic";
import { apiError, requireAiAccess } from "@/lib/guard";
import { PROMPTS } from "@/lib/prompts";
import { parseJsonFromLLM, countWords } from "@/lib/utils";
import type { Difficulty, GeneratedText } from "@/types";

export const runtime = "nodejs";

interface Body {
  prompt?: string;
  gradeLevel?: number;
  difficulty?: Difficulty;
  type?: "ditado" | "compreensao";
}

export async function POST(req: Request) {
  // Rota paga: exige sessão, conta activa e interruptor geral ligado.
  const gate = await requireAiAccess();
  if (gate.error) return gate.error;

  try {
    const body = (await req.json()) as Body;
    const gradeLevel = Number(body.gradeLevel) || 3;
    const difficulty = body.difficulty ?? "medio";
    const type = body.type ?? "ditado";
    const userPrompt = (body.prompt ?? "").trim();

    const systemPrompt =
      type === "compreensao"
        ? PROMPTS.gerarTextoCompreensao(gradeLevel, difficulty)
        : PROMPTS.gerarTextoDitado(gradeLevel, difficulty);

    const raw = await callClaude({
      actor: gate.user,
      operation: type === "compreensao" ? "gerar-compreensao" : "gerar-ditado",
      system: systemPrompt,
      content:
        userPrompt ||
        `Gera um texto adequado ao ${gradeLevel}.º ano sobre um tema interessante.`,
      maxTokens: MAX_TOKENS_GENERATION,
    });
    const parsed = parseJsonFromLLM<Partial<GeneratedText>>(raw);

    const text = (parsed.text ?? "").trim();
    if (!text) {
      throw new Error("O modelo não devolveu texto.");
    }
    const wordCount = parsed.wordCount ?? countWords(text);
    const estimatedDuration =
      parsed.estimatedDuration ??
      Math.round(wordCount * (type === "compreensao" ? 0.4 : 0.6));

    const result: GeneratedText = {
      text,
      wordCount,
      estimatedDuration,
      theme: parsed.theme,
    };

    return NextResponse.json(result);
  } catch (error) {
    return apiError("/api/gerar-texto", error, "Erro ao gerar o texto.");
  }
}
