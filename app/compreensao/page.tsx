"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Send,
  AlertTriangle,
  Eye,
  BookOpen,
} from "lucide-react";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Timer } from "@/components/shared/Timer";
import { PinGate } from "@/components/shared/PinGate";
import { LoadingMessages } from "@/components/ui/LoadingSpinner";
import { ResultsPanel } from "@/components/shared/ResultsPanel";
import {
  Field,
  TextArea,
  SegmentedControl,
  Slider,
  PinInput,
} from "@/components/ui/Controls";
import { GradeSelect } from "@/components/ui/GradeSelect";
import { useToast } from "@/components/ui/Toast";
import { useTimer } from "@/hooks/useTimer";
import { gerarTexto, corrigirCompreensao } from "@/lib/client";
import { loadSettings, addSession } from "@/lib/storage";
import { countWords, difficultyLabel, formatTime } from "@/lib/utils";
import type { Difficulty, ExerciseResult, GeneratedText } from "@/types";

type State = "config" | "reading" | "writing" | "correcting" | "result";

const CORRECTING_MESSAGES = [
  "O professor está a ler o teu texto…",
  "A avaliar a tua compreensão…",
  "A apreciar a tua expressão…",
];

export default function CompreensaoPage() {
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [readMinutes, setReadMinutes] = useState(4);
  const [writeMinutes, setWriteMinutes] = useState(10);
  const [sessionPin, setSessionPin] = useState("1234");

  const [state, setState] = useState<State>("config");
  const [generated, setGenerated] = useState<GeneratedText | null>(null);
  const [generating, setGenerating] = useState(false);

  const [studentText, setStudentText] = useState("");
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const readStartRef = useRef(0);
  const writeStartRef = useRef(0);
  const readingTimeRef = useRef(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [canFinishReading, setCanFinishReading] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const s = loadSettings();
    setGradeLevel(s.gradeLevel);
    setSessionPin(s.tutorPin);
  }, []);

  const readingTimer = useTimer({
    mode: "countdown",
    durationSeconds: readMinutes * 60,
    onComplete: () => goToWriting(),
  });

  const writingTimer = useTimer({
    mode: "countdown",
    durationSeconds: writeMinutes * 60,
    onComplete: () => {
      toast("O tempo terminou — a entregar automaticamente.", "warning");
      handleSubmit(true);
    },
  });

  async function handleGenerate() {
    setGenerating(true);
    try {
      const text = await gerarTexto({
        prompt,
        gradeLevel,
        difficulty,
        type: "compreensao",
      });
      setGenerated(text);
      setStudentText("");
      setCanFinishReading(false);
      readStartRef.current = Date.now();
      setState("reading");
      readingTimer.start();
      setTimeout(() => setCanFinishReading(true), 30_000);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao gerar.", "error");
    } finally {
      setGenerating(false);
    }
  }

  function goToWriting() {
    readingTimer.pause();
    readingTimeRef.current = Math.round((Date.now() - readStartRef.current) / 1000);
    writeStartRef.current = Date.now();
    setConfirmClose(false);
    setState("writing");
    writingTimer.start();
  }

  async function handleSubmit(auto = false) {
    if (!generated) return;
    if (!auto && !studentText.trim()) {
      toast("Escreve um pouco sobre o que leste.", "warning");
      return;
    }
    writingTimer.pause();
    const writingTime = Math.round((Date.now() - writeStartRef.current) / 1000);
    const totalTime = readingTimeRef.current + writingTime;
    setState("correcting");
    try {
      const res = await corrigirCompreensao({
        originalText: generated.text,
        studentText,
        gradeLevel,
        timeSpent: totalTime,
      });
      setResult(res);
      addSession({
        module: "compreensao",
        score: res.score,
        timeSpent: totalTime,
        feedback: res.feedback,
      });
      setState("result");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao corrigir.", "error");
      setState("writing");
      writingTimer.resume();
    }
  }

  function autoGrow() {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 200)}px`;
  }

  function newExercise() {
    setResult(null);
    setGenerated(null);
    readingTimer.reset();
    writingTimer.reset();
    setState("config");
  }

  const minWords = gradeLevel <= 2 ? 30 : 50;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Compreensão Escrita
          </h1>
          <p className="text-slate-500">Lê, percebe e escreve o que aprendeste.</p>
        </div>
        {(state === "reading" || state === "writing" || state === "result") && (
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
                <CardSubtitle>Define o texto e os tempos.</CardSubtitle>
              </div>

              <Field label="Descreve o tema e tipo de texto">
                <TextArea
                  value={prompt}
                  onChange={setPrompt}
                  placeholder="ex.: texto narrativo sobre uma viagem ao mar"
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

              <Field label="Tempo máximo de leitura">
                <Slider
                  value={readMinutes}
                  min={2}
                  max={10}
                  onChange={setReadMinutes}
                  format={(v) => `${v} min`}
                />
              </Field>
              <Field label="Tempo máximo para escrever">
                <Slider
                  value={writeMinutes}
                  min={5}
                  max={20}
                  onChange={setWriteMinutes}
                  format={(v) => `${v} min`}
                />
              </Field>

              <PinInput value={sessionPin} onChange={setSessionPin} />

              <Button
                size="lg"
                fullWidth
                loading={generating}
                icon={<Sparkles size={20} />}
                onClick={handleGenerate}
                disabled={sessionPin.length !== 4}
              >
                Gerar Texto
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ESTADO 2 — LEITURA */}
        {state === "reading" && generated && (
          <motion.div key="reading" {...fade}>
            <div className="space-y-5">
              <Card padded className="bg-secondary/5">
                <Timer
                  seconds={readingTimer.seconds}
                  phase={readingTimer.phase}
                  total={readMinutes * 60}
                  label="Tempo de leitura"
                />
              </Card>

              <Card>
                <p className="whitespace-pre-line font-display text-xl leading-loose text-ink">
                  {generated.text}
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
                disabled={!canFinishReading}
                onClick={() => setConfirmClose(true)}
              >
                {canFinishReading
                  ? "Já li, continuar"
                  : "Lê com atenção (aguarda 30s)…"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ESTADO 3 — ESCRITA */}
        {state === "writing" && generated && (
          <motion.div key="writing" {...fade}>
            <div className="space-y-5">
              <Card padded className="bg-primary/5">
                <Timer
                  seconds={writingTimer.seconds}
                  phase={writingTimer.phase}
                  total={writeMinutes * 60}
                  label="Tempo para escrever"
                />
              </Card>

              <Card className="space-y-4">
                <div>
                  <CardTitle>Escreve sobre o que leste</CardTitle>
                  {generated.theme && (
                    <Badge tone="secondary" className="mt-2">
                      <BookOpen size={14} /> Tema: {generated.theme}
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
                  <span className="text-slate-400">
                    Mínimo recomendado: {minWords} palavras
                  </span>
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
                <Button
                  size="lg"
                  fullWidth
                  icon={<Send size={20} />}
                  onClick={() => handleSubmit(false)}
                >
                  Entregar
                </Button>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ESTADO 4 — A CORRIGIR */}
        {state === "correcting" && (
          <motion.div key="correcting" {...fade}>
            <Card>
              <LoadingMessages messages={CORRECTING_MESSAGES} />
            </Card>
          </motion.div>
        )}

        {/* ESTADO 5 — RESULTADOS */}
        {state === "result" && result && (
          <motion.div key="result" {...fade}>
            <ResultsPanel
              score={result.score}
              feedback={result.feedback}
              criteria={result.criteria}
              extraStats={[
                { label: "Leitura", value: formatTime(readingTimeRef.current) },
                {
                  label: "Escrita",
                  value: formatTime(
                    (result.timeSpent ?? 0) - readingTimeRef.current
                  ),
                },
                { label: "Palavras", value: String(countWords(studentText)) },
              ]}
            >
              <Button icon={<Sparkles size={18} />} onClick={newExercise}>
                Novo Exercício
              </Button>
              <Button
                variant="outline"
                icon={<Eye size={18} />}
                onClick={() => setShowOriginal(true)}
              >
                Ver Texto Original
              </Button>
            </ResultsPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmação de fecho do texto */}
      <Modal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Tens a certeza?"
      >
        <p className="text-slate-600">
          O texto vai fechar e não voltas a vê-lo. Só continua quando estiveres
          pronto para escrever.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setConfirmClose(false)}
          >
            Continuar a ler
          </Button>
          <Button className="flex-1" onClick={goToWriting}>
            Fechar e escrever
          </Button>
        </div>
      </Modal>

      <PinGate
        open={pinOpen}
        expectedPin={sessionPin}
        onClose={() => setPinOpen(false)}
        onSuccess={() => {
          setPinOpen(false);
          newExercise();
        }}
      />

      <Modal
        open={showOriginal}
        onClose={() => setShowOriginal(false)}
        title="Texto Original"
      >
        <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 leading-relaxed text-ink">
          {generated?.text}
        </p>
      </Modal>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3 },
};
