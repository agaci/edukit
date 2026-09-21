"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/components/auth/AuthProvider";
import { listAssignments, listStudents } from "@/lib/api";
import { scoreColor, exerciseLabelShort, formatDate, isTutorLike } from "@/lib/utils";
import type { AssignmentDTO, StudentSummary } from "@/types";

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

// --- Mini gráficos ------------------------------------------------------------

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 34;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${i * step},${h - (Math.max(0, Math.min(20, v)) / 20) * h}`)
    .join(" ");
  const last = values[values.length - 1];
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={scoreColor(last).hex}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - (Math.max(0, Math.min(20, v)) / 20) * h}
          r={2.5}
          fill={scoreColor(v).hex}
        />
      ))}
    </svg>
  );
}

function BarRow({ label, value, count }: { label: string; value: number; count: number }) {
  const pct = (value / 20) * 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="text-slate-400">
          <b className={scoreColor(value).text}>{value.toFixed(1)}</b> · {count}{" "}
          {count === 1 ? "exercício" : "exercícios"}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: scoreColor(value).hex }}
        />
      </div>
    </div>
  );
}

// --- Página -------------------------------------------------------------------

export default function ResultadosPage() {
  const { user, loading } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentDTO[] | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);

  useEffect(() => {
    listAssignments()
      .then((r) => setAssignments(r.assignments))
      .catch(() => setAssignments([]));
    listStudents()
      .then((r) => setStudents(r.students))
      .catch(() => setStudents([]));
  }, []);

  const stats = useMemo(() => {
    if (!assignments) return null;
    const completed = assignments.filter(
      (a) => a.status === "completed" && a.finalScore !== undefined
    );
    const overallAvg = completed.length
      ? mean(completed.map((a) => a.finalScore as number))
      : null;

    // Média por tipo de exercício
    const typeScores: Record<string, number[]> = {};
    for (const a of assignments) {
      for (const it of a.items) {
        if (typeof it.score === "number") {
          (typeScores[it.exercise.type] ??= []).push(it.score);
        }
      }
    }
    const byType = Object.entries(typeScores)
      .map(([type, arr]) => ({ type, avg: mean(arr), count: arr.length }))
      .sort((a, b) => b.avg - a.avg);

    // Desempenho por aluno
    const gradeMap = new Map(students.map((s) => [s.id, s.gradeLevel]));
    const studentMap = new Map<
      string,
      { name: string; gradeLevel?: number; series: number[]; count: number }
    >();
    for (const a of [...completed].sort(
      (x, y) =>
        new Date(x.completedAt ?? x.createdAt).getTime() -
        new Date(y.completedAt ?? y.createdAt).getTime()
    )) {
      const e = studentMap.get(a.studentId) ?? {
        name: a.studentName,
        gradeLevel: gradeMap.get(a.studentId),
        series: [],
        count: 0,
      };
      e.series.push(a.finalScore as number);
      e.count += 1;
      studentMap.set(a.studentId, e);
    }
    const byStudent = Array.from(studentMap.values())
      .map((s) => ({ ...s, avg: mean(s.series) }))
      .sort((a, b) => b.avg - a.avg);

    // Evolução por repetições
    const repeated = assignments
      .filter((a) => a.attempts && a.attempts.length > 0)
      .map((a) => {
        const series = [
          ...a.attempts!.map((at) => at.finalScore),
          a.status === "completed" ? a.finalScore : undefined,
        ].filter((v): v is number => typeof v === "number");
        const delta =
          series.length >= 2 ? series[series.length - 1] - series[0] : 0;
        return { a, series, delta };
      })
      .filter((r) => r.series.length >= 2);

    return {
      total: assignments.length,
      completedCount: completed.length,
      overallAvg,
      byType,
      byStudent,
      repeated,
    };
  }, [assignments, students]);

  if (loading || !assignments || !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (user && !isTutorLike(user.role)) {
    return null;
  }

  const empty = stats.completedCount === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-8"
    >
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Painel
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold text-ink">
          <BarChart3 size={28} className="text-secondary" /> Resultados
        </h1>
        <p className="text-slate-500">Evolução e desempenho dos teus alunos.</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Users size={20} />} value={students.length} label="Alunos" />
        <StatCard
          icon={<ClipboardList size={20} />}
          value={stats.total}
          label="Trabalhos"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          value={stats.completedCount}
          label="Concluídos"
        />
        <StatCard
          icon={<Trophy size={20} />}
          value={stats.overallAvg ?? "—"}
          label="Média geral"
          color={stats.overallAvg !== null ? scoreColor(stats.overallAvg).text : ""}
        />
      </div>

      {empty ? (
        <Card className="text-center text-slate-500">
          Ainda não há trabalhos concluídos. Os gráficos aparecem assim que os
          alunos terminarem testes.
        </Card>
      ) : (
        <>
          {/* Média por tipo */}
          {stats.byType.length > 0 && (
            <section className="space-y-3">
              <CardTitle className="text-xl">Média por tipo de exercício</CardTitle>
              <Card className="space-y-4">
                {stats.byType.map((t) => (
                  <BarRow
                    key={t.type}
                    label={exerciseLabelShort(t.type)}
                    value={t.avg}
                    count={t.count}
                  />
                ))}
              </Card>
            </section>
          )}

          {/* Desempenho por aluno */}
          {stats.byStudent.length > 0 && (
            <section className="space-y-3">
              <CardTitle className="text-xl">Desempenho por aluno</CardTitle>
              <div className="space-y-3">
                {stats.byStudent.map((s, i) => (
                  <Card key={i} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink">{s.name}</p>
                      <p className="text-sm text-slate-400">
                        {s.gradeLevel ? `${s.gradeLevel}.º ano · ` : ""}
                        {s.count} {s.count === 1 ? "teste" : "testes"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Sparkline values={s.series} />
                      <span
                        className={`w-12 text-right font-display text-2xl font-extrabold ${
                          scoreColor(s.avg).text
                        }`}
                      >
                        {s.avg.toFixed(1)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Evolução por repetições */}
          {stats.repeated.length > 0 && (
            <section className="space-y-3">
              <CardTitle className="text-xl">Melhoria com as repetições</CardTitle>
              <div className="space-y-3">
                {stats.repeated.map(({ a, series, delta }) => (
                  <Card key={a.id} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display font-bold text-ink">
                          {a.title || "Trabalho"}
                        </p>
                        <p className="text-sm text-slate-400">{a.studentName}</p>
                      </div>
                      <DeltaBadge delta={delta} />
                    </div>
                    <div className="flex items-end gap-2">
                      {series.map((v, i) => (
                        <div
                          key={i}
                          className="flex flex-1 flex-col items-center gap-1"
                        >
                          <span className="text-xs font-bold text-slate-500">
                            {v.toFixed(1)}
                          </span>
                          <div
                            className="w-full rounded-t-md"
                            style={{
                              height: `${Math.max(6, (v / 20) * 80)}px`,
                              backgroundColor: scoreColor(v).hex,
                            }}
                          />
                          <span className="text-[10px] text-slate-400">
                            {i + 1}.ª
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <p className="text-center text-sm text-slate-400">
        Última atualização: {formatDate(new Date().toISOString())}
      </p>
    </motion.div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color?: string;
}) {
  return (
    <Card className="flex flex-col items-center py-5 text-center">
      <span className="text-secondary">{icon}</span>
      <span className={`mt-1 font-display text-2xl font-extrabold ${color ?? "text-ink"}`}>
        {value}
      </span>
      <span className="text-sm text-slate-400">{label}</span>
    </Card>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0.05) {
    return (
      <Badge tone="success">
        <TrendingUp size={14} /> +{delta.toFixed(1)}
      </Badge>
    );
  }
  if (delta < -0.05) {
    return (
      <Badge tone="danger">
        <TrendingDown size={14} /> {delta.toFixed(1)}
      </Badge>
    );
  }
  return (
    <Badge tone="neutral">
      <Minus size={14} /> igual
    </Badge>
  );
}
