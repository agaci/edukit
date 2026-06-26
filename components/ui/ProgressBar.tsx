import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0..max
  max?: number;
  color?: string; // cor css (hex) — opcional
  className?: string;
  height?: number;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color,
  className,
  height = 12,
  label,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex justify-between text-sm font-semibold text-slate-600">
          <span>{label}</span>
        </div>
      )}
      <div
        className="w-full overflow-hidden rounded-full bg-slate-200"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color ?? "#84CC16",
          }}
        />
      </div>
    </div>
  );
}
