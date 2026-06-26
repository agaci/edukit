"use client";

import { Clock } from "lucide-react";
import type { TimerPhase } from "@/hooks/useTimer";
import { formatTime, cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface TimerProps {
  seconds: number;
  phase: TimerPhase;
  total?: number; // para a barra de progresso (countdown)
  label?: string;
  showBar?: boolean;
}

const phaseColor: Record<TimerPhase, string> = {
  normal: "#6366F1",
  warning: "#F59E0B",
  critical: "#F87171",
};

export function Timer({
  seconds,
  phase,
  total,
  label,
  showBar = true,
}: TimerProps) {
  const color = phaseColor[phase];

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2">
        <Clock
          size={22}
          style={{ color }}
          className={cn(phase === "critical" && "animate-pulse-soft")}
        />
        {label && (
          <span className="text-sm font-semibold text-slate-500">{label}:</span>
        )}
        <span
          className={cn(
            "font-display text-2xl font-extrabold tabular-nums",
            phase === "critical" && "animate-pulse-soft"
          )}
          style={{ color }}
        >
          {formatTime(seconds)}
        </span>
      </div>
      {showBar && total ? (
        <div className="mt-2">
          <ProgressBar value={seconds} max={total} color={color} height={8} />
        </div>
      ) : null}
    </div>
  );
}
