import { NextResponse } from "next/server";
import type { ImagePayload } from "@/lib/anthropic";
import { apiError, requireAiAccess } from "@/lib/guard";
import { gradeDitado, gradeCompreensao, gradeMatematica } from "@/lib/grade";
import type { Exercise } from "@/types";

export const runtime = "nodejs";

interface Body {
  type: "ditado" | "compreensao" | "matematica";
  originalText?: string;
  studentText?: string;
  photoBase64?: string;
  mimeType?: string;
  gradeLevel?: number;
  timeSpent?: number;
  exercises?: Exercise[];
}

export async function POST(req: Request) {
  // Rota paga: exige sessão, conta activa e interruptor geral ligado.
  const gate = await requireAiAccess();
  if (gate.error) return gate.error;

  try {
    const body = (await req.json()) as Body;
    const gradeLevel = Number(body.gradeLevel) || 3;
    const image: ImagePayload | undefined = body.photoBase64
      ? { base64: body.photoBase64, mimeType: body.mimeType ?? "image/jpeg" }
      : undefined;

    if (body.type === "ditado") {
      const result = await gradeDitado({
        actor: gate.user,
        originalText: body.originalText ?? "",
        studentText: body.studentText,
        image,
        gradeLevel,
        timeSpent: body.timeSpent,
      });
      return NextResponse.json(result);
    }

    if (body.type === "compreensao") {
      const result = await gradeCompreensao({
        actor: gate.user,
        originalText: body.originalText ?? "",
        studentText: body.studentText ?? "",
        gradeLevel,
        timeSpent: body.timeSpent,
      });
      return NextResponse.json(result);
    }

    if (body.type === "matematica") {
      if (!image) {
        return NextResponse.json(
          { error: "Falta a fotografia da resolução." },
          { status: 400 }
        );
      }
      const result = await gradeMatematica({
        actor: gate.user,
        exercises: body.exercises ?? [],
        image,
        gradeLevel,
        timeSpent: body.timeSpent,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  } catch (error) {
    return apiError("/api/corrigir", error, "Erro ao corrigir o exercício.");
  }
}
