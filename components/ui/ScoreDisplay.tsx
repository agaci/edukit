"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { Star } from "lucide-react";
import type { CriterionScore } from "@/types";
import { scoreColor } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ScoreDisplayProps {
  score: number; // 0..20
  criteria?: CriterionScore[];
}

const CONFETTI_COLORS = ["#84CC16", "#6366F1", "#FBBF24", "#22C55E", "#F87171"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-confetti-fall rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ScoreDisplay({ score, criteria }: ScoreDisplayProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const { hex, band } = scoreColor(score);

  const [displayScore, setDisplayScore] = useState(0);
  const progress = useMotionValue(0);
  const [dashOffset, setDashOffset] = useState(circumference);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const controls = animate(progress, score / 20, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplayScore(Math.round(v * 20 * 10) / 10);
        setDashOffset(circumference * (1 - v));
      },
    });
    if (score >= 18) {
      const t = setTimeout(() => setShowConfetti(true), 600);
      const t2 = setTimeout(() => setShowConfetti(false), 3600);
      return () => {
        controls.stop();
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      {showConfetti && <Confetti />}

      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg width={200} height={200} className="-rotate-90">
          <circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={16}
          />
          <circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke={hex}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {band === "excellent" && (
            <div className="mb-1 flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, type: "spring" }}
                >
                  <Star size={18} className="fill-gold text-gold" />
                </motion.span>
              ))}
            </div>
          )}
          <span
            className="font-display text-5xl font-extrabold"
            style={{ color: hex }}
          >
            {displayScore.toFixed(1)}
          </span>
          <span className="text-sm font-semibold text-slate-400">em 20</span>
        </div>
      </div>

      {criteria && criteria.length > 0 && (
        <div className="mt-6 w-full max-w-sm space-y-3">
          {criteria.map((c) => {
            const pct = (c.score / c.max) * 20;
            return (
              <div key={c.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">{c.name}</span>
                  <span className="font-bold text-ink">
                    {c.score.toFixed(1)}/{c.max}
                  </span>
                </div>
                <ProgressBar
                  value={pct}
                  max={20}
                  color={scoreColor(pct).hex}
                  height={8}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
