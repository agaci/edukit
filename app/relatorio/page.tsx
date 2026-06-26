"use client";

import { useEffect, useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Logo } from "@/components/layout/Logo";
import {
  loadHistory,
  loadSettings,
  moduleStats,
  type ModuleStats,
} from "@/lib/storage";
import type { ModuleId, SessionResult } from "@/types";
import { moduleName, scoreColor, formatTime } from "@/lib/utils";

const MODULES: ModuleId[] = ["ditado", "compreensao", "matematica"];
const N = 10;

export default function RelatorioPage() {
  const [history, setHistory] = useState<SessionResult[]>([]);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    setHistory(loadHistory());
    setStudentName(loadSettings().studentName);
  }, []);

  const stats: Record<ModuleId, ModuleStats> = {
    ditado: moduleStats(history, "ditado"),
    compreensao: moduleStats(history, "compreensao"),
    matematica: moduleStats(history, "matematica"),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link href="/">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Início
          </Button>
        </Link>
        <Button
          variant="outline"
          icon={<Printer size={18} />}
          onClick={() => window.print()}
        >
          Imprimir / PDF
        </Button>
      </div>

      <div className="print-area space-y-6">
        <Card className="flex items-center justify-between print-area">
          <div>
            <Logo size={36} />
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">
              Relatório de Progresso
            </h1>
            {studentName && (
              <p className="text-slate-500">Aluno: {studentName}</p>
            )}
          </div>
          <p className="text-right text-sm text-slate-400">
            {new Date().toLocaleDateString("pt-PT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </Card>

        {history.length === 0 ? (
          <Card>
            <p className="text-center text-slate-500">
              Ainda não há resultados para mostrar.
            </p>
          </Card>
        ) : (
          <>
            {/* Médias por módulo */}
            <Card className="space-y-4 print-area">
              <h2 className="font-display text-xl font-extrabold text-ink">
                Médias por módulo
              </h2>
              {MODULES.map((m) => {
                const avg = stats[m].average;
                return (
                  <div key={m}>
                    <div className="mb-1 flex justify-between text-sm font-semibold">
                      <span className="text-slate-600">{moduleName(m)}</span>
                      <span className="text-ink">
                        {avg !== null ? `${avg.toFixed(1)} / 20` : "—"} ·{" "}
                        {stats[m].count} sessões
                      </span>
                    </div>
                    <ProgressBar
                      value={avg ?? 0}
                      max={20}
                      color={avg !== null ? scoreColor(avg).hex : "#E2E8F0"}
                    />
                  </div>
                );
              })}
            </Card>

            {/* Últimas N sessões por módulo */}
            {MODULES.map((m) => {
              const entries = history.filter((h) => h.module === m).slice(0, N);
              if (entries.length === 0) return null;
              return (
                <Card key={m} className="print-area">
                  <h2 className="mb-3 font-display text-xl font-extrabold text-ink">
                    {moduleName(m)}
                  </h2>
                  {/* Mini gráfico de evolução (barras CSS) */}
                  <div className="mb-4 flex h-24 items-end gap-2">
                    {[...entries].reverse().map((e) => (
                      <div
                        key={e.id}
                        className="flex flex-1 flex-col items-center justify-end"
                        title={`${e.score.toFixed(1)} — ${new Date(
                          e.date
                        ).toLocaleDateString("pt-PT")}`}
                      >
                        <div
                          className="w-full rounded-t-md"
                          style={{
                            height: `${(e.score / 20) * 100}%`,
                            backgroundColor: scoreColor(e.score).hex,
                            minHeight: 4,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="pb-2 font-semibold">Data</th>
                        <th className="pb-2 font-semibold">Nota</th>
                        <th className="pb-2 font-semibold">Tempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.id} className="border-t border-slate-100">
                          <td className="py-2 text-slate-600">
                            {new Date(e.date).toLocaleDateString("pt-PT")}
                          </td>
                          <td className="py-2">
                            <span
                              className={`font-display font-bold ${
                                scoreColor(e.score).text
                              }`}
                            >
                              {e.score.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-2 text-slate-500">
                            {formatTime(e.timeSpent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
