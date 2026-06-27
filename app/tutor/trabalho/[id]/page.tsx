"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  PencilLine,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  Camera,
  MessageCircleHeart,
  Award,
  Sparkles,
  RotateCcw,
  History,
  Languages,
  BookOpenText,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CorrectionsList } from "@/components/shared/ResultsPanel";
import { MathExerciseResult } from "@/components/shared/MathExerciseResult";
import { useToast } from "@/components/ui/Toast";
import { scoreColor, formatDate, isOverdue, wasLate } from "@/lib/utils";
import { getAssignment, repeatAssignment } from "@/lib/api";
import type { AssignmentDTO, AssignmentItem, MathResult } from "@/types";

const TYPE: Record<string, { label: string; icon: typeof PencilLine }> = {
  ditado: { label: "Ditado", icon: PencilLine },
  compreensao: { label: "Compreensão Escrita", icon: BookOpen },
  matematica: { label: "Matemática", icon: Calculator },
  "traducao-en-pt": { label: "Tradução Inglês→Português", icon: Languages },
  "traducao-pt-en": { label: "Tradução Português→Inglês", icon: Languages },
  "interpretacao-en": { label: "Interpretação (Inglês)", icon: BookOpenText },
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function TutorAssignmentPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { toast } = useToast();
  const [a, setA] = useState<AssignmentDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRepeat, setConfirmRepeat] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAssignment(id)
      .then((r) => setA(r.assignment))
      .catch((e) => setError(e instanceof Error ? e.message : "Erro."));
  }, [id]);

  async function doRepeat() {
    setBusy(true);
    try {
      const r = await repeatAssignment(id);
      setA(r.assignment);
      setConfirmRepeat(false);
      toast("Teste reposto — o aluno pode repetir.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao repetir.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-slate-500">{error}</p>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="outline" icon={<ArrowLeft size={18} />}>
            Voltar ao painel
          </Button>
        </Link>
      </div>
    );
  }

  if (!a) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  const hasResults = a.items.some((it) => typeof it.score === "number");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Painel
          </Button>
        </Link>
        <div className="flex gap-2">
          {hasResults && (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={16} />}
              onClick={() => setConfirmRepeat(true)}
            >
              Repetir teste
            </Button>
          )}
          <Link href={`/tutor/trabalho/${a.id}/semelhante`}>
            <Button variant="outline" size="sm" icon={<Sparkles size={16} />}>
              Criar semelhante
            </Button>
          </Link>
        </div>
      </div>

      {/* Cabeçalho do trabalho */}
      <Card className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{a.title || "Trabalho"}</CardTitle>
              {a.attemptNumber && a.attemptNumber > 1 ? (
                <Badge tone="secondary">Tentativa {a.attemptNumber}</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-slate-500">
              Aluno: <b>{a.studentName}</b> (<code>{a.studentUsername}</code>)
            </p>
            <p className="text-sm text-slate-400">
              Criado em {new Date(a.createdAt).toLocaleDateString("pt-PT")}
            </p>
            {a.dueDate && (
              <p
                className={`text-sm ${
                  isOverdue(a) || wasLate(a) ? "text-danger" : "text-slate-400"
                }`}
              >
                Prazo: {formatDate(a.dueDate)}
                {isOverdue(a) ? " · atrasado" : wasLate(a) ? " · entregue atrasado" : ""}
              </p>
            )}
          </div>
          {a.finalScore !== undefined && (
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs font-semibold uppercase text-slate-400">
                <Award size={14} /> Nota final
              </div>
              <span
                className={`font-display text-4xl font-extrabold ${
                  scoreColor(a.finalScore).text
                }`}
              >
                {a.finalScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Histórico de tentativas */}
      {a.attempts && a.attempts.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <History size={18} className="text-secondary" />
            <h3 className="font-display font-extrabold text-ink">
              Histórico de tentativas
            </h3>
          </div>
          <div className="space-y-2">
            {a.attempts.map((at) => (
              <div
                key={at.attemptNumber}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
              >
                <span className="text-sm text-slate-500">
                  Tentativa {at.attemptNumber}
                  {at.completedAt ? ` · ${formatDate(at.completedAt)}` : ""}
                </span>
                <span
                  className={`font-display text-xl font-extrabold ${
                    at.finalScore !== undefined
                      ? scoreColor(at.finalScore).text
                      : "text-slate-300"
                  }`}
                >
                  {at.finalScore !== undefined ? at.finalScore.toFixed(1) : "—"}
                </span>
              </div>
            ))}
            {a.finalScore !== undefined && (
              <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
                <span className="text-sm font-semibold text-primary-dark">
                  Tentativa {a.attemptNumber ?? a.attempts.length + 1} (atual)
                </span>
                <span
                  className={`font-display text-xl font-extrabold ${
                    scoreColor(a.finalScore).text
                  }`}
                >
                  {a.finalScore.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Exercícios (enunciado + resposta + correção) */}
      {a.items.map((item, i) => (
        <ItemCard key={i} index={i} item={item} />
      ))}

      <Modal
        open={confirmRepeat}
        onClose={() => setConfirmRepeat(false)}
        title="Repetir este teste?"
      >
        <p className="text-slate-600">
          A nota atual fica guardada no histórico de tentativas e o teste volta a
          ficar disponível para <b>{a.studentName}</b> resolver de novo, com o
          mesmo enunciado.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setConfirmRepeat(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={busy}
            icon={<RotateCcw size={18} />}
            onClick={doRepeat}
          >
            Repetir
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ItemCard({ index, item }: { index: number; item: AssignmentItem }) {
  const { exercise, result, score } = item;
  const meta = TYPE[exercise.type];
  const Icon = meta.icon;
  const completed = typeof score === "number";

  return (
    <Card className="space-y-4">
      {/* Cabeçalho do exercício */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary-dark">
          <Icon size={20} />
        </span>
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold text-ink">
            {index + 1}. {meta.label}
          </p>
          <p className="text-sm text-slate-400">{exercise.gradeLevel}.º ano</p>
        </div>
        {completed ? (
          <div className="flex items-center gap-2">
            <Badge tone="success">
              <CheckCircle2 size={14} /> Concluído
            </Badge>
            <span
              className={`font-display text-2xl font-extrabold ${
                scoreColor(score!).text
              }`}
            >
              {score!.toFixed(1)}
            </span>
          </div>
        ) : (
          <Badge tone="neutral">
            <Clock size={14} /> Por fazer
          </Badge>
        )}
      </div>

      {/* Enunciado original */}
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          Enunciado original
        </h4>
        {exercise.type === "matematica" ? (
          <div className="space-y-2">
            {exercise.exercises.map((ex) => (
              <div key={ex.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-display font-bold text-ink">
                  {ex.id}. {ex.statement}
                </p>
                <p className="mt-1 text-slate-500">
                  Resposta certa: <b>{ex.correctAnswer}</b>
                </p>
              </div>
            ))}
          </div>
        ) : exercise.type === "traducao-en-pt" ||
          exercise.type === "traducao-pt-en" ? (
          <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 leading-relaxed text-ink">
            {exercise.sourceText}
          </p>
        ) : exercise.type === "interpretacao-en" ? (
          <div className="space-y-2">
            <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 leading-relaxed text-ink">
              {exercise.text}
            </p>
            {exercise.questions.map((q) => (
              <div key={q.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-display font-bold text-ink">
                  {q.id}. {q.question}
                </p>
                <p className="mt-1 text-success-dark">
                  Certa: {q.options[q.correctIndex]}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 leading-relaxed text-ink">
            {exercise.text}
            {exercise.type === "compreensao" && exercise.theme ? (
              <span className="mt-2 block text-sm text-slate-400">
                Tema: {exercise.theme}
              </span>
            ) : null}
          </p>
        )}
      </div>

      {/* Resposta do aluno */}
      {completed && exercise.type !== "interpretacao-en" && (
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
            Resposta do aluno
          </h4>
          {item.viaPhoto ? (
            <div className="rounded-xl bg-secondary/5 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-secondary-dark">
                <Camera size={14} /> Entregue por fotografia
              </p>
              {result?.readableText && (
                <p className="mt-2 whitespace-pre-line text-slate-600">
                  Lido da foto: {result.readableText}
                </p>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 leading-relaxed text-ink">
              {item.studentAnswer?.trim() || "—"}
            </p>
          )}
        </div>
      )}

      {/* Correção */}
      {completed && result && (
        <div className="space-y-3">
          {result.feedback && (
            <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3">
              <MessageCircleHeart
                size={18}
                className="mt-0.5 shrink-0 text-primary-dark"
              />
              <p className="text-sm leading-relaxed text-slate-600">
                {result.feedback}
              </p>
            </div>
          )}

          {result.criteria && result.criteria.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {result.criteria.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="text-slate-500">{c.name}</span>
                  <b className="text-ink">
                    {c.score.toFixed(1)}/{c.max}
                  </b>
                </div>
              ))}
            </div>
          )}

          {exercise.type === "matematica" &&
          (result as MathResult).exerciseResults?.length ? (
            <div className="space-y-2">
              {(result as MathResult).exerciseResults.map((er) => (
                <MathExerciseResult
                  key={er.exerciseId}
                  er={er}
                  statement={
                    exercise.exercises.find((e) => e.id === er.exerciseId)
                      ?.statement
                  }
                />
              ))}
            </div>
          ) : result.mcResults && result.mcResults.length > 0 ? (
            <div className="space-y-1.5 text-sm">
              {result.mcResults.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 ${
                    r.correct
                      ? "bg-success/10 text-success-dark"
                      : "bg-danger/10 text-danger-dark"
                  }`}
                >
                  <b>{i + 1}.</b> {r.correct ? "Certo" : "Errado"} — respondeu{" "}
                  {LETTERS[r.selectedIndex] ?? "—"}
                  {!r.correct ? `, certa ${LETTERS[r.correctIndex]}` : ""}
                </div>
              ))}
            </div>
          ) : result.corrections ? (
            <CorrectionsList corrections={result.corrections} />
          ) : null}
        </div>
      )}
    </Card>
  );
}
