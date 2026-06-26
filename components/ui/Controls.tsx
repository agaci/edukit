"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display font-bold text-ink">{label}</span>
      {hint && <span className="mb-2 block text-sm text-slate-500">{hint}</span>}
      {children}
    </label>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  noAutocorrect = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  /** Desativa autocorretor/sugestões/maiúsculas automáticas (ex.: ditado). */
  noAutocorrect?: boolean;
}) {
  const correctionProps = noAutocorrect
    ? {
        spellCheck: false,
        autoCorrect: "off" as const,
        autoCapitalize: "off" as const,
        autoComplete: "off" as const,
      }
    : {};

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      {...correctionProps}
      className={cn(
        "w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-ink transition placeholder:text-slate-400",
        "focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
        className
      )}
    />
  );
}

interface Option<T extends string | number> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-xl px-4 py-2 font-display text-sm font-bold transition min-h-[44px]",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
              active
                ? "bg-white text-primary-dark shadow-soft"
                : "text-slate-500 hover:text-ink"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chips<T extends string>({
  values,
  options,
  onToggle,
}: {
  values: T[];
  options: Option<T>[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-full border-2 px-4 py-2 font-semibold transition min-h-[44px]",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/30",
              active
                ? "border-secondary bg-secondary/10 text-secondary-dark"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary"
      />
      <span className="min-w-[64px] text-right font-display font-bold text-ink tabular-nums">
        {format ? format(value) : value}
      </span>
    </div>
  );
}

export function PinInput({
  value,
  onChange,
  label = "PIN do aluno (4 dígitos)",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <Field label={label} hint="O tutor define este PIN antes de o aluno começar.">
      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="••••"
        className="w-32 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center font-display text-2xl font-extrabold tracking-[0.4em] text-ink focus:border-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20"
      />
    </Field>
  );
}
