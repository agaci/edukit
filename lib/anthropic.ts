import Anthropic from "@anthropic-ai/sdk";
import { getServerSettings } from "@/lib/settings";
import { assertWithinBudget, recordUsage } from "@/lib/usage";
import type { ClaudeModelId, Operation, Role } from "@/types";

// ============================================================================
// Cliente Anthropic — APENAS no servidor.
//
// Toda a despesa passa por `callClaude`. É de propósito que o cliente cru não
// é exportado: uma rota nova que queira chamar o Claude tem de usar o funil, e
// por isso fica automaticamente com verificação de orçamento e com registo de
// consumo. Não há forma de gastar dinheiro sem aparecer no ledger.
// ============================================================================

let cached: Anthropic | null = null;

function getAnthropic(): Anthropic {
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

// --- Catálogo de modelos -------------------------------------------------------

export interface ModelInfo {
  id: ClaudeModelId;
  label: string;
  /** Preços em milionésimos de dólar por milhão de tokens. */
  inputMicrosPerMTok: number;
  outputMicrosPerMTok: number;
  /**
   * Como desligar o raciocínio neste modelo. Em Sonnet 5 omitir `thinking`
   * ligava-o (e aumentava a conta em silêncio); em Opus 4.8 e Haiku 4.5 é
   * omitir que o desliga. Esta diferença já custou dinheiro a muita gente.
   */
  thinking: "omit" | "disabled";
}

export const MODEL_CATALOG: Record<ClaudeModelId, ModelInfo> = {
  "claude-sonnet-5": {
    id: "claude-sonnet-5",
    label: "Sonnet 5",
    inputMicrosPerMTok: 2_000_000, // $2 / MTok
    outputMicrosPerMTok: 10_000_000, // $10 / MTok
    thinking: "disabled",
  },
  "claude-haiku-4-5": {
    id: "claude-haiku-4-5",
    label: "Haiku 4.5",
    inputMicrosPerMTok: 1_000_000, // $1 / MTok
    outputMicrosPerMTok: 5_000_000, // $5 / MTok
    thinking: "omit",
  },
  "claude-opus-4-8": {
    id: "claude-opus-4-8",
    label: "Opus 4.8",
    inputMicrosPerMTok: 5_000_000, // $5 / MTok
    outputMicrosPerMTok: 25_000_000, // $25 / MTok
    thinking: "omit",
  },
};

export const DEFAULT_MODEL: ClaudeModelId = "claude-sonnet-5";

// Limites de tokens por tipo de tarefa.
export const MAX_TOKENS_GENERATION = 2048;
export const MAX_TOKENS_CORRECTION = 4096;

// Nota: os modelos actuais não aceitam `temperature`/`top_p`/`top_k` (devolvem
// 400). O comportamento é orientado apenas pelo prompt.

export type ImagePayload = {
  base64: string; // sem o prefixo data:
  mimeType: string; // image/jpeg, image/png, ...
};

export interface Actor {
  id: string;
  username: string;
  role: Role;
}

export { BudgetExceededError } from "@/lib/usage";

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

/** Custo de uma chamada, em milionésimos de dólar (inteiro). */
export function costOf(
  model: ModelInfo,
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
  }
): number {
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const micros =
    (usage.input_tokens * model.inputMicrosPerMTok) / 1_000_000 +
    // Leitura de cache custa ~0,1x; escrita ~1,25x.
    (cacheRead * model.inputMicrosPerMTok * 0.1) / 1_000_000 +
    (cacheWrite * model.inputMicrosPerMTok * 1.25) / 1_000_000 +
    (usage.output_tokens * model.outputMicrosPerMTok) / 1_000_000;
  return Math.round(micros);
}

/**
 * O funil. Verifica o orçamento, chama a API, mede e regista — sempre, mesmo
 * quando a chamada falha (uma chamada falhada também pode ter sido cobrada, e
 * de qualquer forma interessa ver as falhas no ledger).
 */
export async function callClaude(params: {
  actor: Actor;
  operation: Operation;
  system: string;
  content: Anthropic.MessageParam["content"];
  maxTokens: number;
  /** Tamanho da imagem enviada, para se perceber o peso das fotografias. */
  imageBytes?: number;
}): Promise<string> {
  const settings = await getServerSettings();
  const model = MODEL_CATALOG[settings.model] ?? MODEL_CATALOG[DEFAULT_MODEL];

  await assertWithinBudget(settings);

  const started = Date.now();
  const request: Anthropic.MessageCreateParamsNonStreaming = {
    model: model.id,
    max_tokens: params.maxTokens,
    system: params.system,
    messages: [{ role: "user", content: params.content }],
  };
  if (model.thinking === "disabled") {
    request.thinking = { type: "disabled" };
  }

  try {
    const message = await getAnthropic().messages.create(request);
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    await recordUsage({
      actor: params.actor,
      operation: params.operation,
      model: model.id,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
      costMicros: costOf(model, message.usage),
      imageBytes: params.imageBytes,
      latencyMs: Date.now() - started,
      ok: true,
    });

    return text;
  } catch (error) {
    await recordUsage({
      actor: params.actor,
      operation: params.operation,
      model: model.id,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      costMicros: 0,
      imageBytes: params.imageBytes,
      latencyMs: Date.now() - started,
      ok: false,
      errorCode:
        error instanceof Anthropic.APIError
          ? `http_${error.status}`
          : "unknown",
    });
    throw error;
  }
}
