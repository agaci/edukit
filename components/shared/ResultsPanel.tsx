"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageCircleHeart,
  Clock,
  Type,
  PartyPopper,
} from "lucide-react";
import type { Correction, CriterionScore } from "@/types";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { Card } from "@/components/ui/Card";
import { formatTime } from "@/lib/utils";

interface ResultsPanelProps {
  score: number;
  feedback: string;
  criteria?: CriterionScore[];
  corrections?: Correction[];
  timeSpent?: number;
  wordCount?: number;
  extraStats?: { label: string; value: string }[];
  children?: ReactNode; // botões de acção
}

export function CorrectionsList({ corrections }: { corrections: Correction[] }) {
  if (corrections.length === 0) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-center font-semibold text-success-dark">
        <PartyPopper size={18} className="text-success" />
        Sem erros encontrados. Excelente trabalho!
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {corrections.map((c, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.07 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"
        >
          <div className="flex flex-wrap items-center gap-2 font-display font-bold">
            <span className="rounded-lg bg-danger/10 px-2 py-1 text-danger-dark line-through">
              {c.original}
            </span>
            <ArrowRight size={16} className="text-slate-400" />
            <span className="rounded-lg bg-success/10 px-2 py-1 text-success-dark">
              {c.correct}
            </span>
          </div>
          {c.explanation && (
            <p className="mt-2 text-sm text-slate-500">{c.explanation}</p>
          )}
        </motion.li>
      ))}
    </ul>
  );
}

export function ResultsPanel({
  score,
  feedback,
  criteria,
  corrections,
  timeSpent,
  wordCount,
  extraStats,
  children,
}: ResultsPanelProps) {
  const stats: { label: string; value: string; icon: ReactNode }[] = [];
  if (typeof timeSpent === "number") {
    stats.push({
      label: "Tempo",
      value: formatTime(timeSpent),
      icon: <Clock size={18} className="text-secondary" />,
    });
  }
  if (typeof wordCount === "number") {
    stats.push({
      label: "Palavras",
      value: String(wordCount),
      icon: <Type size={18} className="text-secondary" />,
    });
  }
  extraStats?.forEach((s) =>
    stats.push({ ...s, icon: <Clock size={18} className="text-secondary" /> })
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="flex flex-col items-center">
        <ScoreDisplay score={score} criteria={criteria} />
      </Card>

      {feedback && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MessageCircleHeart className="text-primary-dark" size={20} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-ink">
                O que diz o professor
              </h3>
              <p className="mt-1 leading-relaxed text-slate-600">{feedback}</p>
            </div>
          </div>
        </Card>
      )}

      {corrections && (
        <Card>
          <h3 className="mb-4 font-display text-lg font-extrabold text-ink">
            Correções
          </h3>
          <CorrectionsList corrections={corrections} />
        </Card>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="flex flex-col items-center py-4">
              {s.icon}
              <span className="mt-1 font-display text-xl font-extrabold text-ink">
                {s.value}
              </span>
              <span className="text-sm text-slate-400">{s.label}</span>
            </Card>
          ))}
        </div>
      )}

      {children && (
        <div className="flex flex-wrap justify-center gap-3">{children}</div>
      )}
    </motion.div>
  );
}
