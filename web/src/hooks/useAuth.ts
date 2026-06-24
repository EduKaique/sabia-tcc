"use client";

import { useSyncExternalStore, useMemo } from "react";

interface AuthUser {
  id: string;
  nome: string;
  perfil: "PROFESSOR" | "ALUNO";
}

const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
};

const getSnapshot = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

const getServerSnapshot = () => null;

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const user = useMemo<AuthUser | null>(() => {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return { id: payload.sub, nome: payload.nome, perfil: payload.perfil };
    } catch {
      return null;
    }
  }, [token]);

  return { user, token };
}
