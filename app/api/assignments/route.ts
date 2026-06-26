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

// Cria um trabalho (3 exercícios) para um aluno do tutor.
export async function POST(req: Request) {
  const g = await requireRole("tutor");
  if (g.error) return g.error;

  try {
    const body = (await req.json()) as {
      studentId?: string;
      title?: string;
      exercises?: StoredExercise[];
    };
    const exercises = body.exercises ?? [];

    if (!body.studentId || !ObjectId.isValid(body.studentId)) {
      return NextResponse.json({ error: "Aluno inválido." }, { status: 400 });
    }
    if (exercises.length !== 3) {
      return NextResponse.json(
        { error: "Um trabalho tem de ter exactamente 3 exercícios." },
        { status: 400 }
      );
    }

    const users = await usersCol();
    const student = await users.findOne({
      _id: new ObjectId(body.studentId),
      role: "student",
      tutorId: new ObjectId(g.user.id),
    });
    if (!student) {
      return NextResponse.json(
        { error: "Esse aluno não existe ou não é teu." },
        { status: 404 }
      );
    }

    const items: AssignmentItem[] = exercises.map((exercise) => ({ exercise }));
    const doc: AssignmentDoc = {
      tutorId: new ObjectId(g.user.id),
      tutorName: g.user.displayName,
      studentId: student._id!,
      studentUsername: student.username,
      studentName: student.displayName,
      title: body.title?.trim() || undefined,
      status: "pending",
      items,
      createdAt: new Date(),
    };

    const col = await assignmentsCol();
    const { insertedId } = await col.insertOne(doc);
    return NextResponse.json({
      assignment: toAssignmentDTO({ ...doc, _id: insertedId }),
    });
  } catch (error) {
    console.error("[/api/assignments POST]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar o trabalho.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
