import { NextResponse } from "next/server";
import { usersCol, toAuthUser, type UserDoc } from "@/lib/models";
import { hashSecret, signSession, COOKIE_NAME, cookieOptions } from "@/lib/auth";
import { slugifyUsername } from "@/lib/utils";

export const runtime = "nodejs";

interface Body {
  displayName?: string;
  username?: string;
  password?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const displayName = (body.displayName ?? "").trim();
    const password = body.password ?? "";
    const username = slugifyUsername(body.username || displayName);

    if (!displayName) {
      return NextResponse.json({ error: "Indica o teu nome." }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json(
        { error: "A palavra-passe deve ter pelo menos 4 caracteres." },
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

    const doc: UserDoc = {
      role: "tutor",
      username,
      displayName,
      secretHash: await hashSecret(password),
      createdAt: new Date(),
    };
    const { insertedId } = await col.insertOne(doc);
    const user = toAuthUser({ ...doc, _id: insertedId });

    const token = await signSession(user);
    const res = NextResponse.json({ user });
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (error) {
    console.error("[/api/auth/register]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar a conta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
