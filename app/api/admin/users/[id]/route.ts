import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/guard";
import { ObjectId, usersCol } from "@/lib/models";
import type { UserStatus } from "@/types";

export const runtime = "nodejs";

const ALLOWED: UserStatus[] = ["active", "suspended", "pending"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireRole("admin");
  if (gate.error) return gate.error;

  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Utilizador inválido." }, { status: 400 });
    }
    const body = (await req.json()) as { status?: UserStatus };
    const status = body.status;
    if (!status || !ALLOWED.includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    const col = await usersCol();
    const target = await col.findOne({ _id: new ObjectId(params.id) });
    if (!target) {
      return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    }

    // Duas protecções contra ficar sem forma de entrar: um administrador não se
    // suspende a si próprio, e não se suspende o último administrador activo.
    if (status !== "active" && target._id!.toString() === gate.user.id) {
      return NextResponse.json(
        { error: "Não podes suspender a tua própria conta." },
        { status: 400 }
      );
    }
    if (status !== "active" && target.role === "admin") {
      const activeAdmins = await col.countDocuments({
        role: "admin",
        status: { $ne: "suspended" },
      });
      if (activeAdmins <= 1) {
        return NextResponse.json(
          { error: "É o único administrador activo — não pode ser suspenso." },
          { status: 400 }
        );
      }
    }

    const set: Record<string, unknown> = { status };
    if (status === "active" && (target.status ?? "active") === "pending") {
      set.approvedAt = new Date();
      set.approvedBy = gate.user.username;
    }
    await col.updateOne({ _id: target._id }, { $set: set });

    console.log(
      `[admin] ${gate.user.username} mudou ${target.username} para ${status}`
    );
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return apiError("/api/admin/users/:id", error, "Erro ao actualizar a conta.");
  }
}
