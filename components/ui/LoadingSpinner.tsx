"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="A carregar"
      className={cn(
        "inline-block animate-spin rounded-full border-4 border-primary/25 border-t-primary",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Spinner com mensagens rotativas encorajadoras — usado nos estados "a corrigir".
 */
export function LoadingMessages({
  messages,
  intervalMs = 2600,
}: {
  messages: string[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % messages.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <LoadingSpinner size={56} />
      <p
        key={index}
        className="animate-fadeIn font-display text-lg font-bold text-ink"
      >
        {messages[index]}
      </p>
    </div>
  );
}
