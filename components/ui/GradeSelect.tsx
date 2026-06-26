"use client";

import { cn } from "@/lib/utils";

// Anos escolares agrupados por ciclo (1.º ao 12.º ano).
const GROUPS: { label: string; years: number[] }[] = [
  { label: "1.º Ciclo", years: [1, 2, 3, 4] },
  { label: "2.º Ciclo", years: [5, 6] },
  { label: "3.º Ciclo", years: [7, 8, 9] },
  { label: "Secundário", years: [10, 11, 12] },
];

export function GradeSelect({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Ano escolar"
      className={cn(
        "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-display font-bold text-ink transition min-h-[44px]",
        "focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
        className
      )}
    >
      {GROUPS.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.years.map((y) => (
            <option key={y} value={y}>
              {y}.º ano
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
