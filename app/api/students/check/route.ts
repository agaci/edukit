import { NextResponse } from "next/server";
import { usersCol } from "@/lib/models";
import { requireAnyRole } from "@/lib/guard";
import { slugifyUsername } from "@/lib/utils";

export const runtime = "nodejs";

// Sugere um username disponível a partir de um nome (verifica unicidade).
export async function GET(req: Request) {
  const g = await requireAnyRole(["tutor", "admin"]);
  if (g.error) return g.error;

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "";
  const base = slugifyUsername(name);

  const col = await usersCol();
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await col.findOne({ username: candidate })) {
    n += 1;
    candidate = `${base}${n}`;
  }

  return NextResponse.json({ username: candidate, available: candidate === base });
}
