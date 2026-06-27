"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Send,
  RefreshCw,
  PencilLine,
  BookOpen,
  Calculator,
  CheckCircle2,
  Languages,
  BookOpenText,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Field, SegmentedControl } from "@/components/ui/Controls";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import {
  gerarTexto,
  gerarExercicios,
  gerarTraducao,
  gerarInterpretacao,
} from "@/lib/client";
import { getAssignment, listStudents, createAssignment } from "@/lib/api";
import { difficultyLabel } from "@/lib/utils";
import type {
  AssignmentDTO,
  Difficulty,
  StoredExercise,
  StudentSummary,
} from "@/types";

const TYPE: Record<string, { label: string; icon: typeof PencilLine }> = {
  ditado: { label: "Ditado", icon: PencilLine },
  compreensao: { label: "Compreensão", icon: BookOpen },
  matematica: { label: "Matemática", icon: Calculator },
  "traducao-en-pt": { label: "Inglês→PT", icon: Languages },
  "traducao-pt-en": { label: "PT→Inglês", icon: Languages },
  "interpretacao-en": { label: "Interpretação EN", icon: BookOpenText },
};

function refTexto(original: string): string {
  return `Cria um texto SEMELHANTE a este — mesmo tema e tipo de texto — mas com conteúdo DIFERENTE (não copies frases nem palavras-chave de forma idêntica). Texto de referência:\n"${original}"`;
}

// Regenera um exercício parecido (mas diferente) na nova dificuldade.
async function regenerar(
  exercise: StoredExercise,
  difficulty: Difficulty
): Promise<StoredExercise> {
  if (exercise.type === "ditado") {
    const t = await gerarTexto({
      prompt: refTexto(exercise.text),
      gradeLevel: exercise.gradeLevel,
      difficulty,
      type: "ditado",
    });
    return {
      type: "ditado",
      gradeLevel: exercise.gradeLevel,
      text: t.text,
      wordCount: t.wordCount,
      maxPlays: exercise.maxPlays,
      inputMode: exercise.inputMode,
    };
  }
  if (exercise.type === "compreensao") {
    const seed = exercise.theme
      ? `Cria um texto SEMELHANTE (mesmo tema: "${exercise.theme}") mas DIFERENTE deste:\n"${exercise.text}"`
      : refTexto(exercise.text);
    const t = await gerarTexto({
      prompt: seed,
      gradeLevel: exercise.gradeLevel,
      difficulty,
      type: "compreensao",
    });
    return {
      type: "compreensao",
      gradeLevel: exercise.gradeLevel,
      text: t.text,
      theme: t.theme,
      readMinutes: exercise.readMinutes,
      writeMinutes: exercise.writeMinutes,
    };
  }
  if (
    exercise.type === "traducao-en-pt" ||
    exercise.type === "traducao-pt-en"
  ) {
    const r = await gerarTraducao({
      kind: exercise.type,
      gradeLevel: exercise.gradeLevel,
      difficulty,
      prompt: `Cria um texto SEMELHANTE (mesmo tema e tipo) mas DIFERENTE deste:\n"${exercise.sourceText}"`,
    });
    return {
      type: exercise.type,
      gradeLevel: exercise.gradeLevel,
      sourceText: r.text,
    };
  }
  if (exercise.type === "interpretacao-en") {
    const r = await gerarInterpretacao({
      gradeLevel: exercise.gradeLevel,
      difficulty,
      count: exercise.questions.length,
      prompt: `Cria um texto e perguntas SEMELHANTES (mesmo tema) mas DIFERENTES deste:\n"${exercise.text}"`,
    });
    return {
      type: "interpretacao-en",
      gradeLevel: exercise.gradeLevel,
      text: r.text,
      questions: r.questions,
    };
  }
  // matemática
  const statements = exercise.exercises.map((e) => e.statement).join(" | ");
  const r = await gerarExercicios({
    prompt: `Cria ${exercise.exercises.length} exercícios SEMELHANTES a estes (mesmos tipos e temas) mas DIFERENTES: ${statements}`,
    gradeLevel: exercise.gradeLevel,
    exerciseTypes: [],
    count: exercise.exercises.length,
    difficulty,
  });
  return {
    type: "matematica",
    gradeLevel: exercise.gradeLevel,
    exercises: r.exercises,
  };
}

export default function CriarSemelhantePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [source, setSource] = useState<AssignmentDTO | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [built, setBuilt] = useState<StoredExercise[] | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "tutor")) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    getAssignment(id)
      .then((r) => {
        setSource(r.assignment);
        setStudentId(r.assignment.studentId);
        setTitle(`${r.assignment.title || "Trabalho"} (semelhante)`);
      })
      .catch((e) => toast(e instanceof Error ? e.message : "Erro.", "error"));
    listStudents().then((r) => setStudents(r.students));
  }, [id, toast]);

  async function gerar() {
    if (!source) return;
    setBusy(true);
    setBuilt(null);
    try {
      const out: StoredExercise[] = [];
      for (const item of source.items) {
        setProgress(TYPE[item.exercise.type].label);
        // eslint-disable-next-line no-await-in-loop
        out.push(await regenerar(item.exercise, difficulty));
      }
      setBuilt(out);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao gerar.", "error");
    } finally {
      setProgress(null);
      setBusy(false);
    }
  }

  async function atribuir() {
    if (!built || !studentId) return;
    setBusy(true);
    try {
      await createAssignment({
        studentIds: [studentId],
        title: title.trim() || undefined,
        exercises: built,
        dueDate: dueDate ? `${dueDate}T23:59:59` : null,
      });
      toast("Teste semelhante criado e atribuído!", "success");
      router.replace("/");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao atribuir.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (!source) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/tutor/trabalho/${id}`}>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Voltar ao teste
          </Button>
        </Link>
      </div>

      <header>
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Criar teste semelhante
        </h1>
        <p className="text-slate-500">
          Gera um teste parecido com &quot;{source.title || "Trabalho"}&quot;, mas
          com conteúdo diferente e na dificuldade que escolheres.
        </p>
      </header>

      {/* Configuração */}
      <Card className="space-y-5">
        <Field label="Grau de dificuldade do novo teste">
          <SegmentedControl
            value={difficulty}
            onChange={setDifficulty}
            options={(["facil", "medio", "dificil"] as Difficulty[]).map((d) => ({
              value: d,
              label: difficultyLabel(d),
            }))}
          />
        </Field>

        <Field label="Atribuir a">
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-display font-bold text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName} ({s.username})
                {s.gradeLevel ? ` — ${s.gradeLevel}.º ano` : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Título">
          <input
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Prazo (opcional)">
          <input
            type="date"
            className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-ink focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Inclui:{" "}
          {source.items.map((it) => TYPE[it.exercise.type].label).join(" · ")}
        </div>

        <Button
          size="lg"
          fullWidth
          loading={busy && !built}
          icon={<Sparkles size={20} />}
          onClick={gerar}
        >
          {built ? "Gerar de novo" : "Gerar teste semelhante"}
        </Button>
        {progress && (
          <p className="text-center text-sm font-semibold text-slate-500">
            A gerar: {progress}…
          </p>
        )}
      </Card>

      {/* Pré-visualização + atribuir */}
      {built && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Pré-visualização</CardTitle>
            <Badge tone="primary">{built.length} exercícios</Badge>
          </div>
          <div className="space-y-3">
            {built.map((ex, i) => {
              const meta = TYPE[ex.type];
              const Icon = meta.icon;
              return (
                <div key={i} className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Icon size={16} className="text-primary-dark" />
                    <span className="font-display font-bold text-ink">
                      {i + 1}. {meta.label}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-slate-500">
                    {ex.type === "matematica"
                      ? ex.exercises.map((e) => e.statement).join(" · ")
                      : ex.type === "traducao-en-pt" ||
                          ex.type === "traducao-pt-en"
                        ? ex.sourceText
                        : ex.text}
                  </p>

                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={<RefreshCw size={18} />}
              loading={busy && !!progress}
              onClick={gerar}
            >
              Regenerar
            </Button>
            <Button
              className="flex-1"
              icon={<Send size={20} />}
              loading={busy && !progress}
              onClick={atribuir}
            >
              Atribuir teste
            </Button>
          </div>
        </Card>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-sm text-slate-400">
        <CheckCircle2 size={14} className="text-success" />
        O conteúdo é gerado de novo — parecido, mas nunca igual ao original.
      </p>
    </div>
  );
}
