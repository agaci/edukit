import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ExerciseCorrection } from "@/types";

export function MathExerciseResult({
  er,
  statement,
}: {
  er: ExerciseCorrection;
  statement?: string;
}) {
  const map = {
    correct: {
      icon: <CheckCircle2 className="text-success" size={22} />,
      tone: "success" as const,
      label: "Correcto",
      border: "border-success/40",
    },
    partial: {
      icon: <AlertTriangle className="text-warning" size={22} />,
      tone: "warning" as const,
      label: "Parcialmente correcto",
      border: "border-warning/40",
    },
    incorrect: {
      icon: <XCircle className="text-danger" size={22} />,
      tone: "danger" as const,
      label: "Incorrecto",
      border: "border-danger/40",
    },
  };
  const m = map[er.correct] ?? map.incorrect;

  return (
    <Card className={`border-2 ${m.border}`}>
      <div className="mb-2 flex items-center gap-2">
        {m.icon}
        <span className="font-display font-extrabold text-ink">
          Exercício {er.exerciseId}
        </span>
        <Badge tone={m.tone} className="ml-auto">
          {m.label}
        </Badge>
      </div>
      {statement && <p className="mb-3 text-sm text-slate-500">{statement}</p>}
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <span className="block text-xs font-semibold uppercase text-slate-400">
            A tua resposta
          </span>
          <span className="font-display font-bold text-ink">
            {er.studentAnswer || "—"}
          </span>
        </div>
        <div className="rounded-xl bg-success/10 p-3">
          <span className="block text-xs font-semibold uppercase text-slate-400">
            Resposta correcta
          </span>
          <span className="font-display font-bold text-success-dark">
            {er.correctAnswer}
          </span>
        </div>
      </div>
      {er.explanation && er.correct !== "correct" && (
        <p className="mt-3 rounded-xl bg-secondary/5 p-3 text-sm text-slate-600">
          {er.explanation}
        </p>
      )}
    </Card>
  );
}
