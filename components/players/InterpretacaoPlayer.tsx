"use client";

import { useRef, useState } from "react";
import { ArrowRight, Send, BookOpenText, Check, X } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingMessages } from "@/components/ui/LoadingSpinner";
import { ResultsPanel } from "@/components/shared/ResultsPanel";
import { StepHeader } from "@/components/players/StepHeader";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { ExerciseResult, McAnswer, StoredExercise } from "@/types";
import type { PlayerProps } from "@/components/players/types";

type InterpExercise = Extract<StoredExercise, { type: "interpretacao-en" }>;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function InterpretacaoPlayer({
  exercise,
  submit,
  onDone,
  step,
}: PlayerProps<InterpExercise>) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<"answering" | "correcting" | "result">(
    "answering"
  );
  const [selected, setSelected] = useState<number[]>(
    () => exercise.questions.map(() => -1)
  );
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const startRef = useRef(Date.now());

  function choose(qi: number, oi: number) {
    setSelected((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.some((s) => s < 0)) {
      toast("Responde a todas as perguntas.", "warning");
      return;
    }
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    setPhase("correcting");
    try {
      const { result } = await submit({ answers: selected, timeSpent });
      setResult(result as ExerciseResult);
      setPhase("result");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao corrigir.", "error");
      setPhase("answering");
    }
  }

  if (phase === "correcting") {
    return (
      <Card>
        <LoadingMessages messages={["A corrigir as tuas respostas…"]} />
      </Card>
    );
  }

  if (phase === "result" && result) {
    return (
      <div>
        <StepHeader index={step.index} total={step.total} type={exercise.type} />
        <ResultsPanel score={result.score} feedback={result.feedback}>
          <Button icon={<ArrowRight size={18} />} onClick={onDone}>
            Continuar
          </Button>
        </ResultsPanel>
        {result.mcResults && result.mcResults.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-display text-lg font-extrabold text-ink">
              Revisão
            </h3>
            {result.mcResults.map((r, i) => (
              <Review key={i} index={i} r={r} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <StepHeader index={step.index} total={step.total} type={exercise.type} />
      <div className="space-y-5">
        <Card className="space-y-2">
          <span className="flex items-center gap-2 font-display font-bold text-ink">
            <BookOpenText size={18} className="text-secondary" /> Read the text
          </span>
          <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-5 leading-relaxed text-ink">
            {exercise.text}
          </p>
        </Card>

        {exercise.questions.map((q, qi) => (
          <Card key={q.id} className="space-y-3">
            <p className="font-display font-bold text-ink">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const on = selected[qi] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => choose(qi, oi)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition",
                      on
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold",
                        on
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {LETTERS[oi]}
                    </span>
                    <span className="text-ink">{opt}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}

        <Button size="lg" fullWidth icon={<Send size={20} />} onClick={handleSubmit}>
          Entregar respostas
        </Button>
      </div>
    </div>
  );
}

function Review({ index, r }: { index: number; r: McAnswer }) {
  return (
    <Card
      className={cn(
        "space-y-2 border-2",
        r.correct ? "border-success/40" : "border-danger/40"
      )}
    >
      <div className="flex items-center gap-2">
        {r.correct ? (
          <Check size={18} className="text-success" />
        ) : (
          <X size={18} className="text-danger" />
        )}
        <span className="font-display font-bold text-ink">
          {index + 1}. {r.question}
        </span>
      </div>
      <div className="space-y-1.5">
        {r.options.map((opt, oi) => {
          const isCorrect = oi === r.correctIndex;
          const isChosen = oi === r.selectedIndex;
          return (
            <div
              key={oi}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                isCorrect
                  ? "bg-success/10 font-semibold text-success-dark"
                  : isChosen
                    ? "bg-danger/10 font-semibold text-danger-dark"
                    : "text-slate-500"
              )}
            >
              <span>{LETTERS[oi]}.</span>
              <span>{opt}</span>
              {isCorrect && <Check size={14} className="ml-auto text-success" />}
              {isChosen && !isCorrect && (
                <X size={14} className="ml-auto text-danger" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
