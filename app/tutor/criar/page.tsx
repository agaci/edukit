"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Send,
  PencilLine,
  BookOpen,
  Calculator,
  Languages,
  BookOpenText,
  SlidersHorizontal,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Field,
  TextArea,
  SegmentedControl,
  Slider,
  Chips,
} from "@/components/ui/Controls";
import { GradeSelect } from "@/components/ui/GradeSelect";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import {
  gerarTexto,
  gerarExercicios,
  gerarTraducao,
  gerarInterpretacao,
} from "@/lib/client";
import { listStudents, createAssignment } from "@/lib/api";
import { difficultyLabel, cn, exerciseLabelShort } from "@/lib/utils";
import type {
  Difficulty,
  ExerciseType,
  InputMode,
  McQuestion,
  StoredExercise,
  StoredExerciseType,
  StudentSummary,
} from "@/types";

const ALL_TYPES: { type: StoredExerciseType; label: string; icon: LucideIcon }[] = [
  { type: "ditado", label: "Ditado", icon: PencilLine },
  { type: "compreensao", label: "Compreensão", icon: BookOpen },
  { type: "matematica", label: "Matemática", icon: Calculator },
  { type: "traducao-en-pt", label: "Inglês → Português", icon: Languages },
  { type: "traducao-pt-en", label: "Português → Inglês", icon: Languages },
  { type: "interpretacao-en", label: "Interpretação (Inglês)", icon: BookOpenText },
];

// Gera um exercício automaticamente (sem prompt), com configuração por omissão.
async function gerarAutomatico(
  type: StoredExerciseType,
  gradeLevel: number,
  difficulty: Difficulty
): Promise<StoredExercise> {
  if (type === "ditado") {
    const t = await gerarTexto({ prompt: "", gradeLevel, difficulty, type: "ditado" });
    return {
      type: "ditado",
      gradeLevel,
      text: t.text,
      wordCount: t.wordCount,
      maxPlays: 3,
      inputMode: "both",
    };
  }
  if (type === "compreensao") {
    const t = await gerarTexto({ prompt: "", gradeLevel, difficulty, type: "compreensao" });
    return {
      type: "compreensao",
      gradeLevel,
      text: t.text,
      theme: t.theme,
      readMinutes: 4,
      writeMinutes: 10,
    };
  }
  if (type === "matematica") {
    const r = await gerarExercicios({
      prompt: "",
      gradeLevel,
      exerciseTypes: [],
      count: 5,
      difficulty,
    });
    return { type: "matematica", gradeLevel, exercises: r.exercises };
  }
  if (type === "traducao-en-pt" || type === "traducao-pt-en") {
    const r = await gerarTraducao({ kind: type, gradeLevel, difficulty });
    return { type, gradeLevel, sourceText: r.text };
  }
  const r = await gerarInterpretacao({ gradeLevel, difficulty, count: 4 });
  return { type: "interpretacao-en", gradeLevel, text: r.text, questions: r.questions };
}

export default function CriarTrabalhoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"auto" | "custom" | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "tutor")) router.replace("/");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (!mode) {
    return <ModeChooser onPick={setMode} onExit={() => router.replace("/")} />;
  }
  if (mode === "auto") {
    return <AutoCreate onBack={() => setMode(null)} />;
  }
  return <CustomWizard onBack={() => setMode(null)} />;
}

function ModeChooser({
  onPick,
  onExit,
}: {
  onPick: (m: "auto" | "custom") => void;
  onExit: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Criar trabalho
          </h1>
          <p className="text-slate-500">Como queres criar o teste?</p>
        </div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={onExit}>
          Sair
        </Button>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onPick("auto")}
          className="flex flex-col items-start gap-2 rounded-3xl border-2 border-primary/40 bg-primary/5 p-6 text-left transition hover:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary-dark">
            <Wand2 size={24} />
          </span>
          <span className="font-display text-lg font-extrabold text-ink">
            Automático
          </span>
          <span className="text-sm text-slate-500">
            Indica o ano, as disciplinas e a dificuldade — o EduKit gera o teste
            completo sozinho.
          </span>
        </button>
        <button
          onClick={() => onPick("custom")}
          className="flex flex-col items-start gap-2 rounded-3xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/30"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/15 text-secondary-dark">
            <SlidersHorizontal size={24} />
          </span>
          <span className="font-display text-lg font-extrabold text-ink">
            Personalizado
          </span>
          <span className="text-sm text-slate-500">
            Escolhe e configura cada exercício, com tema e pré-visualização.
          </span>
        </button>
      </div>
    </div>
  );
}

function AutoCreate({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [gradeLevel, setGradeLevel] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [subjects, setSubjects] = useState<StoredExerciseType[]>([
    "ditado",
    "compreensao",
    "matematica",
  ]);
  const [built, setBuilt] = useState<StoredExercise[] | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(t: StoredExerciseType) {
    setSubjects((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  }

  async function gerar() {
    if (subjects.length === 0) {
      toast("Escolhe pelo menos uma disciplina.", "warning");
      return;
    }
    setBusy(true);
    setBuilt(null);
    try {
      const ordered = ALL_TYPES.map((a) => a.type).filter((t) =>
        subjects.includes(t)
      );
      const out: StoredExercise[] = [];
      for (const t of ordered) {
        setProgress(exerciseLabelShort(t));
        // eslint-disable-next-line no-await-in-loop
        out.push(await gerarAutomatico(t, gradeLevel, difficulty));
      }
      setBuilt(out);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao gerar.", "error");
    } finally {
      setProgress(null);
      setBusy(false);
    }
  }

  if (built) {
    return (
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">
              Teste gerado
            </h1>
            <p className="text-slate-500">Confirma e atribui.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => setBuilt(null)}
          >
            Alterar
          </Button>
        </header>

        <Card className="mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Exercícios</CardTitle>
            <Badge tone="primary">{built.length}</Badge>
          </div>
          <ul className="space-y-1 text-sm text-slate-500">
            {built.map((ex, i) => (
              <li key={i}>
                {i + 1}. {exerciseLabelShort(ex.type)}
              </li>
            ))}
          </ul>
        </Card>

        <AssignStep
          exercises={built}
          initialTitle={`Teste ${gradeLevel}.º ano (${difficultyLabel(difficulty)})`}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Teste automático
          </h1>
          <p className="text-slate-500">
            Indica o ano, as disciplinas e a dificuldade.
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={onBack}>
          Voltar
        </Button>
      </header>

      <Card className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ano escolar">
            <GradeSelect value={gradeLevel} onChange={setGradeLevel} />
          </Field>
          <DifficultyField value={difficulty} onChange={setDifficulty} />
        </div>

        <Field label="Disciplinas">
          <div className="grid gap-3 sm:grid-cols-2">
            {ALL_TYPES.map(({ type, label, icon: Icon }) => {
              const on = subjects.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggle(type)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition",
                    on
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Icon
                    size={20}
                    className={on ? "text-primary-dark" : "text-slate-400"}
                  />
                  <span className="flex-1 font-display text-sm font-bold text-ink">
                    {label}
                  </span>
                  {on && <CheckCircle2 size={18} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </Field>

        <Button
          size="lg"
          fullWidth
          loading={busy}
          icon={<Wand2 size={20} />}
          onClick={gerar}
        >
          Gerar teste automático
        </Button>
        {progress && (
          <p className="text-center text-sm font-semibold text-slate-500">
            A gerar: {progress}…
          </p>
        )}
      </Card>
    </div>
  );
}

function CustomWizard({ onBack }: { onBack: () => void }) {
  const [picked, setPicked] = useState<StoredExerciseType[]>([]);
  const [step, setStep] = useState(0); // 0 = escolher; 1..N = config; N+1 = atribuir
  const [built, setBuilt] = useState<StoredExercise[]>([]);

  function accept(ex: StoredExercise) {
    setBuilt((b) => [...b, ex]);
    setStep((s) => s + 1);
  }

  function back() {
    if (step === 0) {
      onBack();
      return;
    }
    const newStep = step - 1;
    setBuilt((b) => b.slice(0, Math.max(0, newStep - 1)));
    setStep(newStep);
  }

  const isPick = step === 0;
  const isAssign = step === picked.length + 1;
  const current = !isPick && !isAssign ? picked[step - 1] : null;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Criar trabalho
          </h1>
          <p className="text-slate-500">
            Escolhe os exercícios, gera e atribui aos alunos.
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={back}>
          {step === 0 ? "Voltar" : "Anterior"}
        </Button>
      </header>

      {/* Stepper (depois de escolher) */}
      {picked.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {picked.map((t, i) => {
            const state = i + 1 < step ? "done" : i + 1 === step ? "active" : "todo";
            return (
              <span
                key={`${t}-${i}`}
                className={cn(
                  "rounded-full border-2 px-3 py-1 text-xs font-bold",
                  state === "done"
                    ? "border-success/40 bg-success/5 text-success-dark"
                    : state === "active"
                      ? "border-primary bg-primary/5 text-primary-dark"
                      : "border-slate-200 text-slate-400"
                )}
              >
                {i + 1}. {exerciseLabelShort(t)}
              </span>
            );
          })}
          <span
            className={cn(
              "rounded-full border-2 px-3 py-1 text-xs font-bold",
              isAssign
                ? "border-primary bg-primary/5 text-primary-dark"
                : "border-slate-200 text-slate-400"
            )}
          >
            Atribuir
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {isPick && (
            <PickStep
              picked={picked}
              setPicked={setPicked}
              onContinue={() => setStep(1)}
            />
          )}
          {current === "ditado" && <DitadoConfig onAccept={accept} />}
          {current === "compreensao" && <CompreensaoConfig onAccept={accept} />}
          {current === "matematica" && <MatematicaConfig onAccept={accept} />}
          {(current === "traducao-en-pt" || current === "traducao-pt-en") && (
            <TraducaoConfig kind={current} onAccept={accept} />
          )}
          {current === "interpretacao-en" && (
            <InterpretacaoConfig onAccept={accept} />
          )}
          {isAssign && <AssignStep exercises={built} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PickStep({
  picked,
  setPicked,
  onContinue,
}: {
  picked: StoredExerciseType[];
  setPicked: (p: StoredExerciseType[]) => void;
  onContinue: () => void;
}) {
  function toggle(t: StoredExerciseType) {
    setPicked(picked.includes(t) ? picked.filter((x) => x !== t) : [...picked, t]);
  }
  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>Escolhe os exercícios</CardTitle>
        <CardSubtitle>
          Seleciona um ou mais. A ordem é a ordem por que os escolheres.
        </CardSubtitle>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ALL_TYPES.map(({ type, label, icon: Icon }) => {
          const idx = picked.indexOf(type);
          const on = idx >= 0;
          return (
            <button
              key={type}
              onClick={() => toggle(type)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition",
                on
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <Icon
                size={22}
                className={on ? "text-primary-dark" : "text-slate-400"}
              />
              <span className="flex-1 font-display font-bold text-ink">
                {label}
              </span>
              {on && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-white">
                  {idx + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Button
        size="lg"
        fullWidth
        icon={<ArrowRight size={20} />}
        disabled={picked.length === 0}
        onClick={onContinue}
      >
        Continuar ({picked.length})
      </Button>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function DitadoConfig({ onAccept }: { onAccept: (e: StoredExercise) => void }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [inputMode, setInputMode] = useState<InputMode>("both");
  const [maxPlays, setMaxPlays] = useState(3);
  const [gen, setGen] = useState<{ text: string; wordCount: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const t = await gerarTexto({ prompt, gradeLevel, difficulty, type: "ditado" });
      setGen({ text: t.text, wordCount: t.wordCount });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao gerar.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (gen) {
    return (
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <CardTitle>Pré-visualização do ditado</CardTitle>
          <Badge tone="primary">{gen.wordCount} palavras</Badge>
        </div>
        <p className="rounded-2xl bg-slate-50 p-5 text-lg leading-relaxed text-ink">
          {gen.text}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" icon={<RefreshCw size={18} />} loading={busy} onClick={generate}>
            Regenerar
          </Button>
          <Button
            className="flex-1"
            icon={<CheckCircle2 size={18} />}
            onClick={() =>
              onAccept({
                type: "ditado",
                gradeLevel,
                text: gen.text,
                wordCount: gen.wordCount,
                maxPlays,
                inputMode,
              })
            }
          >
            Aceitar e continuar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <CardSubtitle>Exercício 1 de 3 — Ditado</CardSubtitle>
      <Field label="Descreve o texto para o ditado">
        <TextArea value={prompt} onChange={setPrompt} placeholder="ex.: texto sobre a primavera, 6 frases" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ano escolar">
          <GradeSelect value={gradeLevel} onChange={setGradeLevel} />
        </Field>
        <Field label="Dificuldade">
          <SegmentedControl
            value={difficulty}
            onChange={setDifficulty}
            options={(["facil", "medio", "dificil"] as Difficulty[]).map((d) => ({
              value: d,
              label: difficultyLabel(d),
            }))}
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
        <Slider value={maxPlays} min={1} max={6} onChange={setMaxPlays} format={(v) => `${v}x`} />
      </Field>
      <Button size="lg" fullWidth loading={busy} icon={<Sparkles size={20} />} onClick={generate}>
        Gerar Texto
      </Button>
    </Card>
  );
}

function CompreensaoConfig({ onAccept }: { onAccept: (e: StoredExercise) => void }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [readMinutes, setReadMinutes] = useState(4);
  const [writeMinutes, setWriteMinutes] = useState(10);
  const [gen, setGen] = useState<{ text: string; theme?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const t = await gerarTexto({ prompt, gradeLevel, difficulty, type: "compreensao" });
      setGen({ text: t.text, theme: t.theme });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao gerar.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (gen) {
    return (
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <CardTitle>Pré-visualização do texto</CardTitle>
          {gen.theme && <Badge tone="secondary">{gen.theme}</Badge>}
        </div>
        <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-5 leading-relaxed text-ink">
          {gen.text}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" icon={<RefreshCw size={18} />} loading={busy} onClick={generate}>
            Regenerar
          </Button>
          <Button
            className="flex-1"
            icon={<CheckCircle2 size={18} />}
            onClick={() =>
              onAccept({
                type: "compreensao",
                gradeLevel,
                text: gen.text,
                theme: gen.theme,
                readMinutes,
                writeMinutes,
              })
            }
          >
            Aceitar e continuar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <CardSubtitle>Exercício 2 de 3 — Compreensão Escrita</CardSubtitle>
      <Field label="Descreve o tema e tipo de texto">
        <TextArea value={prompt} onChange={setPrompt} placeholder="ex.: texto narrativo sobre uma viagem ao mar" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ano escolar">
          <GradeSelect value={gradeLevel} onChange={setGradeLevel} />
        </Field>
        <Field label="Dificuldade">
          <SegmentedControl
            value={difficulty}
            onChange={setDifficulty}
            options={(["facil", "medio", "dificil"] as Difficulty[]).map((d) => ({
              value: d,
              label: difficultyLabel(d),
            }))}
          />
        </Field>
      </div>
      <Field label="Tempo máximo de leitura">
        <Slider value={readMinutes} min={2} max={10} onChange={setReadMinutes} format={(v) => `${v} min`} />
      </Field>
      <Field label="Tempo máximo para escrever">
        <Slider value={writeMinutes} min={5} max={20} onChange={setWriteMinutes} format={(v) => `${v} min`} />
      </Field>
      <Button size="lg" fullWidth loading={busy} icon={<Sparkles size={20} />} onClick={generate}>
        Gerar Texto
      </Button>
    </Card>
  );
}

const TYPE_OPTIONS: { value: ExerciseType; label: string }[] = [
  { value: "calculo-mental", label: "Cálculo mental" },
  { value: "problemas", label: "Problemas" },
  { value: "geometria", label: "Geometria" },
  { value: "medidas", label: "Medidas" },
  { value: "sequencias", label: "Sequências e padrões" },
];

function MatematicaConfig({ onAccept }: { onAccept: (e: StoredExercise) => void }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [types, setTypes] = useState<ExerciseType[]>(["calculo-mental", "problemas"]);
  const [count, setCount] = useState(5);
  const [gen, setGen] = useState<StoredExercise | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const r = await gerarExercicios({
        prompt,
        gradeLevel,
        exerciseTypes: types,
        count,
        difficulty,
      });
      setGen({ type: "matematica", gradeLevel, exercises: r.exercises });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao gerar.", "error");
    } finally {
      setBusy(false);
    }
  }

  function toggle(t: ExerciseType) {
    setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  }

  if (gen && gen.type === "matematica") {
    return (
      <Card className="space-y-4">
        <CardTitle>Pré-visualização dos exercícios</CardTitle>
        {gen.exercises.map((ex) => (
          <div key={ex.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="font-display font-extrabold text-primary-dark">{ex.id}.</span>
            <span className="text-ink">{ex.statement}</span>
          </div>
        ))}
        <div className="flex gap-3">
          <Button variant="outline" icon={<RefreshCw size={18} />} loading={busy} onClick={generate}>
            Regenerar
          </Button>
          <Button className="flex-1" icon={<CheckCircle2 size={18} />} onClick={() => onAccept(gen)}>
            Aceitar e continuar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <CardSubtitle>Exercício 3 de 3 — Matemática</CardSubtitle>
      <Field label="Descreve os exercícios">
        <TextArea value={prompt} onChange={setPrompt} placeholder="ex.: 5 problemas de adição e subtracção até 100" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ano escolar">
          <GradeSelect value={gradeLevel} onChange={setGradeLevel} />
        </Field>
        <Field label="Dificuldade">
          <SegmentedControl
            value={difficulty}
            onChange={setDifficulty}
            options={(["facil", "medio", "dificil"] as Difficulty[]).map((d) => ({
              value: d,
              label: difficultyLabel(d),
            }))}
          />
        </Field>
      </div>
      <Field label="Tipo de exercício">
        <Chips values={types} options={TYPE_OPTIONS} onToggle={toggle} />
      </Field>
      <Field label="Número de exercícios">
        <SegmentedControl
          value={count}
          onChange={setCount}
          options={[3, 5, 8, 10].map((n) => ({ value: n, label: String(n) }))}
        />
      </Field>
      <Button size="lg" fullWidth loading={busy} icon={<Sparkles size={20} />} onClick={generate}>
        Gerar Exercícios
      </Button>
    </Card>
  );
}

function DifficultyField({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  return (
    <Field label="Dificuldade">
      <SegmentedControl
        value={value}
        onChange={onChange}
        options={(["facil", "medio", "dificil"] as Difficulty[]).map((d) => ({
          value: d,
          label: difficultyLabel(d),
        }))}
      />
    </Field>
  );
}

function TraducaoConfig({
  kind,
  onAccept,
}: {
  kind: "traducao-en-pt" | "traducao-pt-en";
  onAccept: (e: StoredExercise) => void;
}) {
  const { toast } = useToast();
  const enToPt = kind === "traducao-en-pt";
  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [gen, setGen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const r = await gerarTraducao({ kind, gradeLevel, difficulty, prompt });
      setGen(r.text);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao gerar.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (gen) {
    return (
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <CardTitle>Texto a traduzir</CardTitle>
          <Badge tone="secondary">{enToPt ? "EN → PT" : "PT → EN"}</Badge>
        </div>
        <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-5 leading-relaxed text-ink">
          {gen}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" icon={<RefreshCw size={18} />} loading={busy} onClick={generate}>
            Regenerar
          </Button>
          <Button
            className="flex-1"
            icon={<CheckCircle2 size={18} />}
            onClick={() => onAccept({ type: kind, gradeLevel, sourceText: gen })}
          >
            Aceitar e continuar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <CardSubtitle>
        {enToPt ? "Tradução Inglês → Português" : "Tradução Português → Inglês"}
      </CardSubtitle>
      <Field label="Tema (opcional)">
        <TextArea
          value={prompt}
          onChange={setPrompt}
          placeholder={
            enToPt ? "ex.: a short story about animals" : "ex.: um texto sobre a escola"
          }
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ano escolar">
          <GradeSelect value={gradeLevel} onChange={setGradeLevel} />
        </Field>
        <DifficultyField value={difficulty} onChange={setDifficulty} />
      </div>
      <Button size="lg" fullWidth loading={busy} icon={<Sparkles size={20} />} onClick={generate}>
        Gerar texto
      </Button>
    </Card>
  );
}

function InterpretacaoConfig({
  onAccept,
}: {
  onAccept: (e: StoredExercise) => void;
}) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [count, setCount] = useState(4);
  const [gen, setGen] = useState<{ text: string; questions: McQuestion[] } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const r = await gerarInterpretacao({ gradeLevel, difficulty, count, prompt });
      setGen(r);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao gerar.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (gen) {
    return (
      <Card className="space-y-4">
        <CardTitle>Pré-visualização</CardTitle>
        <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-ink">
          {gen.text}
        </p>
        <div className="space-y-2">
          {gen.questions.map((q, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-display font-bold text-ink">
                {i + 1}. {q.question}
              </p>
              <p className="mt-1 text-success-dark">
                Certa: {q.options[q.correctIndex]}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<RefreshCw size={18} />} loading={busy} onClick={generate}>
            Regenerar
          </Button>
          <Button
            className="flex-1"
            icon={<CheckCircle2 size={18} />}
            onClick={() =>
              onAccept({
                type: "interpretacao-en",
                gradeLevel,
                text: gen.text,
                questions: gen.questions,
              })
            }
          >
            Aceitar e continuar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <CardSubtitle>Interpretação de Inglês (escolha múltipla)</CardSubtitle>
      <Field label="Tema (opcional)">
        <TextArea
          value={prompt}
          onChange={setPrompt}
          placeholder="ex.: a text about sports"
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ano escolar">
          <GradeSelect value={gradeLevel} onChange={setGradeLevel} />
        </Field>
        <DifficultyField value={difficulty} onChange={setDifficulty} />
      </div>
      <Field label="Número de perguntas">
        <SegmentedControl
          value={count}
          onChange={setCount}
          options={[3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
        />
      </Field>
      <Button size="lg" fullWidth loading={busy} icon={<Sparkles size={20} />} onClick={generate}>
        Gerar
      </Button>
    </Card>
  );
}

function AssignStep({
  exercises,
  initialTitle = "",
}: {
  exercises: StoredExercise[];
  initialTitle?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState(initialTitle);
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listStudents().then((r) => setStudents(r.students));
  }, []);

  const years = Array.from(
    new Set(students.map((s) => s.gradeLevel).filter(Boolean) as number[])
  ).sort((a, b) => a - b);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectYear(year: number) {
    setSelected(
      new Set(students.filter((s) => s.gradeLevel === year).map((s) => s.id))
    );
  }
  function selectAll() {
    setSelected(new Set(students.map((s) => s.id)));
  }

  async function save() {
    const studentIds = Array.from(selected);
    if (studentIds.length === 0) return toast("Escolhe pelo menos um aluno.", "warning");
    setBusy(true);
    try {
      const { count } = await createAssignment({
        studentIds,
        title: title.trim() || undefined,
        exercises,
        dueDate: dueDate ? `${dueDate}T23:59:59` : null,
      });
      toast(`Trabalho atribuído a ${count} aluno${count > 1 ? "s" : ""}!`, "success");
      router.replace("/");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao guardar.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>Atribuir o trabalho</CardTitle>
        <CardSubtitle>
          Podes atribuir a vários alunos ao mesmo tempo (ex.: todos de um ano).
        </CardSubtitle>
      </div>

      <Field label="Título (opcional)">
        <input
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex.: Trabalho de casa — semana 12"
        />
      </Field>

      <Field label="Prazo (opcional)">
        <input
          type="date"
          className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <span className="mt-1 block text-sm text-slate-400">
          Sem prazo, o trabalho fica sempre disponível.
        </span>
      </Field>

      <Field label="Alunos">
        {students.length === 0 ? (
          <p className="rounded-2xl bg-warning/10 p-3 text-sm font-semibold text-amber-700">
            Ainda não tens alunos. Cria um aluno no painel antes de atribuir.
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={selectAll}
                className="rounded-full border-2 border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 hover:border-primary hover:text-primary-dark"
              >
                Todos
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => selectYear(y)}
                  className="rounded-full border-2 border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 hover:border-secondary hover:text-secondary-dark"
                >
                  {y}.º ano
                </button>
              ))}
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-full px-3 py-1 text-sm font-semibold text-slate-400 hover:text-danger"
              >
                Limpar
              </button>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {students.map((s) => {
                const on = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition ${
                      on
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span>
                      <span className="font-display font-bold text-ink">
                        {s.displayName}
                      </span>{" "}
                      <span className="text-sm text-slate-400">({s.username})</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {s.gradeLevel ? (
                        <Badge tone="neutral">{s.gradeLevel}.º</Badge>
                      ) : null}
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          on
                            ? "border-primary bg-primary text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {on ? <CheckCircle2 size={14} /> : null}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Field>

      <Button
        size="lg"
        fullWidth
        loading={busy}
        icon={<Send size={20} />}
        onClick={save}
        disabled={students.length === 0 || selected.size === 0}
      >
        Atribuir a {selected.size || "—"} aluno{selected.size === 1 ? "" : "s"}
      </Button>
    </Card>
  );
}
