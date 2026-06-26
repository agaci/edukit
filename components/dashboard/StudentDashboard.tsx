"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  CheckCircle2,
  Clock,
  Trophy,
  PencilLine,
  BookOpen,
  Calculator,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { listAssignments } from "@/lib/api";
import { scoreColor } from "@/lib/utils";
import type { AssignmentDTO } from "@/types";

const TYPE_ICON = {
  ditado: PencilLine,
  compreensao: BookOpen,
  matematica: Calculator,
};

export function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<AssignmentDTO[] | null>(null);

  useEffect(() => {
    listAssignments()
      .then((r) => setAssignments(r.assignments))
      .catch((e) => {
        setAssignments([]);
        toast(e instanceof Error ? e.message : "Erro a carregar.", "error");
      });
  }, [toast]);

  if (!assignments) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  const pending = assignments.filter((a) => a.status !== "completed");
  const done = assignments.filter((a) => a.status === "completed");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Olá, {user?.displayName?.split(" ")[0]}!
        </h1>
        <p className="text-slate-500">
          {pending.length > 0
            ? `Tens ${pending.length} trabalho${pending.length > 1 ? "s" : ""} para fazer.`
            : "Não tens trabalhos pendentes. Bom trabalho!"}
        </p>
      </motion.div>

      {/* Pendentes */}
      {pending.length > 0 && (
        <section className="space-y-4">
          {pending.map((a) => (
            <Card key={a.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {a.title || "Trabalho"}
                </CardTitle>
                <Badge tone={a.status === "in_progress" ? "warning" : "primary"}>
                  {a.status === "in_progress" ? "A meio" : "Novo"}
                </Badge>
              </div>
              <p className="text-sm text-slate-400">De {a.tutorName}</p>
              <div className="flex gap-2">
                {a.items.map((it, i) => {
                  const Icon = TYPE_ICON[it.exercise.type];
                  const done = typeof it.score === "number";
                  return (
                    <div
                      key={i}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 p-3 ${
                        done
                          ? "border-success/40 bg-success/5"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <Icon
                        size={22}
                        className={done ? "text-success" : "text-slate-400"}
                      />
                      <span className="text-xs font-semibold text-slate-500">
                        {done ? `${it.score?.toFixed(1)}` : `Ex. ${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href={`/aluno/trabalho/${a.id}`}>
                <Button size="lg" fullWidth icon={<Play size={20} />}>
                  {a.status === "in_progress" ? "Continuar" : "Começar"}
                </Button>
              </Link>
            </Card>
          ))}
        </section>
      )}

      {/* Concluídos */}
      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Trabalhos concluídos
          </h2>
          {done.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-ink">
                  {a.title || "Trabalho"}
                </p>
                <p className="flex items-center gap-1 text-sm text-slate-400">
                  <CheckCircle2 size={14} className="text-success" />
                  Concluído
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Trophy
                  size={18}
                  className={
                    a.finalScore !== undefined
                      ? scoreColor(a.finalScore).text
                      : "text-slate-300"
                  }
                />
                <span
                  className={`font-display text-2xl font-extrabold ${
                    a.finalScore !== undefined
                      ? scoreColor(a.finalScore).text
                      : "text-slate-300"
                  }`}
                >
                  {a.finalScore?.toFixed(1) ?? "—"}
                </span>
              </div>
            </Card>
          ))}
        </section>
      )}

      {assignments.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Clock size={40} className="text-slate-300" />
          <p className="text-slate-500">
            Ainda não tens trabalhos. O teu tutor vai criar exercícios para ti.
          </p>
        </Card>
      )}
    </div>
  );
}
