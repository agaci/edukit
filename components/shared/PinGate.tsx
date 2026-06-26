"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface PinGateProps {
  open: boolean;
  expectedPin: string;
  title?: string;
  description?: string;
  onSuccess: () => void;
  onClose?: () => void;
}

const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 30;

/**
 * Modal com 4 inputs numéricos. Foco automático entre dígitos, shake em erro,
 * máximo de 3 tentativas e bloqueio de 30s.
 */
export function PinGate({
  open,
  expectedPin,
  title = "Área do Tutor",
  description = "Introduz o PIN de 4 dígitos para continuar.",
  onSuccess,
  onClose,
}: PinGateProps) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const locked = lockUntil !== null && now < lockUntil;
  const lockRemaining = locked ? Math.ceil((lockUntil! - now) / 1000) : 0;

  useEffect(() => {
    if (!open) return;
    setDigits(["", "", "", ""]);
    setError(false);
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [locked]);

  function handleChange(index: number, value: string) {
    if (locked) return;
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(false);

    if (digit && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      verify(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function verify(pin: string) {
    if (pin === expectedPin) {
      setAttempts(0);
      onSuccess();
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setError(true);
    setDigits(["", "", "", ""]);
    inputsRef.current[0]?.focus();
    if (nextAttempts >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCK_SECONDS * 1000);
      setAttempts(0);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={undefined} showClose={!!onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/15">
          <Lock className="text-secondary" size={28} />
        </div>
        <h2 className="font-display text-2xl font-extrabold text-ink">{title}</h2>
        <p className="mt-1 mb-6 text-slate-500">{description}</p>

        <motion.div
          className="flex gap-3"
          animate={error ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              disabled={locked}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Dígito ${i + 1}`}
              className={cn(
                "h-16 w-14 rounded-2xl border-2 text-center font-display text-3xl font-extrabold text-ink transition",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40",
                error ? "border-danger bg-danger/5" : "border-slate-200",
                locked && "opacity-50"
              )}
            />
          ))}
        </motion.div>

        {error && !locked && (
          <p className="mt-4 text-sm font-semibold text-danger">
            PIN incorrecto. Tenta novamente.
          </p>
        )}
        {locked && (
          <p className="mt-4 text-sm font-semibold text-danger">
            Demasiadas tentativas. Aguarda {lockRemaining}s.
          </p>
        )}
      </div>
    </Modal>
  );
}
