"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Keyboard,
  Camera,
  Send,
  Ear,
  ArrowRight,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextArea, SegmentedControl, Slider } from "@/components/ui/Controls";
import { PhotoCapture } from "@/components/shared/PhotoCapture";
import { LoadingMessages } from "@/components/ui/LoadingSpinner";
import { ResultsPanel } from "@/components/shared/ResultsPanel";
import { StepHeader } from "@/components/players/StepHeader";
import { useTTS } from "@/hooks/useTTS";
import { useToast } from "@/components/ui/Toast";
import type { CapturedImage } from "@/hooks/useCamera";
import { countWords } from "@/lib/utils";
import type { ExerciseResult, StoredExercise } from "@/types";
import type { PlayerProps } from "@/components/players/types";

type DitadoExercise = Extract<StoredExercise, { type: "ditado" }>;

const PACE_LABELS: Record<number, string> = {
  1: "Muito rápido",
  2: "Rápido",
  3: "Normal",
  4: "Devagar",
  5: "Muito devagar",
};

const CORRECTING = [
  "O professor está a ler o teu ditado…",
  "A verificar a ortografia…",
  "Quase a terminar…",
];

export function DitadoPlayer({
  exercise,
  submit,
  onDone,
  step,
}: PlayerProps<DitadoExercise>) {
  const { toast } = useToast();
  const tts = useTTS({ maxPlays: exercise.maxPlays });

  const [chosenMode, setChosenMode] = useState<"keyboard" | "photo">("keyboard");
  const [studentText, setStudentText] = useState("");
  const [photo, setPhoto] = useState<CapturedImage | null>(null);
  const [phase, setPhase] = useState<"doing" | "correcting" | "result">("doing");
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  const effectiveMode = useMemo<"keyboard" | "photo">(() => {
    if (exercise.inputMode === "keyboard") return "keyboard";
    if (exercise.inputMode === "photo") return "photo";
    return chosenMode;
  }, [exercise.inputMode, chosenMode]);

  const hasInput =
    effectiveMode === "keyboard" ? studentText.trim().length > 0 : photo !== null;
  const canSubmit = tts.playCount >= 1 && hasInput;

  async function handleSubmit() {
    if (!canSubmit) {
      toast("Ouve o ditado e escreve antes de entregar.", "warning");
      return;
    }
    tts.stop();
    setPhase("correcting");
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    try {
      const { result } = await submit({
        studentText: effectiveMode === "keyboard" ? studentText : undefined,
        photoBase64: effectiveMode === "photo" ? photo?.base64 : undefined,
        mimeType: photo?.mimeType,
        timeSpent,
      });
      setResult(result as ExerciseResult);
      setPhase("result");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao corrigir.", "error");
      setPhase("doing");
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
        <StepHeader index={step.index} total={step.total} type="ditado" />
        <ResultsPanel
          score={result.score}
          feedback={result.feedback}
          corrections={result.corrections}
          timeSpent={result.timeSpent}
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
      <StepHeader index={step.index} total={step.total} type="ditado" />
      <div className="space-y-5">
        <Card className="space-y-5 bg-secondary/5">
          <div className="flex items-center gap-2">
            <Ear className="text-secondary" size={20} />
            <CardTitle className="text-lg">Ouve e escreve ao mesmo tempo</CardTitle>
          </div>

          {!tts.supported && (
            <p className="rounded-2xl bg-danger/10 p-3 font-semibold text-danger-dark">
              Este navegador não suporta leitura por voz. Pede ajuda ao tutor.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {tts.isPlaying && !tts.isPaused ? (
              <Button size="lg" variant="secondary" icon={<Pause size={22} />} onClick={tts.pause}>
                Pausar
              </Button>
            ) : tts.isPaused ? (
              <Button size="lg" icon={<Play size={22} />} onClick={tts.resume}>
                Continuar
              </Button>
            ) : (
              <Button
                size="lg"
                icon={<Play size={22} />}
                onClick={() => tts.speak(exercise.text)}
                disabled={!tts.canPlay}
              >
                Ouvir
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              icon={<RotateCcw size={20} />}
              onClick={() => tts.speak(exercise.text)}
              disabled={!tts.canPlay}
            >
              Repetir
            </Button>
            <Badge tone={tts.canPlay ? "neutral" : "danger"}>
              {tts.playCount}x de {exercise.maxPlays}
            </Badge>
          </div>

          <div className="mx-auto w-full max-w-xs">
            <span className="mb-1 block text-sm font-semibold text-slate-500">
              Ritmo do ditado (pausa entre palavras)
            </span>
            <Slider
              value={tts.pace}
              min={1}
              max={5}
              step={1}
              onChange={tts.setPace}
              format={(v) => PACE_LABELS[v] ?? `${v}`}
            />
          </div>
        </Card>

        <Card className="space-y-4">
          {exercise.inputMode === "both" && (
            <SegmentedControl
              ariaLabel="Como queres entregar"
              value={chosenMode}
              onChange={(v) => setChosenMode(v)}
              options={[
                { value: "keyboard", label: "Escrever" },
                { value: "photo", label: "Foto" },
              ]}
            />
          )}

          {effectiveMode === "keyboard" ? (
            <div>
              <label className="mb-1.5 flex items-center gap-2 font-display font-bold text-ink">
                <Keyboard size={18} /> Escreve o que ouves
              </label>
              <TextArea
                value={studentText}
                onChange={setStudentText}
                rows={8}
                placeholder="Vai escrevendo aqui enquanto ouves…"
                noAutocorrect
              />
              <p className="mt-1 text-right text-sm text-slate-400">
                {countWords(studentText)} palavras
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-2 flex items-center gap-2 font-display font-bold text-ink">
                <Camera size={18} /> Escreve no papel e fotografa
              </label>
              <PhotoCapture
                hint="Ouve, escreve no papel e fotografa. Garante boa luz e letra legível."
                onCapture={setPhoto}
                onClear={() => setPhoto(null)}
              />
            </div>
          )}

          <Button
            size="lg"
            fullWidth
            icon={<Send size={20} />}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {tts.playCount < 1 ? "Ouve o ditado primeiro" : "Entregar"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
