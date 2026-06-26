import { NextResponse } from "next/server";
import type { ImagePayload } from "@/lib/anthropic";
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
  try {
    const body = (await req.json()) as Body;
    const gradeLevel = Number(body.gradeLevel) || 3;
    const image: ImagePayload | undefined = body.photoBase64
      ? { base64: body.photoBase64, mimeType: body.mimeType ?? "image/jpeg" }
      : undefined;

    if (body.type === "ditado") {
      const result = await gradeDitado({
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
        exercises: body.exercises ?? [],
        image,
        gradeLevel,
        timeSpent: body.timeSpent,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  } catch (error) {
    console.error("[/api/corrigir]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao corrigir o exercício.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
