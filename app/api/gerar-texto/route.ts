import { NextResponse } from "next/server";
import {
  getAnthropic,
  MODEL,
  MAX_TOKENS_GENERATION,
  extractText,
} from "@/lib/anthropic";
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
            `Gera um texto adequado ao ${gradeLevel}.º ano sobre um tema interessante.`,
        },
      ],
    });

    const raw = extractText(message);
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
    console.error("[/api/gerar-texto]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao gerar o texto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
