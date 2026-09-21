import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ObjectId, toAuthUser, usersCol, userStatus } from "@/lib/models";
import { getServerSettings } from "@/lib/settings";
import { BudgetExceededError } from "@/lib/usage";
import type { AuthUser, Role, UserStatus } from "@/types";

// ============================================================================
// Guardas de autorização para API routes. Server-only.
//
// O papel e o estado são lidos SEMPRE da base de dados, nunca do JWT. O token
// dura 7 dias: se confiássemos no que ele diz, promover, despromover ou
// suspender alguém só faria efeito uma semana depois. Custa uma leitura
// indexada por pedido — barato ao lado de uma autorização errada.
// ============================================================================

type GuardResult =
  | { user: AuthUser; error?: undefined }
  | { user?: undefined; error: NextResponse };

const unauthorized = () =>
  NextResponse.json({ error: "Não autenticado." }, { status: 401 });

const forbidden = (message = "Sem permissão.") =>
  NextResponse.json({ error: message }, { status: 403 });

/** Sessão + documento actual do utilizador. `null` se a sessão não serve. */
export async function loadSessionUser(): Promise<{
  user: AuthUser;
  status: UserStatus;
} | null> {
  const session = await getSession();
  if (!session) return null;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(session.id);
  } catch {
    return null;
  }

  const col = await usersCol();
  const doc = await col.findOne({ _id: objectId });
  if (!doc) return null;

  return { user: toAuthUser(doc), status: userStatus(doc) };
}

export async function requireUser(): Promise<GuardResult> {
  const found = await loadSessionUser();
  if (!found) return { error: unauthorized() };

  if (found.status === "suspended") {
    return { error: forbidden("A tua conta está suspensa. Fala com o administrador.") };
  }
  if (found.status === "pending") {
    return { error: forbidden("A tua conta ainda está à espera de aprovação.") };
  }
  return { user: found.user };
}

export async function requireRole(role: Role): Promise<GuardResult> {
  const res = await requireUser();
  if (res.error) return res;
  if (res.user.role !== role) return { error: forbidden() };
  return res;
}

export async function requireAnyRole(roles: Role[]): Promise<GuardResult> {
  const res = await requireUser();
  if (res.error) return res;
  if (!roles.includes(res.user.role)) return { error: forbidden() };
  return res;
}

/**
 * Guarda das rotas que gastam dinheiro: utilizador válido e activo (já
 * garantido por `requireUser`) mais o interruptor geral.
 */
export async function requireAiAccess(): Promise<GuardResult> {
  const res = await requireUser();
  if (res.error) return res;

  const settings = await getServerSettings();
  if (!settings.apiEnabled) {
    return {
      error: NextResponse.json({ error: settings.disabledMessage }, { status: 503 }),
    };
  }
  return res;
}

/** `requireAiAccess` + verificação de papel. */
export async function requireAiAccessAs(role: Role): Promise<GuardResult> {
  const res = await requireAiAccess();
  if (res.error) return res;
  if (res.user.role !== role) return { error: forbidden() };
  return res;
}

/**
 * Traduz um erro de rota para resposta HTTP. O orçamento esgotado é 402
 * (Payment Required) e não 500 — é uma condição esperada, não uma avaria.
 */
export function apiError(
  tag: string,
  error: unknown,
  fallback: string
): NextResponse {
  if (error instanceof BudgetExceededError) {
    console.warn(`[${tag}] orçamento esgotado`);
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 402 }
    );
  }
  console.error(`[${tag}]`, error);
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}
