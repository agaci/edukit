"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Printer,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Crop,
  PenLine,
} from "lucide-react";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PhotoCapture } from "@/components/shared/PhotoCapture";
import { PinGate } from "@/components/shared/PinGate";
import { LoadingMessages } from "@/components/ui/LoadingSpinner";
import { ResultsPanel } from "@/components/shared/ResultsPanel";
import {
  Field,
  TextArea,
  SegmentedControl,
  Chips,
} from "@/components/ui/Controls";
import { GradeSelect } from "@/components/ui/GradeSelect";
import { useToast } from "@/components/ui/Toast";
import { useTimer } from "@/hooks/useTimer";
import type { CapturedImage } from "@/hooks/useCamera";
import { gerarExercicios, corrigirMatematica } from "@/lib/client";
import { loadSettings, addSession } from "@/lib/storage";
import { difficultyLabel } from "@/lib/utils";
import { Timer } from "@/components/shared/Timer";
import type {
  Difficulty,
  Exercise,
  ExerciseType,
  MathResult,
} from "@/types";

type State = "config" | "exercises" | "submit" | "correcting" | "result";

const TYPE_OPTIONS: { value: ExerciseType; label: string }[] = [
  { value: "calculo-mental", label: "Cálculo mental" },
  { value: "problemas", label: "Problemas" },
  { value: "geometria", label: "Geometria" },
  { value: "medidas", label: "Medidas" },
  { value: "sequencias", label: "Sequências e padrões" },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((t) => [t.value, t.label])
);

const CORRECTING_MESSAGES = [
  "O professor está a ver a tua resolução…",
  "A analisar o teu raciocínio…",
  "A corrigir cada exercício…",
];

export default function MatematicaPage() {
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState(2);
  const [types, setTypes] = useState<ExerciseType[]>(["calculo-mental", "problemas"]);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [sessionPin, setSessionPin] = useState("1234");

  const [state, setState] = useState<State>("config");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [generating, setGenerating] = useState(false);
  const [photo, setPhoto] = useState<CapturedImage | null>(null);
  const [result, setResult] = useState<MathResult | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const startRef = useRef(0);

  const timer = useTimer({ mode: "countup" });

  useEffect(() => {
    const s = loadSettings();
    setGradeLevel(s.gradeLevel);
    setSessionPin(s.tutorPin);
  }, []);

  function toggleType(t: ExerciseType) {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await gerarExercicios({
        prompt,
        gradeLevel,
        exerciseTypes: types,
        count,
        difficulty,
      });
      setExercises(res.exercises);
      setPhoto(null);
      startRef.current = Date.now();
      setState("exercises");
      timer.start();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao gerar.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!photo) {
      toast("Tira uma foto da tua resolução primeiro.", "warning");
      return;
    }
    timer.pause();
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    setState("correcting");
    try {
      const res = await corrigirMatematica({
        exercises,
        photoBase64: photo.base64,
        mimeType: photo.mimeType,
        gradeLevel,
        timeSpent,
      });
      setResult(res);
      if (!res.illegible) {
        addSession({
          module: "matematica",
          score: res.score,
          timeSpent: res.timeSpent ?? timeSpent,
          feedback: res.feedback,
        });
      }
      setState("result");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao corrigir.", "error");
      setState("submit");
    }
  }

  function newExercises() {
    setResult(null);
    setExercises([]);
    setPhoto(null);
    timer.reset();
    setState("config");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between no-print">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Matemática
          </h1>
          <p className="text-slate-500">Resolve no papel e fotografa a resolução.</p>
        </div>
        {state !== "config" && (
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => setPinOpen(true)}
          >
            Tutor
          </Button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {/* ESTADO 1 — CONFIGURAÇÃO */}
        {state === "config" && (
          <motion.div key="config" {...fade}>
            <Card className="space-y-5">
              <div>
                <CardTitle>Configuração do tutor</CardTitle>
                <CardSubtitle>Define os exercícios a gerar.</CardSubtitle>
              </div>

              <Field label="Descreve os exercícios">
                <TextArea
                  value={prompt}
                  onChange={setPrompt}
                  placeholder="ex.: 5 problemas de adição e subtracção até 100"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Ano escolar">
                  <GradeSelect value={gradeLevel} onChange={setGradeLevel} />
                </Field>
                <Field label="Dificuldade">
                  <SegmentedControl
                    value={difficulty}
                    onChange={setDifficulty}
                    options={(["facil", "medio", "dificil"] as Difficulty[]).map(
                      (d) => ({ value: d, label: difficultyLabel(d) })
                    )}
                  />
                </Field>
              </div>

              <Field label="Tipo de exercício">
                <Chips values={types} options={TYPE_OPTIONS} onToggle={toggleType} />
              </Field>

              <Field label="Número de exercícios">
                <SegmentedControl
                  value={count}
                  onChange={setCount}
                  options={[3, 5, 8, 10].map((n) => ({ value: n, label: String(n) }))}
                />
              </Field>

              <Button
                size="lg"
                fullWidth
                loading={generating}
                icon={<Sparkles size={20} />}
                onClick={handleGenerate}
              >
                Gerar Exercícios
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ESTADO 2 — EXERCÍCIOS APRESENTADOS */}
        {state === "exercises" && (
          <motion.div key="exercises" {...fade}>
            <div className="space-y-5">
              <Card className="flex items-center justify-between no-print">
                <Timer
                  seconds={timer.seconds}
                  phase="normal"
                  label="Tempo"
                  showBar={false}
                />
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Printer size={18} />}
                  onClick={() => window.print()}
                >
                  Imprimir
                </Button>
              </Card>

              <div className="print-area space-y-4">
                <p className="rounded-2xl bg-secondary/10 px-4 py-3 text-center font-semibold text-secondary-dark no-print">
                  Resolve os exercícios no teu caderno ou numa folha.
                </p>
                {exercises.map((ex) => (
                  <Card key={ex.id} className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display font-extrabold text-primary-dark">
                      {ex.id}
                    </div>
                    <div className="flex-1">
                      <Badge tone="neutral" className="mb-2 no-print">
                        {TYPE_LABEL[ex.type] ?? ex.type}
                      </Badge>
                      <p className="font-display text-lg leading-relaxed text-ink">
                        {ex.statement}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                size="lg"
                fullWidth
                icon={<ArrowRight size={20} />}
                onClick={() => setState("submit")}
                className="no-print"
              >
                Terminei, entregar foto
              </Button>
            </div>
          </motion.div>
        )}

        {/* ESTADO 3 — SUBMISSÃO DA FOTO */}
        {state === "submit" && (
          <motion.div key="submit" {...fade}>
            <Card className="space-y-5">
              <div>
                <CardTitle>Fotografa a tua resolução</CardTitle>
                <CardSubtitle>
                  Certifica-te de que está tudo legível e bem iluminado.
                </CardSubtitle>
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

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  icon={<ArrowLeft size={18} />}
                  onClick={() => setState("exercises")}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  icon={<Send size={20} />}
                  onClick={handleSubmit}
                >
                  Enviar para correcção
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ESTADO — A CORRIGIR */}
        {state === "correcting" && (
          <motion.div key="correcting" {...fade}>
            <Card>
              <LoadingMessages messages={CORRECTING_MESSAGES} />
            </Card>
          </motion.div>
        )}

        {/* ESTADO 4 — RESULTADOS */}
        {state === "result" && result && (
          <motion.div key="result" {...fade}>
            {result.illegible ? (
              <Card className="space-y-4 text-center">
                <AlertTriangle className="mx-auto text-warning" size={48} />
                <CardTitle>A foto não estava nítida</CardTitle>
                <p className="text-slate-500">{result.feedback}</p>
                <Button onClick={() => setState("submit")}>Repetir foto</Button>
              </Card>
            ) : (
              <ResultsPanel
                score={result.score}
                feedback={result.feedback}
                timeSpent={result.timeSpent}
              >
                <Button icon={<Sparkles size={18} />} onClick={newExercises}>
                  Novos Exercícios
                </Button>
              </ResultsPanel>
            )}

            {!result.illegible && result.exerciseResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-display text-lg font-extrabold text-ink">
                  Exercício a exercício
                </h3>
                {result.exerciseResults.map((er) => (
                  <MathExerciseResult
                    key={er.exerciseId}
                    er={er}
                    statement={
                      exercises.find((e) => e.id === er.exerciseId)?.statement
                    }
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PinGate
        open={pinOpen}
        expectedPin={sessionPin}
        onClose={() => setPinOpen(false)}
        onSuccess={() => {
          setPinOpen(false);
          newExercises();
        }}
      />
    </div>
  );
}

function MathExerciseResult({
  er,
  statement,
}: {
  er: MathResult["exerciseResults"][number];
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

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3 },
};
