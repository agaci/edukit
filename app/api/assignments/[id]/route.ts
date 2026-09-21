import { NextResponse } from "next/server";
import { assignmentsCol, toAssignmentDTO, ObjectId } from "@/lib/models";
import { requireUser } from "@/lib/guard";
import { isTutorLike } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const g = await requireUser();
  if (g.error) return g.error;

  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Trabalho inválido." }, { status: 400 });
  }

  const col = await assignmentsCol();
  const doc = await col.findOne({ _id: new ObjectId(params.id) });
  if (!doc) {
    return NextResponse.json({ error: "Trabalho não encontrado." }, { status: 404 });
  }

  const owns =
    (isTutorLike(g.user.role) && doc.tutorId.toString() === g.user.id) ||
    (g.user.role === "student" && doc.studentId.toString() === g.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  return NextResponse.json({ assignment: toAssignmentDTO(doc) });
}
