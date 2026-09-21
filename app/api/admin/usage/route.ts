import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/guard";
import { toUsageEventDTO, usageEventsCol } from "@/lib/usage";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requireRole("admin");
  if (gate.error) return gate.error;

  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
    const username = url.searchParams.get("username");

    const col = await usageEventsCol();
    const filter = username ? { username } : {};
    const docs = await col.find(filter).sort({ ts: -1 }).limit(limit).toArray();

    return NextResponse.json({ events: docs.map(toUsageEventDTO) });
  } catch (error) {
    return apiError("/api/admin/usage", error, "Erro ao ler o consumo.");
  }
}
