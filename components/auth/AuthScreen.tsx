"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, User, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { suggestUsername } from "@/lib/api";
import { slugifyUsername, cn } from "@/lib/utils";

type Mode = "student" | "tutor-login" | "tutor-register";

const inputClass =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-ink transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}

export function AuthScreen() {
  const { login, registerTutor } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("student");
  const [busy, setBusy] = useState(false);

  // campos partilhados
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  // registo de tutor
  const [displayName, setDisplayName] = useState("");

  // username sugerido a partir do nome (registo de tutor)
  useEffect(() => {
    if (mode !== "tutor-register" || !displayName.trim()) return;
    let active = true;
    const t = setTimeout(() => {
      suggestUsername(displayName)
        .then((r) => {
          if (active) setUsername(r.username);
        })
        .catch(() => active && setUsername(slugifyUsername(displayName)));
    }, 400);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [displayName, mode]);

  function switchMode(next: Mode) {
    setMode(next);
    setUsername("");
    setSecret("");
    setDisplayName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "tutor-register") {
        await registerTutor({
          displayName: displayName.trim(),
          username: slugifyUsername(username || displayName),
          password: secret,
        });
        toast("Conta criada. Bem-vindo!", "success");
      } else {
        await login(username, secret);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível entrar.", "error");
    } finally {
      setBusy(false);
    }
  }

  const isStudent = mode === "student";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={48} withText={false} />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">
            Edu<span className="text-primary">Kit</span>
          </h1>
          <p className="text-slate-500">Entra para veres os teus treinos.</p>
        </div>

        {/* Alternador Aluno / Tutor */}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
          <button
            onClick={() => switchMode("student")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 font-display font-bold transition",
              isStudent ? "bg-white text-primary-dark shadow-soft" : "text-slate-500"
            )}
          >
            <User size={18} /> Aluno
          </button>
          <button
            onClick={() => switchMode("tutor-login")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 font-display font-bold transition",
              !isStudent
                ? "bg-white text-secondary-dark shadow-soft"
                : "text-slate-500"
            )}
          >
            <GraduationCap size={18} /> Tutor
          </button>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "tutor-register" && (
              <Labeled label="O teu nome">
                <input
                  className={inputClass}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ex.: Ana Sousa"
                  autoComplete="name"
                />
              </Labeled>
            )}

            <Labeled label={isStudent ? "O teu utilizador" : "Utilizador"}>
              <input
                className={inputClass}
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))
                }
                placeholder={isStudent ? "ex.: maria3" : "ex.: anasousa"}
                autoComplete="username"
                autoCapitalize="off"
              />
              {mode === "tutor-register" && username && (
                <span className="mt-1 block text-sm text-slate-400">
                  Vais entrar com o utilizador <b>{username}</b>.
                </span>
              )}
            </Labeled>

            <Labeled label={isStudent ? "PIN" : "Palavra-passe"}>
              <input
                type="password"
                inputMode={isStudent ? "numeric" : "text"}
                className={inputClass}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={isStudent ? "••••" : "••••••"}
                autoComplete={mode === "tutor-register" ? "new-password" : "current-password"}
              />
            </Labeled>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={busy}
              icon={mode === "tutor-register" ? <UserPlus size={20} /> : <LogIn size={20} />}
            >
              {mode === "tutor-register" ? "Criar conta de tutor" : "Entrar"}
            </Button>
          </form>

          {/* Alternar entrar / criar conta (só tutor) */}
          {mode === "tutor-login" && (
            <button
              onClick={() => switchMode("tutor-register")}
              className="mt-4 w-full text-center text-sm font-semibold text-secondary-dark hover:underline"
            >
              Ainda não tens conta? Criar conta de tutor
            </button>
          )}
          {mode === "tutor-register" && (
            <button
              onClick={() => switchMode("tutor-login")}
              className="mt-4 flex w-full items-center justify-center gap-1 text-center text-sm font-semibold text-slate-500 hover:underline"
            >
              <ArrowLeft size={14} /> Já tenho conta
            </button>
          )}
        </Card>

        {isStudent && (
          <p className="mt-4 text-center text-sm text-slate-400">
            O teu utilizador e PIN são-te dados pelo teu tutor.
          </p>
        )}
      </motion.div>
    </div>
  );
}
