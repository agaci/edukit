"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PencilLine, BookOpen, Calculator, Settings } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/ditado", label: "Ditado", icon: PencilLine },
  { href: "/compreensao", label: "Compreensão", icon: BookOpen },
  { href: "/matematica", label: "Matemática", icon: Calculator },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="EduKit — início" className="shrink-0">
          <Logo size={32} />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-bold transition sm:px-4",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                  active
                    ? "bg-primary/15 text-primary-dark"
                    : "text-slate-500 hover:bg-slate-100 hover:text-ink"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <Link
            href="/settings"
            aria-label="Definições"
            className={cn(
              "flex items-center justify-center rounded-2xl p-2.5 transition",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/30",
              pathname === "/settings"
                ? "bg-secondary/15 text-secondary-dark"
                : "text-slate-400 hover:bg-slate-100 hover:text-ink"
            )}
          >
            <Settings size={20} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
