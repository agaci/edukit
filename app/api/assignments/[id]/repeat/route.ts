import { NextResponse } from "next/server";
import { assignmentsCol, toAssignmentDTO, ObjectId } from "@/lib/models";
import { requireRole } from "@/lib/guard";
import type { AssignmentItem, PastAttempt } from "@/types";

export const runtime = "nodejs";

// O tutor manda repetir o teste: arquiva a tentativa atual no histórico e
// repõe os exercícios (mesmo enunciado) para o aluno voltar a resolver.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const g = await requireRole("tutor");
  if (g.error) return g.error;

  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Trabalho inválido." }, { status: 400 });
    }

    const col = await assignmentsCol();
    const doc = await col.findOne({ _id: new ObjectId(params.id) });
    if (!doc) {
      return NextResponse.json({ error: "Trabalho não encontrado." }, { status: 404 });
    }
    if (doc.tutorId.toString() !== g.user.id) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const hasResults = doc.items.some((it) => typeof it.score === "number");
    if (!hasResults) {
      return NextResponse.json(
        { error: "Ainda não há nada para repetir — o aluno não resolveu este teste." },
        { status: 400 }
      );
    }

    const pastAttempt: PastAttempt = {
      attemptNumber: doc.attemptNumber ?? 1,
      items: doc.items,
      finalScore: doc.finalScore,
      completedAt: doc.completedAt?.toISOString(),
    };

    // Repõe os exercícios mantendo o enunciado original.
    const resetItems: AssignmentItem[] = doc.items.map((it) => ({
      exercise: it.exercise,
    }));

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          items: resetItems,
          status: "pending",
          attemptNumber: (doc.attemptNumber ?? 1) + 1,
        },
        $push: { attempts: pastAttempt },
        $unset: { finalScore: "", completedAt: "", dueDate: "" },
      }
    );

    const updated = await col.findOne({ _id: doc._id });
    return NextResponse.json({ assignment: toAssignmentDTO(updated!) });
  } catch (error) {
    console.error("[/api/assignments/:id/repeat]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao repetir o trabalho.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
