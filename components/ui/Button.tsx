"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark shadow-soft focus-visible:ring-primary",
  secondary:
    "bg-secondary text-white hover:bg-secondary-dark shadow-soft focus-visible:ring-secondary",
  danger:
    "bg-danger text-white hover:bg-danger-dark shadow-soft focus-visible:ring-danger",
  outline:
    "bg-white text-ink border-2 border-slate-200 hover:border-primary hover:text-primary-dark focus-visible:ring-primary",
  ghost:
    "bg-transparent text-ink hover:bg-slate-100 focus-visible:ring-slate-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-2 gap-1.5 min-h-[40px]",
  md: "text-base px-5 py-2.5 gap-2 min-h-[44px]",
  lg: "text-lg px-6 py-3 gap-2.5 min-h-[52px]",
  xl: "text-xl px-8 py-4 gap-3 min-h-[60px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-display font-bold transition-all duration-150 active:scale-[0.97]",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...rest}
      >
        {loading ? (
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
