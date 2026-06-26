import { NextResponse } from "next/server";
import {
  assignmentsCol,
  toAssignmentDTO,
  ObjectId,
  type AssignmentDoc,
} from "@/lib/models";
import { requireRole } from "@/lib/guard";
import type { ImagePayload } from "@/lib/anthropic";
import { gradeDitado, gradeCompreensao, gradeMatematica } from "@/lib/grade";
import type { AssignmentItem, ExerciseResult, MathResult } from "@/types";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const g = await requireRole("student");
  if (g.error) return g.error;

  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Trabalho inválido." }, { status: 400 });
    }

    const body = (await req.json()) as {
      index?: number;
      studentText?: string;
      photoBase64?: string;
      mimeType?: string;
      timeSpent?: number;
    };

    const col = await assignmentsCol();
    const doc = await col.findOne({ _id: new ObjectId(params.id) });
    if (!doc) {
      return NextResponse.json({ error: "Trabalho não encontrado." }, { status: 404 });
    }
    if (doc.studentId.toString() !== g.user.id) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const index = Number(body.index);
    if (!Number.isInteger(index) || index < 0 || index >= doc.items.length) {
      return NextResponse.json({ error: "Exercício inválido." }, { status: 400 });
    }

    const item = doc.items[index];
    const { exercise } = item;
    const image: ImagePayload | undefined = body.photoBase64
      ? { base64: body.photoBase64, mimeType: body.mimeType ?? "image/jpeg" }
      : undefined;

    let result: ExerciseResult | MathResult;

    if (exercise.type === "ditado") {
      result = await gradeDitado({
        originalText: exercise.text,
        studentText: body.studentText,
        image,
        gradeLevel: exercise.gradeLevel,
        timeSpent: body.timeSpent,
      });
    } else if (exercise.type === "compreensao") {
      result = await gradeCompreensao({
        originalText: exercise.text,
        studentText: body.studentText ?? "",
        gradeLevel: exercise.gradeLevel,
        timeSpent: body.timeSpent,
      });
    } else {
      if (!image) {
        return NextResponse.json(
          { error: "Falta a fotografia da resolução." },
          { status: 400 }
        );
      }
      const math = await gradeMatematica({
        exercises: exercise.exercises,
        image,
        gradeLevel: exercise.gradeLevel,
        timeSpent: body.timeSpent,
      });
      // Foto ilegível: devolve sem guardar para o aluno repetir.
      if (math.illegible) {
        return NextResponse.json({ result: math, illegible: true });
      }
      result = math;
    }

    // Actualiza o item resolvido.
    const updatedItem: AssignmentItem = {
      ...item,
      result,
      score: result.score,
      completedAt: new Date().toISOString(),
    };
    const items = [...doc.items];
    items[index] = updatedItem;

    const allDone = items.every((it) => typeof it.score === "number");
    const finalScore = allDone
      ? Math.round(
          (items.reduce((acc, it) => acc + (it.score ?? 0), 0) / items.length) * 10
        ) / 10
      : undefined;

    const status = allDone ? ("completed" as const) : ("in_progress" as const);
    const setFields: Partial<AssignmentDoc> = { items, status };
    if (allDone) {
      setFields.finalScore = finalScore;
      setFields.completedAt = new Date();
    }
    await col.updateOne({ _id: doc._id }, { $set: setFields });

    const updated = { ...doc, items, status, finalScore };
    return NextResponse.json({
      result,
      assignment: toAssignmentDTO(updated),
    });
  } catch (error) {
    console.error("[/api/assignments/:id/submit]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao corrigir o exercício.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
