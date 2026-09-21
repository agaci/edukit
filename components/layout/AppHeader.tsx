"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  GraduationCap,
  User,
  BookOpenText,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/components/auth/AuthProvider";

const linkClass =
  "flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // O administrador é também tutor: o botão alterna entre as duas áreas em vez
  // de apontar sempre para a mesma.
  const inAdminArea = pathname?.startsWith("/admin") ?? false;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="EduKit — início" className="shrink-0">
          <Logo size={32} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/manual" className={linkClass}>
            <BookOpenText size={18} />
            <span className="hidden sm:inline">Manual</span>
          </Link>

          {user?.role === "admin" &&
            (inAdminArea ? (
              <Link href="/" className={linkClass}>
                <GraduationCap size={18} />
                <span className="hidden sm:inline">Painel do tutor</span>
              </Link>
            ) : (
              <Link href="/admin" className={linkClass}>
                <ShieldCheck size={18} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            ))}

          {user && (
            <>
              <span className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-1.5 text-sm font-bold text-ink">
                {user.role === "admin" ? (
                  <ShieldCheck size={16} className="text-secondary" />
                ) : user.role === "tutor" ? (
                  <GraduationCap size={16} className="text-secondary" />
                ) : (
                  <User size={16} className="text-primary-dark" />
                )}
                <span className="max-w-[140px] truncate">{user.displayName}</span>
              </span>
              <button
                onClick={() => logout()}
                aria-label="Sair"
                className="flex items-center justify-center gap-1.5 rounded-2xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-danger focus:outline-none focus-visible:ring-4 focus-visible:ring-danger/20"
              >
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
