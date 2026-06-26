import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden>
        <circle cx="80" cy="80" r="70" fill="#84CC16" opacity="0.1" />
        {/* Lápis perdido */}
        <g transform="rotate(-20 80 80)">
          <rect x="70" y="38" width="20" height="74" rx="5" fill="#FBBF24" />
          <rect x="70" y="38" width="20" height="12" rx="5" fill="#F87171" />
          <path d="M70 112h20l-10 18-10-18Z" fill="#1E293B" />
          <path d="M75 124h10l-5 6-5-6Z" fill="#475569" />
        </g>
        {/* Olhos tristes */}
        <circle cx="74" cy="68" r="2.5" fill="#1E293B" />
        <circle cx="86" cy="68" r="2.5" fill="#1E293B" />
        <path
          d="M73 80c4-3 10-3 14 0"
          stroke="#1E293B"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <h1 className="mt-6 font-display text-4xl font-extrabold text-ink">
        Oops! Página perdida
      </h1>
      <p className="mt-2 max-w-sm text-slate-500">
        Parece que este lápis se perdeu. Vamos voltar ao início e continuar a
        aprender!
      </p>
      <Link href="/" className="mt-6">
        <Button size="lg" icon={<Home size={20} />}>
          Voltar ao início
        </Button>
      </Link>
    </div>
  );
}
