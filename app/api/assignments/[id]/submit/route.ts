import { NextResponse } from "next/server";
import {
  assignmentsCol,
  toAssignmentDTO,
  ObjectId,
  type AssignmentDoc,
} from "@/lib/models";
import { apiError, requireAiAccessAs } from "@/lib/guard";
import type { ImagePayload } from "@/lib/anthropic";
import {
  gradeDitado,
  gradeCompreensao,
  gradeMatematica,
  gradeTraducao,
  gradeInterpretacao,
} from "@/lib/grade";
import type { AssignmentItem, ExerciseResult, MathResult } from "@/types";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const g = await requireAiAccessAs("student");
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
      answers?: number[]; // interpretação (escolha múltipla)
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
        actor: g.user,
        originalText: exercise.text,
        studentText: body.studentText,
        image,
        gradeLevel: exercise.gradeLevel,
        timeSpent: body.timeSpent,
      });
    } else if (exercise.type === "compreensao") {
      result = await gradeCompreensao({
        actor: g.user,
        originalText: exercise.text,
        studentText: body.studentText ?? "",
        gradeLevel: exercise.gradeLevel,
        timeSpent: body.timeSpent,
      });
    } else if (
      exercise.type === "traducao-en-pt" ||
      exercise.type === "traducao-pt-en"
    ) {
      result = await gradeTraducao({
        actor: g.user,
        sourceText: exercise.sourceText,
        direction: exercise.type === "traducao-en-pt" ? "en-pt" : "pt-en",
        studentText: body.studentText ?? "",
        gradeLevel: exercise.gradeLevel,
        timeSpent: body.timeSpent,
      });
    } else if (exercise.type === "interpretacao-en") {
      result = gradeInterpretacao({
        questions: exercise.questions,
        answers: body.answers ?? [],
        timeSpent: body.timeSpent,
      });
    } else {
      // matemática
      if (!image) {
        return NextResponse.json(
          { error: "Falta a fotografia da resolução." },
          { status: 400 }
        );
      }
      const math = await gradeMatematica({
        actor: g.user,
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

    // Actualiza o item resolvido (guarda a resposta do aluno para o tutor ver).
    const updatedItem: AssignmentItem = {
      ...item,
      result,
      score: result.score,
      completedAt: new Date().toISOString(),
      studentAnswer: image ? undefined : body.studentText,
      viaPhoto: !!image,
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
    return apiError(
      "/api/assignments/:id/submit",
      error,
      "Erro ao corrigir o exercício."
    );
  }
}
