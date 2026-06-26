"use client";

import { useRef, useState } from "react";
import {
  Send,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Crop,
  PenLine,
} from "lucide-react";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PhotoCapture } from "@/components/shared/PhotoCapture";
import { LoadingMessages } from "@/components/ui/LoadingSpinner";
import { ResultsPanel } from "@/components/shared/ResultsPanel";
import { MathExerciseResult } from "@/components/shared/MathExerciseResult";
import { StepHeader } from "@/components/players/StepHeader";
import { useToast } from "@/components/ui/Toast";
import type { CapturedImage } from "@/hooks/useCamera";
import type { MathResult, StoredExercise } from "@/types";
import type { PlayerProps } from "@/components/players/types";

type MathExercise = Extract<StoredExercise, { type: "matematica" }>;

const CORRECTING = [
  "O professor está a ver a tua resolução…",
  "A analisar o teu raciocínio…",
  "A corrigir cada exercício…",
];

export function MatematicaPlayer({
  exercise,
  submit,
  onDone,
  step,
}: PlayerProps<MathExercise>) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<"exercises" | "submit" | "correcting" | "result">(
    "exercises"
  );
  const [photo, setPhoto] = useState<CapturedImage | null>(null);
  const [result, setResult] = useState<MathResult | null>(null);
  const startRef = useRef(Date.now());

  async function handleSubmit() {
    if (!photo) {
      toast("Tira uma foto da tua resolução primeiro.", "warning");
      return;
    }
    setPhase("correcting");
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    try {
      const resp = await submit({
        photoBase64: photo.base64,
        mimeType: photo.mimeType,
        timeSpent,
      });
      const math = resp.result as MathResult;
      if (resp.illegible || math.illegible) {
        setResult(math);
        setPhase("result");
        return;
      }
      setResult(math);
      setPhase("result");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao corrigir.", "error");
      setPhase("submit");
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
    if (result.illegible) {
      return (
        <div>
          <StepHeader index={step.index} total={step.total} type="matematica" />
          <Card className="space-y-4 text-center">
            <AlertTriangle className="mx-auto text-warning" size={48} />
            <CardTitle>A foto não estava nítida</CardTitle>
            <p className="text-slate-500">{result.feedback}</p>
            <Button
              onClick={() => {
                setPhoto(null);
                setResult(null);
                setPhase("submit");
              }}
            >
              Repetir foto
            </Button>
          </Card>
        </div>
      );
    }
    return (
      <div>
        <StepHeader index={step.index} total={step.total} type="matematica" />
        <ResultsPanel
          score={result.score}
          feedback={result.feedback}
          timeSpent={result.timeSpent}
        >
          <Button icon={<ArrowRight size={18} />} onClick={onDone}>
            Continuar
          </Button>
        </ResultsPanel>
        {result.exerciseResults.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-display text-lg font-extrabold text-ink">
              Exercício a exercício
            </h3>
            {result.exerciseResults.map((er) => (
              <MathExerciseResult
                key={er.exerciseId}
                er={er}
                statement={
                  exercise.exercises.find((e) => e.id === er.exerciseId)?.statement
                }
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <StepHeader index={step.index} total={step.total} type="matematica" />

      {phase === "exercises" && (
        <div className="space-y-4">
          <p className="rounded-2xl bg-secondary/10 px-4 py-3 text-center font-semibold text-secondary-dark">
            Resolve os exercícios no teu caderno ou numa folha.
          </p>
          {exercise.exercises.map((ex) => (
            <Card key={ex.id} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display font-extrabold text-primary-dark">
                {ex.id}
              </div>
              <p className="flex-1 font-display text-lg leading-relaxed text-ink">
                {ex.statement}
              </p>
            </Card>
          ))}
          <Button
            size="lg"
            fullWidth
            icon={<ArrowRight size={20} />}
            onClick={() => setPhase("submit")}
          >
            Terminei, entregar foto
          </Button>
        </div>
      )}

      {phase === "submit" && (
        <Card className="space-y-5">
          <div>
            <CardTitle>Fotografa a tua resolução</CardTitle>
            <CardSubtitle>Certifica-te de que está tudo legível.</CardSubtitle>
          </div>
          <ul className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            <li className="flex items-center gap-2">
              <Lightbulb size={16} className="shrink-0 text-warning" />
              Procura uma boa luz, sem sombras.
            </li>
            <li className="flex items-center gap-2">
              <Crop size={16} className="shrink-0 text-secondary" />
              Enquadra a folha inteira.
            </li>
            <li className="flex items-center gap-2">
              <PenLine size={16} className="shrink-0 text-primary-dark" />
              Garante que os números se leem bem.
            </li>
          </ul>
          <PhotoCapture
            hint="Fotografa a tua resolução completa."
            onCapture={setPhoto}
            onClear={() => setPhoto(null)}
          />
          <Button size="lg" fullWidth icon={<Send size={20} />} onClick={handleSubmit}>
            Enviar para correcção
          </Button>
        </Card>
      )}
    </div>
  );
}
