import { cn } from "@/lib/utils";

/** Logótipo EduKit: livro + lápis em SVG inline, verde-lima. */
export function Logo({
  size = 36,
  withText = true,
  className,
}: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        {/* Livro */}
        <path
          d="M7 11c5-2.5 10-2.5 15 0v27c-5-2.5-10-2.5-15 0V11Z"
          fill="#84CC16"
        />
        <path
          d="M41 11c-5-2.5-10-2.5-15 0v27c5-2.5 10-2.5 15 0V11Z"
          fill="#65A30D"
        />
        <path
          d="M24 11v27"
          stroke="#F8FAFC"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Lápis */}
        <g transform="rotate(38 33 24)">
          <rect x="30.5" y="8" width="5" height="24" rx="1.4" fill="#FBBF24" />
          <path d="M30.5 32h5l-2.5 5-2.5-5Z" fill="#1E293B" />
          <rect x="30.5" y="8" width="5" height="3.4" rx="1.4" fill="#F87171" />
        </g>
      </svg>
      {withText && (
        <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Edu<span className="text-primary">Kit</span>
        </span>
      )}
    </span>
  );
}
