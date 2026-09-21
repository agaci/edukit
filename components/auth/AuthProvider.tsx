"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/types";
import * as api from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, secret: string) => Promise<void>;
  registerTutor: (input: {
    displayName: string;
    username: string;
    password: string;
  }) => Promise<{ pending: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.fetchMe();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, secret: string) => {
    const { user } = await api.login(username, secret);
    setUser(user);
  }, []);

  const registerTutor = useCallback(
    async (input: { displayName: string; username: string; password: string }) => {
      const res = await api.registerTutor(input);
      // Em modo "approval" a conta nasce pendente: não há sessão para guardar.
      if (res.user) setUser(res.user);
      return { pending: !res.user, message: res.message };
    },
    []
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, registerTutor, logout, refresh }),
    [user, loading, login, registerTutor, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return ctx;
}
