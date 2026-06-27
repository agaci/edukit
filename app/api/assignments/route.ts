import { NextResponse } from "next/server";
import {
  assignmentsCol,
  usersCol,
  toAssignmentDTO,
  ObjectId,
  type AssignmentDoc,
} from "@/lib/models";
import { requireUser, requireRole } from "@/lib/guard";
import type { AssignmentItem, StoredExercise } from "@/types";

export const runtime = "nodejs";

// Lista trabalhos do utilizador (tutor: criados por si; aluno: atribuídos a si).
export async function GET() {
  const g = await requireUser();
  if (g.error) return g.error;

  const col = await assignmentsCol();
  const filter =
    g.user.role === "tutor"
      ? { tutorId: new ObjectId(g.user.id) }
      : { studentId: new ObjectId(g.user.id) };

  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ assignments: docs.map(toAssignmentDTO) });
}

// Cria um trabalho para um ou mais alunos do tutor (atribuição em grupo).
export async function POST(req: Request) {
  const g = await requireRole("tutor");
  if (g.error) return g.error;

  try {
    const body = (await req.json()) as {
      studentId?: string; // compatibilidade (1 aluno)
      studentIds?: string[]; // grupo
      title?: string;
      exercises?: StoredExercise[];
      dueDate?: string | null;
    };
    const exercises = body.exercises ?? [];
    const rawIds = body.studentIds?.length
      ? body.studentIds
      : body.studentId
        ? [body.studentId]
        : [];
    const ids = Array.from(new Set(rawIds)).filter((x) => ObjectId.isValid(x));

    if (ids.length === 0) {
      return NextResponse.json({ error: "Escolhe pelo menos um aluno." }, { status: 400 });
    }
    if (exercises.length < 1) {
      return NextResponse.json(
        { error: "O trabalho tem de ter pelo menos 1 exercício." },
        { status: 400 }
      );
    }

    // Prazo opcional.
    let dueDate: Date | undefined;
    if (body.dueDate) {
      const d = new Date(body.dueDate);
      if (!Number.isNaN(d.getTime())) dueDate = d;
    }

    const users = await usersCol();
    const tutorId = new ObjectId(g.user.id);
    const students = await users
      .find({
        _id: { $in: ids.map((x) => new ObjectId(x)) },
        role: "student",
        tutorId,
      })
      .toArray();
    if (students.length !== ids.length) {
      return NextResponse.json(
        { error: "Um ou mais alunos não existem ou não são teus." },
        { status: 404 }
      );
    }

    const now = new Date();
    const docs: AssignmentDoc[] = students.map((student) => ({
      tutorId,
      tutorName: g.user.displayName,
      studentId: student._id!,
      studentUsername: student.username,
      studentName: student.displayName,
      title: body.title?.trim() || undefined,
      status: "pending",
      items: exercises.map((exercise): AssignmentItem => ({ exercise })),
      dueDate,
      createdAt: now,
    }));

    const col = await assignmentsCol();
    const { insertedIds } = await col.insertMany(docs);
    const created = docs.map((doc, i) =>
      toAssignmentDTO({ ...doc, _id: insertedIds[i] })
    );

    return NextResponse.json({ assignments: created, count: created.length });
  } catch (error) {
    console.error("[/api/assignments POST]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar o trabalho.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
