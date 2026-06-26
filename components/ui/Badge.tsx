import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "secondary" | "success" | "danger" | "warning" | "neutral";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary/15 text-primary-dark",
  secondary: "bg-secondary/15 text-secondary-dark",
  success: "bg-success/15 text-success-dark",
  danger: "bg-danger/15 text-danger-dark",
  warning: "bg-warning/15 text-amber-700",
  neutral: "bg-slate-100 text-slate-600",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
