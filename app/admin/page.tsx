"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ban,
  CheckCircle2,
  GraduationCap,
  Power,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import * as api from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import type {
  AdminOverview,
  AdminUserRow,
  ClaudeModelId,
  RegistrationMode,
  UsageEventDTO,
  UserStatus,
} from "@/types";

// ============================================================================
// Painel de administração. Só para o papel "admin" — a API valida na mesma;
// isto aqui serve para não mostrar um ecrã inútil a quem não tem permissão.
// ============================================================================

const MODELS: Array<{ id: ClaudeModelId; label: string; hint: string }> = [
  { id: "claude-sonnet-5", label: "Sonnet 5", hint: "$2 / $10 por milhao" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", hint: "$1 / $5 — metade do Sonnet" },
  { id: "claude-opus-4-8", label: "Opus 4.8", hint: "$5 / $25 — 2,5x o Sonnet" },
];

const MODES: Array<{ id: RegistrationMode; label: string; hint: string }> = [
  { id: "open", label: "Aberto", hint: "entra e usa logo" },
  { id: "approval", label: "Com aprovacao", hint: "espera por ti" },
  { id: "closed", label: "Fechado", hint: "ninguem cria conta" },
];

/** Converte milionesimos de dolar em euros, a taxa das definicoes. */
function eur(micros: number, eurPerUsd: number): string {
  const value = (micros / 1e6) * eurPerUsd;
  if (value === 0) return "0,00 €";
  if (value < 0.01) return `${value.toFixed(4).replace(".", ",")} €`;
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function date(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_TONE: Record<UserStatus, "success" | "warning" | "danger"> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
};

const STATUS_LABEL: Record<UserStatus, string> = {
  active: "Activo",
  pending: "Por aprovar",
  suspended: "Suspenso",
};

type Filter = "all" | "tutor" | "student" | "pending";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [events, setEvents] = useState<UsageEventDTO[]>([]);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [budgetInput, setBudgetInput] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [o, u, e] = await Promise.all([
        api.adminOverview(),
        api.adminUsers(),
        api.adminUsage(30),
      ]);
      setOverview(o);
      setUsers(u.users);
      setEvents(e.events);
      setBudgetInput((o.settings.globalMonthlyBudgetCents / 100).toFixed(2));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar.", "error");
    } finally {
      setBusy(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user, load]);

  const filtered = useMemo(() => {
    if (filter === "pending") return users.filter((u) => u.status === "pending");
    if (filter === "all") return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  async function patchSettings(
    patch: Parameters<typeof api.adminUpdateSettings>[0]
  ) {
    try {
      const { settings } = await api.adminUpdateSettings(patch);
      setOverview((o) => (o ? { ...o, settings } : o));
      toast("Definicoes actualizadas.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Nao foi possivel gravar.", "error");
    }
  }

  async function setStatus(row: AdminUserRow, status: UserStatus) {
    try {
      await api.adminSetUserStatus(row.id, status);
      setUsers((list) => list.map((u) => (u.id === row.id ? { ...u, status } : u)));
      toast(
        status === "active"
          ? `${row.displayName} esta activo.`
          : `${row.displayName} foi suspenso.`,
        "success"
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Nao foi possivel mudar.", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardTitle>Area reservada</CardTitle>
        <CardSubtitle>Esta pagina e so para administradores.</CardSubtitle>
      </Card>
    );
  }

  if (!overview) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  const { spend, settings, totals, byOperation } = overview;
  const pct = Math.min(100, spend.ratio * 100);
  const overBudget = spend.ratio >= 1;
  const warning = spend.ratio >= settings.warnThreshold;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Administracao
          </h1>
          <p className="mt-1 text-slate-500">
            Consumo, contas e travoes do EduKit.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={16} />}
          loading={busy}
          onClick={load}
        >
          Actualizar
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Wallet size={22} className="text-primary-dark" />
                Gasto de {spend.periodMonth}
              </span>
            </CardTitle>
            <CardSubtitle>
              {eur(spend.costMicros, settings.eurPerUsd)} de{" "}
              {(settings.globalMonthlyBudgetCents / 100).toFixed(2).replace(".", ",")} €
              {" · "}
              {spend.calls} {spend.calls === 1 ? "chamada" : "chamadas"}
            </CardSubtitle>
          </div>
          <Badge tone={overBudget ? "danger" : warning ? "warning" : "success"}>
            {pct.toFixed(1)}%
          </Badge>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={
              "h-full rounded-full transition-all " +
              (overBudget ? "bg-danger" : warning ? "bg-warning" : "bg-primary")
            }
            style={{ width: `${Math.max(pct, 1)}%` }}
          />
        </div>

        {overBudget && (
          <p className="mt-3 font-semibold text-danger-dark">
            Teto atingido — as geracoes e correccoes estao bloqueadas ate ao
            proximo mes, ou ate subires o teto.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="text-sm font-bold text-slate-500">
            Teto mensal (€)
            <input
              type="number"
              min={0}
              step="0.5"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="mt-1 block w-32 rounded-2xl border-2 border-slate-200 px-3 py-2 text-ink focus:border-primary focus:outline-none"
            />
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              patchSettings({
                globalMonthlyBudgetCents: Math.round(Number(budgetInput) * 100),
              })
            }
          >
            Gravar teto
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Power
                size={20}
                className={settings.apiEnabled ? "text-success-dark" : "text-danger"}
              />
              Correccao automatica
            </span>
          </CardTitle>
          <CardSubtitle>
            {settings.apiEnabled
              ? "Ligada. As chamadas a IA estao a funcionar."
              : "Desligada. Nenhuma chamada a IA e feita."}
          </CardSubtitle>
          <Button
            className="mt-4"
            variant={settings.apiEnabled ? "danger" : "primary"}
            size="sm"
            onClick={() => patchSettings({ apiEnabled: !settings.apiEnabled })}
          >
            {settings.apiEnabled ? "Desligar tudo" : "Voltar a ligar"}
          </Button>

          <div className="mt-6">
            <p className="text-sm font-bold text-slate-500">Modelo</p>
            <div className="mt-2 space-y-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => patchSettings({ model: m.id })}
                  className={
                    "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-left transition " +
                    (settings.model === m.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300")
                  }
                >
                  <span className="font-bold text-ink">{m.label}</span>
                  <span className="text-sm text-slate-500">{m.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={20} className="text-secondary" />
              Registo de novas contas
            </span>
          </CardTitle>
          <CardSubtitle>
            {totals.pending > 0
              ? `${totals.pending} a espera de aprovacao.`
              : "Nada a espera de aprovacao."}
          </CardSubtitle>
          <div className="mt-3 space-y-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => patchSettings({ registrationMode: m.id })}
                className={
                  "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-left transition " +
                  (settings.registrationMode === m.id
                    ? "border-secondary bg-secondary/5"
                    : "border-slate-200 hover:border-slate-300")
                }
              >
                <span className="font-bold text-ink">{m.label}</span>
                <span className="text-sm text-slate-500">{m.hint}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="font-display text-2xl font-extrabold text-ink">
                {totals.tutors}
              </p>
              <p className="text-sm text-slate-500">tutores</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="font-display text-2xl font-extrabold text-ink">
                {totals.students}
              </p>
              <p className="text-sm text-slate-500">alunos</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="font-display text-2xl font-extrabold text-ink">
                {totals.assignments}
              </p>
              <p className="text-sm text-slate-500">trabalhos</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 sm:p-8 sm:pb-4">
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Users size={22} className="text-primary-dark" />
              Utilizadores
            </span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", `Todos (${users.length})`],
                ["tutor", `Tutores (${totals.tutors})`],
                ["student", `Alunos (${totals.students})`],
                ["pending", `Por aprovar (${totals.pending})`],
              ] as Array<[Filter, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={
                  "rounded-2xl px-3 py-1.5 text-sm font-bold transition " +
                  (filter === id
                    ? "bg-ink text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-sm text-slate-500">
                <th className="px-6 py-3 font-bold">Nome</th>
                <th className="px-3 py-3 font-bold">Papel</th>
                <th className="px-3 py-3 font-bold">Estado</th>
                <th className="px-3 py-3 text-right font-bold">Trabalhos</th>
                <th className="px-3 py-3 text-right font-bold">Gasto do mes</th>
                <th className="px-3 py-3 font-bold">Desde</th>
                <th className="px-6 py-3 text-right font-bold">Accoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3">
                    <p className="font-bold text-ink">{u.displayName}</p>
                    <p className="text-sm text-slate-400">
                      {u.username}
                      {u.tutorName ? ` · tutor: ${u.tutorName}` : ""}
                      {u.gradeLevel ? ` · ${u.gradeLevel}.º ano` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    {u.role === "admin" ? (
                      <Badge tone="secondary">
                        <ShieldCheck size={14} /> Admin
                      </Badge>
                    ) : u.role === "tutor" ? (
                      <Badge tone="primary">
                        <GraduationCap size={14} /> Tutor
                        {typeof u.studentsCount === "number"
                          ? ` · ${u.studentsCount}`
                          : ""}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">
                        <User size={14} /> Aluno
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_TONE[u.status]}>
                      {STATUS_LABEL[u.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink">
                    {u.assignmentsCount}
                    <span className="text-slate-400"> / {u.completedCount} feitos</span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span
                      className={
                        u.costMicros > 0 ? "font-bold text-ink" : "text-slate-400"
                      }
                    >
                      {eur(u.costMicros, settings.eurPerUsd)}
                    </span>
                    {u.calls > 0 && <span className="text-slate-400"> · {u.calls}</span>}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500">
                    {date(u.createdAt)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {u.status === "active" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Ban size={16} />}
                        onClick={() => setStatus(u, "suspended")}
                      >
                        Suspender
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<CheckCircle2 size={16} />}
                        onClick={() => setStatus(u, "active")}
                      >
                        {u.status === "pending" ? "Aprovar" : "Reactivar"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Ninguem nesta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <Activity size={22} className="text-secondary" />
            Consumo por operacao
          </span>
        </CardTitle>
        <CardSubtitle>
          Mes de {spend.periodMonth}. A interpretacao de ingles nao aparece
          porque e corrigida sem IA, e por isso nao custa nada.
        </CardSubtitle>

        {byOperation.length === 0 ? (
          <p className="mt-4 text-slate-400">
            Ainda nao ha chamadas registadas este mes.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-sm text-slate-500">
                  <th className="py-2 font-bold">Operacao</th>
                  <th className="py-2 text-right font-bold">Chamadas</th>
                  <th className="py-2 text-right font-bold">Tokens in/out</th>
                  <th className="py-2 text-right font-bold">Custo</th>
                  <th className="py-2 text-right font-bold">Media</th>
                </tr>
              </thead>
              <tbody>
                {byOperation.map((op) => (
                  <tr
                    key={op.operation}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-2 font-semibold text-ink">{op.operation}</td>
                    <td className="py-2 text-right tabular-nums">{op.calls}</td>
                    <td className="py-2 text-right tabular-nums text-slate-500">
                      {op.inputTokens} / {op.outputTokens}
                    </td>
                    <td className="py-2 text-right tabular-nums font-bold text-ink">
                      {eur(op.costMicros, settings.eurPerUsd)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">
                      {eur(Math.round(op.costMicros / op.calls), settings.eurPerUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {events.length > 0 && (
          <>
            <p className="mt-8 text-sm font-bold text-slate-500">Ultimas chamadas</p>
            <div className="mt-2 space-y-1 font-mono text-xs">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-2 py-1.5 odd:bg-slate-50"
                >
                  <span className="text-slate-400">
                    {new Date(e.ts).toLocaleString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-bold text-ink">{e.username}</span>
                  <span className="text-slate-500">{e.operation}</span>
                  <span className="tabular-nums text-slate-500">
                    {e.inputTokens}/{e.outputTokens} tok
                  </span>
                  {e.imageBytes ? (
                    <span className="text-slate-400">
                      foto {Math.round(e.imageBytes / 1024)} kB
                    </span>
                  ) : null}
                  <span className="tabular-nums font-bold text-ink">
                    {eur(e.costMicros, settings.eurPerUsd)}
                  </span>
                  {!e.ok && <span className="font-bold text-danger">{e.errorCode}</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
