import { NextResponse } from "next/server";
import { MODEL_CATALOG } from "@/lib/anthropic";
import { apiError, requireRole } from "@/lib/guard";
import { getServerSettings, updateServerSettings } from "@/lib/settings";
import type { ClaudeModelId, RegistrationMode, ServerSettings } from "@/types";

export const runtime = "nodejs";

const MODES: RegistrationMode[] = ["open", "approval", "closed"];

export async function GET() {
  const gate = await requireRole("admin");
  if (gate.error) return gate.error;
  try {
    return NextResponse.json({ settings: await getServerSettings() });
  } catch (error) {
    return apiError("/api/admin/settings", error, "Erro ao ler as definições.");
  }
}

export async function PATCH(req: Request) {
  const gate = await requireRole("admin");
  if (gate.error) return gate.error;

  try {
    const body = (await req.json()) as Partial<ServerSettings>;
    const patch: Partial<ServerSettings> = {};

    if (body.model !== undefined) {
      if (!(body.model in MODEL_CATALOG)) {
        return NextResponse.json({ error: "Modelo não permitido." }, { status: 400 });
      }
      patch.model = body.model as ClaudeModelId;
    }
    if (body.apiEnabled !== undefined) patch.apiEnabled = !!body.apiEnabled;
    if (body.registrationMode !== undefined) {
      if (!MODES.includes(body.registrationMode)) {
        return NextResponse.json({ error: "Modo de registo inválido." }, { status: 400 });
      }
      patch.registrationMode = body.registrationMode;
    }
    if (body.globalMonthlyBudgetCents !== undefined) {
      const cents = Number(body.globalMonthlyBudgetCents);
      if (!Number.isInteger(cents) || cents < 0) {
        return NextResponse.json({ error: "Teto inválido." }, { status: 400 });
      }
      patch.globalMonthlyBudgetCents = cents;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
    }

    const settings = await updateServerSettings(patch, gate.user.username);
    console.log(`[admin] ${gate.user.username} actualizou definições`, patch);
    return NextResponse.json({ settings });
  } catch (error) {
    return apiError("/api/admin/settings", error, "Erro ao gravar as definições.");
  }
}
