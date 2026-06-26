"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Send, AlertTriangle, BookOpen } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Timer } from "@/components/shared/Timer";
import { LoadingMessages } from "@/components/ui/LoadingSpinner";
import { ResultsPanel } from "@/components/shared/ResultsPanel";
import { StepHeader } from "@/components/players/StepHeader";
import { useTimer } from "@/hooks/useTimer";
import { useToast } from "@/components/ui/Toast";
import { countWords, formatTime } from "@/lib/utils";
import type { ExerciseResult, StoredExercise } from "@/types";
import type { PlayerProps } from "@/components/players/types";

type CompExercise = Extract<StoredExercise, { type: "compreensao" }>;

const CORRECTING = [
  "O professor está a ler o teu texto…",
  "A avaliar a tua compreensão…",
  "A apreciar a tua expressão…",
];

export function CompreensaoPlayer({
  exercise,
  submit,
  onDone,
  step,
}: PlayerProps<CompExercise>) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<"reading" | "writing" | "correcting" | "result">(
    "reading"
  );
  const [studentText, setStudentText] = useState("");
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [canFinish, setCanFinish] = useState(false);
  const readStartRef = useRef(Date.now());
  const writeStartRef = useRef(0);
  const readingTimeRef = useRef(0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const minWords = exercise.gradeLevel <= 2 ? 30 : 50;

  const readingTimer = useTimer({
    mode: "countdown",
    durationSeconds: exercise.readMinutes * 60,
    autoStart: true,
    onComplete: () => goToWriting(),
  });
  const writingTimer = useTimer({
    mode: "countdown",
    durationSeconds: exercise.writeMinutes * 60,
    onComplete: () => {
      toast("O tempo terminou — a entregar.", "warning");
      handleSubmit(true);
    },
  });

  useEffect(() => {
    const t = setTimeout(() => setCanFinish(true), 30_000);
    return () => clearTimeout(t);
  }, []);

  function goToWriting() {
    readingTimer.pause();
    readingTimeRef.current = Math.round((Date.now() - readStartRef.current) / 1000);
    writeStartRef.current = Date.now();
    setConfirmClose(false);
    setPhase("writing");
    writingTimer.start();
  }

  function autoGrow() {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 200)}px`;
  }

  async function handleSubmit(auto = false) {
    if (!auto && !studentText.trim()) {
      toast("Escreve um pouco sobre o que leste.", "warning");
      return;
    }
    writingTimer.pause();
    const writingTime = Math.round((Date.now() - writeStartRef.current) / 1000);
    const total = readingTimeRef.current + writingTime;
    setPhase("correcting");
    try {
      const { result } = await submit({ studentText, timeSpent: total });
      setResult(result as ExerciseResult);
      setPhase("result");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao corrigir.", "error");
      setPhase("writing");
      writingTimer.resume();
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
        <StepHeader index={step.index} total={step.total} type="compreensao" />
        <ResultsPanel
          score={result.score}
          feedback={result.feedback}
          criteria={result.criteria}
          extraStats={[
            { label: "Leitura", value: formatTime(readingTimeRef.current) },
            {
              label: "Escrita",
              value: formatTime((result.timeSpent ?? 0) - readingTimeRef.current),
            },
            { label: "Palavras", value: String(countWords(studentText)) },
          ]}
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
      <StepHeader index={step.index} total={step.total} type="compreensao" />

      {phase === "reading" && (
        <div className="space-y-5">
          <Card className="bg-secondary/5">
            <Timer
              seconds={readingTimer.seconds}
              phase={readingTimer.phase}
              total={exercise.readMinutes * 60}
              label="Tempo de leitura"
            />
          </Card>
          <Card>
            <p className="whitespace-pre-line font-display text-xl leading-loose text-ink">
              {exercise.text}
            </p>
          </Card>
          <div className="rounded-2xl bg-warning/10 p-4 text-center text-sm font-semibold text-amber-700">
            <AlertTriangle className="mr-1 inline" size={16} />
            Quando continuares, o texto fecha e não volta a abrir.
          </div>
          <Button
            size="lg"
            fullWidth
            icon={<ArrowRight size={20} />}
            disabled={!canFinish}
            onClick={() => setConfirmClose(true)}
          >
            {canFinish ? "Já li, continuar" : "Lê com atenção (aguarda 30s)…"}
          </Button>
        </div>
      )}

      {phase === "writing" && (
        <div className="space-y-5">
          <Card className="bg-primary/5">
            <Timer
              seconds={writingTimer.seconds}
              phase={writingTimer.phase}
              total={exercise.writeMinutes * 60}
              label="Tempo para escrever"
            />
          </Card>
          <Card className="space-y-4">
            <div>
              <CardTitle>Escreve sobre o que leste</CardTitle>
              {exercise.theme && (
                <Badge tone="secondary" className="mt-2">
                  <BookOpen size={14} /> Tema: {exercise.theme}
                </Badge>
              )}
            </div>
            <textarea
              ref={textAreaRef}
              value={studentText}
              onChange={(e) => {
                setStudentText(e.target.value);
                autoGrow();
              }}
              placeholder="Escreve aqui as tuas ideias sobre o texto…"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              className="min-h-[200px] w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg leading-relaxed text-ink transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Mínimo recomendado: {minWords} palavras</span>
              <span
                className={
                  countWords(studentText) >= minWords
                    ? "font-bold text-success-dark"
                    : "font-semibold text-slate-500"
                }
              >
                {countWords(studentText)} palavras
              </span>
            </div>
            <Button size="lg" fullWidth icon={<Send size={20} />} onClick={() => handleSubmit(false)}>
              Entregar
            </Button>
          </Card>
        </div>
      )}

      <Modal open={confirmClose} onClose={() => setConfirmClose(false)} title="Tens a certeza?">
        <p className="text-slate-600">
          O texto vai fechar e não voltas a vê-lo. Só continua quando estiveres
          pronto para escrever.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmClose(false)}>
            Continuar a ler
          </Button>
          <Button className="flex-1" onClick={goToWriting}>
            Fechar e escrever
          </Button>
        </div>
      </Modal>
    </div>
  );
}
