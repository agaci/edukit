import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/guard";
import { assignmentsCol, usersCol } from "@/lib/models";
import { getServerSettings } from "@/lib/settings";
import { currentPeriod, getGlobalSpend, usageEventsCol } from "@/lib/usage";
import type { AdminOverview, OperationSpend } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireRole("admin");
  if (gate.error) return gate.error;

  try {
    const settings = await getServerSettings();
    const [spend, users, assignments, events] = await Promise.all([
      getGlobalSpend(settings),
      usersCol(),
      assignmentsCol(),
      usageEventsCol(),
    ]);

    const period = currentPeriod();
    const start = new Date(`${period}-01T00:00:00Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const [roleCounts, pending, totalAssignments, completed, byOperation] =
      await Promise.all([
        users
          .aggregate<{ _id: string; n: number }>([
            { $group: { _id: "$role", n: { $sum: 1 } } },
          ])
          .toArray(),
        users.countDocuments({ status: "pending" }),
        assignments.countDocuments({}),
        assignments.countDocuments({ status: "completed" }),
        events
          .aggregate<OperationSpend>([
            { $match: { ts: { $gte: start, $lt: end } } },
            {
              $group: {
                _id: "$operation",
                calls: { $sum: 1 },
                costMicros: { $sum: "$costMicros" },
                inputTokens: { $sum: "$inputTokens" },
                outputTokens: { $sum: "$outputTokens" },
              },
            },
            {
              $project: {
                _id: 0,
                operation: "$_id",
                calls: 1,
                costMicros: 1,
                inputTokens: 1,
                outputTokens: 1,
              },
            },
            { $sort: { costMicros: -1 } },
          ])
          .toArray(),
      ]);

    const byRole = (role: string) =>
      roleCounts.find((r) => r._id === role)?.n ?? 0;

    const overview: AdminOverview = {
      spend,
      settings,
      totals: {
        admins: byRole("admin"),
        tutors: byRole("tutor"),
        students: byRole("student"),
        pending,
        assignments: totalAssignments,
        completed,
      },
      byOperation,
    };
    return NextResponse.json(overview);
  } catch (error) {
    return apiError("/api/admin/overview", error, "Erro ao ler o resumo.");
  }
}
