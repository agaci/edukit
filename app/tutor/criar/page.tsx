"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Send,
  PencilLine,
  BookOpen,
  Calculator,
} from "lucide-react";
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
import { gerarTexto, gerarExercicios } from "@/lib/client";
import { listStudents, createAssignment } from "@/lib/api";
import { difficultyLabel } from "@/lib/utils";
import type {
  Difficulty,
  ExerciseType,
  InputMode,
  StoredExercise,
  StudentSummary,
} from "@/types";

const STEPS = [
  { type: "ditado", label: "Ditado", icon: PencilLine },
  { type: "compreensao", label: "Compreensão", icon: BookOpen },
  { type: "matematica", label: "Matemática", icon: Calculator },
  { type: "assign", label: "Atribuir", icon: Send },
] as const;

export default function CriarTrabalhoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [built, setBuilt] = useState<StoredExercise[]>([]);

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

  function accept(ex: StoredExercise) {
    setBuilt((b) => [...b, ex]);
    setStep((s) => s + 1);
  }

  function back() {
    if (step === 0) {
      router.replace("/");
      return;
    }
    // built.length === step, por isso ao recuar para o passo anterior
    // mantemos apenas os exercícios já aceites até esse passo.
    const prev = step - 1;
    setBuilt((b) => b.slice(0, prev));
    setStep(prev);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Criar trabalho
          </h1>
          <p className="text-slate-500">
            Gera os 3 exercícios e atribui a um aluno.
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={back}>
          {step === 0 ? "Sair" : "Anterior"}
        </Button>
      </header>

      {/* Stepper */}
      <div className="mb-6 flex gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <div
              key={s.type}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 p-2 ${
                state === "done"
                  ? "border-success/40 bg-success/5 text-success-dark"
                  : state === "active"
                    ? "border-primary bg-primary/5 text-primary-dark"
                    : "border-slate-200 text-slate-400"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-bold">{s.label}</span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && <DitadoConfig onAccept={accept} />}
          {step === 1 && <CompreensaoConfig onAccept={accept} />}
          {step === 2 && <MatematicaConfig onAccept={accept} />}
          {step === 3 && <AssignStep exercises={built} />}
        </motion.div>
      </AnimatePresence>
    </div>
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

function AssignStep({ exercises }: { exercises: StoredExercise[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listStudents().then((r) => {
      setStudents(r.students);
      if (r.students[0]) setStudentId(r.students[0].id);
    });
  }, []);

  async function save() {
    if (!studentId) return toast("Escolhe um aluno.", "warning");
    if (exercises.length !== 3) return toast("Faltam exercícios.", "warning");
    setBusy(true);
    try {
      await createAssignment({ studentId, title: title.trim() || undefined, exercises });
      toast("Trabalho atribuído!", "success");
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
        <CardTitle>Atribuir a um aluno</CardTitle>
        <CardSubtitle>Os 3 exercícios ficam prontos para o aluno resolver em sequência.</CardSubtitle>
      </div>

      <Field label="Título (opcional)">
        <input
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex.: Trabalho de casa — semana 12"
        />
      </Field>

      <Field label="Aluno">
        {students.length === 0 ? (
          <p className="rounded-2xl bg-warning/10 p-3 text-sm font-semibold text-amber-700">
            Ainda não tens alunos. Cria um aluno no painel antes de atribuir.
          </p>
        ) : (
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-display font-bold text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName} ({s.username})
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
        Inclui: Ditado · Compreensão · Matemática
      </div>

      <Button
        size="lg"
        fullWidth
        loading={busy}
        icon={<Send size={20} />}
        onClick={save}
        disabled={students.length === 0}
      >
        Atribuir trabalho
      </Button>
    </Card>
  );
}
