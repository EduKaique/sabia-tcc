"use client";

import { useSyncExternalStore, useMemo } from "react";

interface AuthUser {
  id: string;
  nome: string;
  role: "PROFESSOR" | "ALUNO" | "ADMINISTRADOR";
  /** Troca de senha pendente: o backend recusa tudo (403 SENHA_TEMPORARIA) até a troca. */
  mustChangePassword: boolean;
}

/** Payload do JWT é base64url e o JSON é UTF-8 (nomes com acento): `atob` puro não basta. */
function decodificarPayload(token: string) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const comPadding = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const bytes = Uint8Array.from(atob(comPadding), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
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
      const payload = decodificarPayload(token);
      return {
        id: payload.sub,
        nome: payload.nome,
        role: payload.role,
        mustChangePassword: payload.mustChangePassword === true,
      };
    } catch {
      return null;
    }
  }, [token]);

  return { user, token };
}
