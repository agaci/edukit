"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  ClipboardList,
  UserPlus,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import {
  listStudents,
  createStudent,
  suggestUsername,
  listAssignments,
} from "@/lib/api";
import { scoreColor, slugifyUsername } from "@/lib/utils";
import type { AssignmentDTO, StudentSummary } from "@/types";

const inputClass =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-ink transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";

const STATUS = {
  pending: { tone: "neutral" as const, label: "Por iniciar", icon: Clock },
  in_progress: { tone: "warning" as const, label: "A meio", icon: Clock },
  completed: { tone: "success" as const, label: "Concluído", icon: CheckCircle2 },
};

export function TutorDashboard() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentSummary[] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentDTO[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const reload = useCallback(() => {
    listStudents().then((r) => setStudents(r.students)).catch(() => setStudents([]));
    listAssignments()
      .then((r) => setAssignments(r.assignments))
      .catch(() => setAssignments([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!students || !assignments) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Painel do tutor</h1>
          <p className="text-slate-500">Gere os teus alunos e cria trabalhos.</p>
        </div>
        <Link href="/tutor/criar">
          <Button icon={<Plus size={18} />} disabled={students.length === 0}>
            Criar trabalho
          </Button>
        </Link>
      </motion.div>

      {/* Alunos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
            <Users size={20} className="text-secondary" /> Alunos
          </h2>
          <Button
            variant="outline"
            size="sm"
            icon={<UserPlus size={16} />}
            onClick={() => setAddOpen(true)}
          >
            Adicionar aluno
          </Button>
        </div>

        {students.length === 0 ? (
          <Card className="text-center text-slate-500">
            Ainda não tens alunos. Adiciona o primeiro para começar.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {students.map((s) => (
              <Card key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-ink">{s.displayName}</p>
                  <p className="text-sm text-slate-400">
                    utilizador: <b>{s.username}</b>
                  </p>
                </div>
                <Badge tone="neutral">{s.assignmentsCount} trab.</Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Trabalhos */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
          <ClipboardList size={20} className="text-primary-dark" /> Trabalhos
        </h2>

        {assignments.length === 0 ? (
          <Card className="text-center text-slate-500">
            Sem trabalhos criados. Usa “Criar trabalho” para gerar 3 exercícios para
            um aluno.
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const st = STATUS[a.status];
              return (
                <Card key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-ink">
                      {a.title || "Trabalho"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {a.studentName} · {new Date(a.createdAt).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {a.finalScore !== undefined && (
                      <span
                        className={`font-display text-2xl font-extrabold ${
                          scoreColor(a.finalScore).text
                        }`}
                      >
                        {a.finalScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(s) => {
          setAddOpen(false);
          reload();
          toast(
            `Aluno criado. Entra com utilizador "${s.username}".`,
            "success"
          );
        }}
      />
    </div>
  );
}

function AddStudentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (s: StudentSummary) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setUsername("");
      setPin("");
    }
  }, [open]);

  useEffect(() => {
    if (!name.trim()) {
      setUsername("");
      return;
    }
    let active = true;
    suggestUsername(name)
      .then((r) => active && setUsername(r.username))
      .catch(() => active && setUsername(slugifyUsername(name)));
    return () => {
      active = false;
    };
  }, [name]);

  async function handleCreate() {
    if (!name.trim()) return toast("Indica o nome do aluno.", "warning");
    if (!/^\d{4,6}$/.test(pin)) return toast("PIN de 4 a 6 dígitos.", "warning");
    setBusy(true);
    try {
      const { student } = await createStudent({
        displayName: name.trim(),
        username: slugifyUsername(username || name),
        pin,
      });
      onCreated(student);
    } catch (err) {
      const data = (err as { data?: { suggestion?: string } })?.data;
      if (data?.suggestion) setUsername(data.suggestion);
      toast(err instanceof Error ? err.message : "Erro ao criar.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar aluno">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-display font-bold text-ink">
            Nome do aluno
          </span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex.: Maria Silva"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-display font-bold text-ink">
            Utilizador (único)
          </span>
          <input
            className={inputClass}
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))
            }
            placeholder="gerado a partir do nome"
          />
          <span className="mt-1 block text-sm text-slate-400">
            É com este utilizador + PIN que o aluno entra.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block font-display font-bold text-ink">PIN (4 a 6 dígitos)</span>
          <input
            className={inputClass + " w-40 tracking-[0.3em]"}
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••"
          />
        </label>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" loading={busy} onClick={handleCreate}>
            Criar aluno
          </Button>
        </div>
      </div>
    </Modal>
  );
}
