import { NextResponse } from "next/server";
import { COOKIE_NAME, cookieOptions, getSession, signSession } from "@/lib/auth";
import { loadSessionUser } from "@/lib/guard";

export const runtime = "nodejs";

export async function GET() {
  try {
    const fromToken = await getSession();
    const fromDb = await loadSessionUser();

    if (!fromDb) return NextResponse.json({ user: null });

    // Conta suspensa ou à espera de aprovação: termina a sessão em vez de
    // deixar a interface a fingir que está tudo bem.
    if (fromDb.status !== "active") {
      const res = NextResponse.json({ user: null, status: fromDb.status });
      res.cookies.set(COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
      return res;
    }

    const res = NextResponse.json({ user: fromDb.user });

    // O papel mudou depois do login (ex.: promoção a administrador). O token
    // tem 7 dias de validade, por isso reemite-se aqui — senão a interface só
    // dava conta da mudança uma semana depois, ou à custa de um logout.
    if (fromToken && fromToken.role !== fromDb.user.role) {
      res.cookies.set(COOKIE_NAME, await signSession(fromDb.user), cookieOptions);
      console.log(
        `[auth] papel de ${fromDb.user.username}: ${fromToken.role} -> ${fromDb.user.role} (sessão reemitida)`
      );
    }

    return res;
  } catch {
    return NextResponse.json({ user: null });
  }
}
