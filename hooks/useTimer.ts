"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// Hook de cronómetro: suporta contagem decrescente e crescente.
// Estados visuais: normal / aviso (últimos 30s) / crítico (últimos 10s).
// ============================================================================

export type TimerStatus = "idle" | "running" | "paused" | "done";
export type TimerPhase = "normal" | "warning" | "critical";

export interface UseTimerOptions {
  mode: "countdown" | "countup";
  durationSeconds?: number; // necessário para countdown
  autoStart?: boolean;
  onTick?: (secondsLeftOrElapsed: number) => void;
  onComplete?: () => void;
}

export interface UseTimer {
  seconds: number; // restantes (countdown) ou decorridos (countup)
  status: TimerStatus;
  phase: TimerPhase;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export function useTimer(options: UseTimerOptions): UseTimer {
  const { mode, durationSeconds = 0, autoStart = false, onTick, onComplete } =
    options;

  const [seconds, setSeconds] = useState(
    mode === "countdown" ? durationSeconds : 0
  );
  const [status, setStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mantém callbacks frescos sem re-armar o intervalo.
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onTickRef.current = onTick;
    onCompleteRef.current = onComplete;
  }, [onTick, onComplete]);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setSeconds((prev) => {
      if (mode === "countdown") {
        const next = prev - 1;
        if (next <= 0) {
          clear();
          setStatus("done");
          onTickRef.current?.(0);
          onCompleteRef.current?.();
          return 0;
        }
        onTickRef.current?.(next);
        return next;
      } else {
        const next = prev + 1;
        onTickRef.current?.(next);
        return next;
      }
    });
  }, [mode, clear]);

  const start = useCallback(() => {
    clear();
    setSeconds(mode === "countdown" ? durationSeconds : 0);
    setStatus("running");
    intervalRef.current = setInterval(tick, 1000);
  }, [clear, mode, durationSeconds, tick]);

  const pause = useCallback(() => {
    clear();
    setStatus((s) => (s === "running" ? "paused" : s));
  }, [clear]);

  const resume = useCallback(() => {
    setStatus((s) => {
      if (s !== "paused") return s;
      clear();
      intervalRef.current = setInterval(tick, 1000);
      return "running";
    });
  }, [clear, tick]);

  const reset = useCallback(() => {
    clear();
    setSeconds(mode === "countdown" ? durationSeconds : 0);
    setStatus("idle");
  }, [clear, mode, durationSeconds]);

  useEffect(() => {
    if (autoStart) start();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantém o valor inicial sincronizado se a duração mudar enquanto em idle.
  useEffect(() => {
    if (status === "idle" && mode === "countdown") {
      setSeconds(durationSeconds);
    }
  }, [durationSeconds, status, mode]);

  let phase: TimerPhase = "normal";
  if (mode === "countdown" && status === "running") {
    if (seconds <= 10) phase = "critical";
    else if (seconds <= 30) phase = "warning";
  }

  return { seconds, status, phase, start, pause, resume, reset };
}
