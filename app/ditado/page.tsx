"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Keyboard,
  Camera,
  Send,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Ear,
} from "lucide-react";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PinGate } from "@/components/shared/PinGate";
import { PhotoCapture } from "@/components/shared/PhotoCapture";
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
import { useTTS } from "@/hooks/useTTS";
import type { CapturedImage } from "@/hooks/useCamera";
import { gerarTexto, corrigirDitado } from "@/lib/client";
import { loadSettings, addSession } from "@/lib/storage";
import { countWords, difficultyLabel } from "@/lib/utils";
import type {
  Difficulty,
  ExerciseResult,
  GeneratedText,
  InputMode,
} from "@/types";

type State = "config" | "preview" | "active" | "correcting" | "result";

const CORRECTING_MESSAGES = [
  "O professor está a ler o teu ditado…",
  "A verificar a ortografia…",
  "Quase a terminar…",
];

const PACE_LABELS: Record<number, string> = {
  1: "Muito rápido",
  2: "Rápido",
  3: "Normal",
  4: "Devagar",
  5: "Muito devagar",
};

export default function DitadoPage() {
  const { toast } = useToast();

  // Config
  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [inputMode, setInputMode] = useState<InputMode>("both");
  const [maxPlays, setMaxPlays] = useState(3);
  const [sessionPin, setSessionPin] = useState("1234");

  // Flow
  const [state, setState] = useState<State>("config");
  const [generated, setGenerated] = useState<GeneratedText | null>(null);
  const [generating, setGenerating] = useState(false);

  // Student
  const [chosenMode, setChosenMode] = useState<"keyboard" | "photo">("keyboard");
  const [studentText, setStudentText] = useState("");
  const [photo, setPhoto] = useState<CapturedImage | null>(null);
  const startRef = useRef<number>(0);

  // Result
  const [result, setResult] = useState<ExerciseResult | null>(null);

  // Pin / modals
  const [pinOpen, setPinOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const tts = useTTS({ maxPlays });

  useEffect(() => {
    const s = loadSettings();
    setGradeLevel(s.gradeLevel);
    setInputMode(s.inputMode);
    setMaxPlays(s.maxTTSPlays);
    setSessionPin(s.tutorPin);
  }, []);

  // Modo de entrega efectivo do aluno.
  const effectiveMode = useMemo<"keyboard" | "photo">(() => {
    if (inputMode === "keyboard") return "keyboard";
    if (inputMode === "photo") return "photo";
    return chosenMode;
  }, [inputMode, chosenMode]);

  const hasInput =
    effectiveMode === "keyboard" ? studentText.trim().length > 0 : photo !== null;
  const canSubmit = tts.playCount >= 1 && hasInput;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const text = await gerarTexto({
        prompt,
        gradeLevel,
        difficulty,
        type: "ditado",
      });
      setGenerated(text);
      setState("preview");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao gerar.", "error");
    } finally {
      setGenerating(false);
    }
  }

  function startStudent() {
    tts.resetCount();
    setStudentText("");
    setPhoto(null);
    setChosenMode("keyboard");
    setShowOriginal(false);
    startRef.current = Date.now();
    setState("active");
  }

  async function handleSubmit() {
    if (!generated) return;
    if (!canSubmit) {
      toast("Ouve o ditado e escreve antes de entregar.", "warning");
      return;
    }
    tts.stop();
    setState("correcting");
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    try {
      const res = await corrigirDitado({
        originalText: generated.text,
        studentText: effectiveMode === "keyboard" ? studentText : undefined,
        photoBase64: effectiveMode === "photo" ? photo?.base64 : undefined,
        mimeType: photo?.mimeType,
        gradeLevel,
        timeSpent,
      });
      setResult(res);
      addSession({
        module: "ditado",
        score: res.score,
        timeSpent: res.timeSpent ?? timeSpent,
        feedback: res.feedback,
      });
      setState("result");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao corrigir.", "error");
      setState("active");
    }
  }

  function requestBackToConfig() {
    tts.stop();
    setPinOpen(true);
  }

  function newDitado() {
    setResult(null);
    setGenerated(null);
    setState("config");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Ditado</h1>
          <p className="text-slate-500">Ouve com atenção e escreve o que ouves.</p>
        </div>
        {(state === "active" || state === "result") && (
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={requestBackToConfig}
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
                <CardSubtitle>Define o ditado para o aluno.</CardSubtitle>
              </div>

              <Field label="Descreve o texto para o ditado">
                <TextArea
                  value={prompt}
                  onChange={setPrompt}
                  placeholder="ex.: texto sobre animais da floresta, 5 frases"
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

              <Field label="Modo de submissão do aluno">
                <SegmentedControl
                  value={inputMode}
                  onChange={setInputMode}
                  options={[
                    { value: "keyboard", label: "Teclado" },
                    { value: "photo", label: "Foto" },
                    { value: "both", label: "À escolha" },
                  ]}
                />
              </Field>

              <Field label="Máximo de reproduções">
                <Slider
                  value={maxPlays}
                  min={1}
                  max={6}
                  onChange={setMaxPlays}
                  format={(v) => `${v}x`}
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

        {/* ESTADO 1b — PREVIEW (tutor) */}
        {state === "preview" && generated && (
          <motion.div key="preview" {...fade}>
            <Card className="space-y-5">
              <div className="flex items-center justify-between">
                <CardTitle>Pré-visualização</CardTitle>
                <Badge tone="primary">{generated.wordCount} palavras</Badge>
              </div>
              <p className="rounded-2xl bg-slate-50 p-5 text-lg leading-relaxed text-ink">
                {generated.text}
              </p>
              <p className="text-sm text-slate-400">
                O aluno NÃO verá este texto — apenas o vai ouvir.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  icon={<RefreshCw size={18} />}
                  loading={generating}
                  onClick={handleGenerate}
                >
                  Regenerar
                </Button>
                <Button
                  icon={<CheckCircle2 size={18} />}
                  onClick={startStudent}
                  className="flex-1"
                >
                  Aceitar e Avançar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ESTADO 2 — DITADO ATIVO (ouvir + escrever no mesmo ecrã) */}
        {state === "active" && generated && (
          <motion.div key="active" {...fade}>
            <div className="space-y-5">
              {/* Controlos de áudio */}
              <Card className="space-y-5 bg-secondary/5">
                <div className="flex items-center gap-2">
                  <Ear className="text-secondary" size={20} />
                  <h2 className="font-display text-lg font-extrabold text-ink">
                    Ouve e escreve ao mesmo tempo
                  </h2>
                </div>

                {!tts.supported && (
                  <p className="rounded-2xl bg-danger/10 p-3 font-semibold text-danger-dark">
                    Este navegador não suporta leitura por voz. Pede ajuda ao
                    tutor.
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {tts.isPlaying && !tts.isPaused ? (
                    <Button
                      size="lg"
                      variant="secondary"
                      icon={<Pause size={22} />}
                      onClick={tts.pause}
                    >
                      Pausar
                    </Button>
                  ) : tts.isPaused ? (
                    <Button
                      size="lg"
                      icon={<Play size={22} />}
                      onClick={tts.resume}
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      icon={<Play size={22} />}
                      onClick={() => tts.speak(generated.text)}
                      disabled={!tts.canPlay}
                    >
                      Ouvir
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    icon={<RotateCcw size={20} />}
                    onClick={() => tts.speak(generated.text)}
                    disabled={!tts.canPlay}
                  >
                    Repetir
                  </Button>
                  <Badge tone={tts.canPlay ? "neutral" : "danger"}>
                    {tts.playCount}x de {maxPlays}
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

              {/* Área de entrega */}
              <Card className="space-y-4">
                {inputMode === "both" && (
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
                      hint="Ouve o ditado, escreve no papel e depois fotografa. Garante boa luz e letra legível."
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
                  {tts.playCount < 1
                    ? "Ouve o ditado primeiro"
                    : "Entregar Ditado"}
                </Button>
              </Card>
            </div>
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

        {/* ESTADO 3 — RESULTADOS */}
        {state === "result" && result && (
          <motion.div key="result" {...fade}>
            <ResultsPanel
              score={result.score}
              feedback={result.feedback}
              corrections={result.corrections}
              timeSpent={result.timeSpent}
            >
              <Button icon={<Sparkles size={18} />} onClick={newDitado}>
                Novo Ditado
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

      {/* PIN para voltar à configuração */}
      <PinGate
        open={pinOpen}
        expectedPin={sessionPin}
        onClose={() => setPinOpen(false)}
        onSuccess={() => {
          setPinOpen(false);
          newDitado();
        }}
      />

      {/* Texto original */}
      <Modal
        open={showOriginal}
        onClose={() => setShowOriginal(false)}
        title="Texto Original"
      >
        <p className="rounded-2xl bg-slate-50 p-4 text-lg leading-relaxed text-ink">
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
