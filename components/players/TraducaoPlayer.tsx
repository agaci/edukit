"use client";

import { useRef, useState } from "react";
import { ArrowRight, Send, Languages } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingMessages } from "@/components/ui/LoadingSpinner";
import { ResultsPanel } from "@/components/shared/ResultsPanel";
import { StepHeader } from "@/components/players/StepHeader";
import { useToast } from "@/components/ui/Toast";
import { countWords } from "@/lib/utils";
import type { ExerciseResult, StoredExercise } from "@/types";
import type { PlayerProps } from "@/components/players/types";

type TradExercise = Extract<
  StoredExercise,
  { type: "traducao-en-pt" | "traducao-pt-en" }
>;

const CORRECTING = [
  "O professor está a ler a tua tradução…",
  "A comparar com o texto original…",
  "Quase a terminar…",
];

export function TraducaoPlayer({
  exercise,
  submit,
  onDone,
  step,
}: PlayerProps<TradExercise>) {
  const { toast } = useToast();
  const enToPt = exercise.type === "traducao-en-pt";
  const [phase, setPhase] = useState<"writing" | "correcting" | "result">("writing");
  const [text, setText] = useState("");
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const startRef = useRef(Date.now());

  async function handleSubmit() {
    if (!text.trim()) {
      toast("Escreve a tua tradução antes de entregar.", "warning");
      return;
    }
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    setPhase("correcting");
    try {
      const { result } = await submit({ studentText: text, timeSpent });
      setResult(result as ExerciseResult);
      setPhase("result");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao corrigir.", "error");
      setPhase("writing");
    }
  }

  if (phase === "correcting") {
    return (
      <Card>
        <LoadingMessages messages={CORRECTING} />
      </Card>
    );
  }

  if (phase === "result" && result) {
    return (
      <div>
        <StepHeader index={step.index} total={step.total} type={exercise.type} />
        <ResultsPanel
          score={result.score}
          feedback={result.feedback}
          corrections={result.corrections}
        >
          <Button icon={<ArrowRight size={18} />} onClick={onDone}>
            Continuar
          </Button>
        </ResultsPanel>
      </div>
    );
  }

  return (
    <div>
      <StepHeader index={step.index} total={step.total} type={exercise.type} />
      <div className="space-y-5">
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display font-bold text-ink">
              <Languages size={18} className="text-secondary" />
              {enToPt ? "Texto em Inglês" : "Texto em Português"}
            </span>
            <Badge tone="secondary">
              {enToPt ? "EN → PT" : "PT → EN"}
            </Badge>
          </div>
          <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-5 text-lg leading-relaxed text-ink">
            {exercise.sourceText}
          </p>
        </Card>

        <Card className="space-y-4">
          <CardTitle>
            {enToPt
              ? "Escreve a tradução em português"
              : "Write the translation in English"}
          </CardTitle>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={enToPt ? "A tua tradução…" : "Your translation…"}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            className="min-h-[180px] w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg leading-relaxed text-ink transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {countWords(text)} palavras
            </span>
          </div>
          <Button size="lg" fullWidth icon={<Send size={20} />} onClick={handleSubmit}>
            Entregar
          </Button>
        </Card>
      </div>
    </div>
  );
}
