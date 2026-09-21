import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/guard";
import { assignmentsCol, usersCol, userStatus } from "@/lib/models";
import { currentPeriod, usageCountersCol } from "@/lib/usage";
import type { AdminUserRow } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireRole("admin");
  if (gate.error) return gate.error;

  try {
    const [users, assignments, counters] = await Promise.all([
      usersCol(),
      assignmentsCol(),
      usageCountersCol(),
    ]);

    const docs = await users.find({}).sort({ createdAt: -1 }).toArray();

    // Agregados calculados de uma vez e cruzados em memória — são dezenas de
    // contas, não milhares.
    const [byTutor, byStudent, spend] = await Promise.all([
      assignments
        .aggregate<{ _id: unknown; n: number; done: number }>([
          {
            $group: {
              _id: "$tutorId",
              n: { $sum: 1 },
              done: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            },
          },
        ])
        .toArray(),
      assignments
        .aggregate<{ _id: unknown; n: number; done: number }>([
          {
            $group: {
              _id: "$studentId",
              n: { $sum: 1 },
              done: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            },
          },
        ])
        .toArray(),
      counters.find({ scope: "user", period: currentPeriod() }).toArray(),
    ]);

    const tutorMap = new Map(byTutor.map((r) => [String(r._id), r]));
    const studentMap = new Map(byStudent.map((r) => [String(r._id), r]));
    const spendMap = new Map(spend.map((r) => [r.key, r]));
    const nameById = new Map(docs.map((d) => [d._id!.toString(), d.displayName]));

    const studentsPerTutor = new Map<string, number>();
    for (const d of docs) {
      if (d.role === "student" && d.tutorId) {
        const k = d.tutorId.toString();
        studentsPerTutor.set(k, (studentsPerTutor.get(k) ?? 0) + 1);
      }
    }

    const rows: AdminUserRow[] = docs.map((d) => {
      const id = d._id!.toString();
      const counts =
        d.role === "student" ? studentMap.get(id) : tutorMap.get(id);
      const s = spendMap.get(id);
      return {
        id,
        username: d.username,
        displayName: d.displayName,
        role: d.role,
        status: userStatus(d),
        gradeLevel: d.gradeLevel,
        tutorName: d.tutorId ? nameById.get(d.tutorId.toString()) : undefined,
        createdAt: d.createdAt.toISOString(),
        lastSeenAt: d.lastSeenAt?.toISOString(),
        assignmentsCount: counts?.n ?? 0,
        completedCount: counts?.done ?? 0,
        studentsCount:
          d.role !== "student" ? studentsPerTutor.get(id) ?? 0 : undefined,
        costMicros: s?.costMicros ?? 0,
        calls: s?.calls ?? 0,
      };
    });

    return NextResponse.json({ users: rows });
  } catch (error) {
    return apiError("/api/admin/users", error, "Erro ao listar utilizadores.");
  }
}
