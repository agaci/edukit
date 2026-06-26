import { NextResponse } from "next/server";
import {
  usersCol,
  assignmentsCol,
  ObjectId,
  type UserDoc,
} from "@/lib/models";
import { hashSecret } from "@/lib/auth";
import { requireRole } from "@/lib/guard";
import { slugifyUsername } from "@/lib/utils";
import type { StudentSummary } from "@/types";

export const runtime = "nodejs";

async function findAvailableUsername(base: string): Promise<string> {
  const col = await usersCol();
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await col.findOne({ username: candidate })) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

// Lista os alunos do tutor autenticado.
export async function GET() {
  const g = await requireRole("tutor");
  if (g.error) return g.error;

  const col = await usersCol();
  const tutorId = new ObjectId(g.user.id);
  const students = await col
    .find({ role: "student", tutorId })
    .sort({ createdAt: -1 })
    .toArray();

  const aCol = await assignmentsCol();
  const counts = await aCol
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: { tutorId } },
      { $group: { _id: "$studentId", count: { $sum: 1 } } },
    ])
    .toArray();
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const result: StudentSummary[] = students.map((s) => ({
    id: s._id!.toString(),
    username: s.username,
    displayName: s.displayName,
    createdAt: s.createdAt.toISOString(),
    assignmentsCount: countMap.get(s._id!.toString()) ?? 0,
  }));

  return NextResponse.json({ students: result });
}

// Cria um aluno (com username único) para o tutor autenticado.
export async function POST(req: Request) {
  const g = await requireRole("tutor");
  if (g.error) return g.error;

  try {
    const body = (await req.json()) as {
      displayName?: string;
      username?: string;
      pin?: string;
    };
    const displayName = (body.displayName ?? "").trim();
    const pin = (body.pin ?? "").trim();

    if (!displayName) {
      return NextResponse.json({ error: "Indica o nome do aluno." }, { status: 400 });
    }
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { error: "O PIN deve ter 4 a 6 dígitos." },
        { status: 400 }
      );
    }

    const col = await usersCol();
    const base = slugifyUsername(body.username || displayName);

    let username: string;
    if (body.username) {
      // Username escolhido explicitamente: rejeita se estiver ocupado.
      const taken = await col.findOne({ username: base });
      if (taken) {
        const suggestion = await findAvailableUsername(base);
        return NextResponse.json(
          {
            error: `O utilizador "${base}" já existe.`,
            suggestion,
          },
          { status: 409 }
        );
      }
      username = base;
    } else {
      username = await findAvailableUsername(base);
    }

    const doc: UserDoc = {
      role: "student",
      username,
      displayName,
      secretHash: await hashSecret(pin),
      tutorId: new ObjectId(g.user.id),
      createdAt: new Date(),
    };
    const { insertedId } = await col.insertOne(doc);

    const student: StudentSummary = {
      id: insertedId.toString(),
      username,
      displayName,
      createdAt: doc.createdAt.toISOString(),
      assignmentsCount: 0,
    };
    return NextResponse.json({ student });
  } catch (error) {
    console.error("[/api/students POST]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar o aluno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
