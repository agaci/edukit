import { NextResponse } from "next/server";
import { usersCol, toAuthUser, type UserDoc } from "@/lib/models";
import { hashSecret, signSession, COOKIE_NAME, cookieOptions } from "@/lib/auth";
import { slugifyUsername } from "@/lib/utils";
import { getServerSettings } from "@/lib/settings";

export const runtime = "nodejs";

/** Mínimo para contas de tutor. Os PIN de aluno são tratados noutro sítio. */
const MIN_PASSWORD = 8;

interface Body {
  displayName?: string;
  username?: string;
  password?: string;
}

export async function POST(req: Request) {
  try {
    const settings = await getServerSettings();
    if (settings.registrationMode === "closed") {
      return NextResponse.json(
        { error: "Os registos estão fechados de momento." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as Body;
    const displayName = (body.displayName ?? "").trim();
    const password = body.password ?? "";
    const username = slugifyUsername(body.username || displayName);

    if (!displayName) {
      return NextResponse.json({ error: "Indica o teu nome." }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD) {
      return NextResponse.json(
        {
          error: `A palavra-passe deve ter pelo menos ${MIN_PASSWORD} caracteres.`,
        },
        { status: 400 }
      );
    }

    const col = await usersCol();
    const exists = await col.findOne({ username });
    if (exists) {
      return NextResponse.json(
        { error: `O utilizador "${username}" já existe. Escolhe outro.` },
        { status: 409 }
      );
    }

    // Em modo "approval" a conta nasce inactiva: é criada, mas não consome
    // nada até um administrador a aprovar. É isto que impede o orçamento de
    // desaparecer no primeiro dia com o registo aberto ao público.
    const needsApproval = settings.registrationMode === "approval";

    const doc: UserDoc = {
      role: "tutor",
      username,
      displayName,
      secretHash: await hashSecret(password),
      createdAt: new Date(),
      status: needsApproval ? "pending" : "active",
    };
    const { insertedId } = await col.insertOne(doc);

    if (needsApproval) {
      return NextResponse.json({
        user: null,
        pending: true,
        message:
          "Conta criada. Fica à espera de aprovação do administrador — volta a tentar entrar mais tarde.",
      });
    }

    const user = toAuthUser({ ...doc, _id: insertedId });
    const token = await signSession(user);
    const res = NextResponse.json({ user, pending: false });
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (error) {
    console.error("[/api/auth/register]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar a conta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
