import { NextResponse } from "next/server";
import { usersCol, toAuthUser, userStatus } from "@/lib/models";
import {
  verifySecret,
  signSession,
  COOKIE_NAME,
  cookieOptions,
} from "@/lib/auth";

export const runtime = "nodejs";

interface Body {
  username?: string;
  secret?: string; // password (tutor) ou PIN (aluno)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const username = (body.username ?? "").trim().toLowerCase();
    const secret = body.secret ?? "";

    if (!username || !secret) {
      return NextResponse.json(
        { error: "Indica o utilizador e o segredo." },
        { status: 400 }
      );
    }

    const col = await usersCol();
    const doc = await col.findOne({ username });
    if (!doc || !(await verifySecret(secret, doc.secretHash))) {
      return NextResponse.json(
        { error: "Utilizador ou segredo incorrectos." },
        { status: 401 }
      );
    }

    // O estado é verificado depois do segredo, para não revelar a quem adivinha
    // nomes de utilizador quais é que existem.
    const status = userStatus(doc);
    if (status === "suspended") {
      return NextResponse.json(
        { error: "Esta conta está suspensa. Fala com o administrador." },
        { status: 403 }
      );
    }
    if (status === "pending") {
      return NextResponse.json(
        { error: "Esta conta ainda está à espera de aprovação." },
        { status: 403 }
      );
    }

    const user = toAuthUser(doc);
    const token = await signSession(user);
    await col.updateOne({ _id: doc._id }, { $set: { lastSeenAt: new Date() } });

    const res = NextResponse.json({ user });
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (error) {
    console.error("[/api/auth/login]", error);
    const message = error instanceof Error ? error.message : "Erro ao entrar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
