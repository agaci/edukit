import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// Cliente Anthropic — APENAS no servidor.
// A chave ANTHROPIC_API_KEY nunca é exposta ao cliente; este módulo só deve
// ser importado dentro de API Routes (server-side).
// ============================================================================

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não definida. Cria um ficheiro .env.local com a chave (ver .env.local.example)."
    );
  }
  if (!cached) {
    cached = new Anthropic({ apiKey });
  }
  return cached;
}

// Modelo único usado para geração e correção (suporta visão/imagens).
export const MODEL = "claude-opus-4-8";

// Limites de tokens por tipo de tarefa.
export const MAX_TOKENS_GENERATION = 2048;
export const MAX_TOKENS_CORRECTION = 4096;

// Nota: os modelos Opus 4.7/4.8 não aceitam `temperature`/`top_p`/`top_k`
// (devolvem 400). O comportamento é orientado apenas pelo prompt.

export type ImagePayload = {
  base64: string; // sem o prefixo data:
  mimeType: string; // image/jpeg, image/png, ...
};

/**
 * Extrai o texto concatenado de uma resposta de Messages API.
 */
export function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Constrói o array de content para uma mensagem de utilizador, opcionalmente
 * com uma imagem (para Claude Vision).
 */
export function buildUserContent(
  text: string,
  image?: ImagePayload
): Anthropic.MessageParam["content"] {
  if (!image) return text;
  return [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: image.mimeType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: image.base64,
      },
    },
    { type: "text", text },
  ];
}
