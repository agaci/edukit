import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { AuthUser, Role } from "@/types";

// ============================================================================
// Guardas de autorização para API routes. Server-only.
// ============================================================================

type GuardResult =
  | { user: AuthUser; error?: undefined }
  | { user?: undefined; error: NextResponse };

export async function requireUser(): Promise<GuardResult> {
  const user = await getSession();
  if (!user) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }
  return { user };
}

export async function requireRole(role: Role): Promise<GuardResult> {
  const res = await requireUser();
  if (res.error) return res;
  if (res.user.role !== role) {
    return {
      error: NextResponse.json({ error: "Sem permissão." }, { status: 403 }),
    };
  }
  return res;
}
