"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/auth";
import { salvarToken, redirecionarPorPerfil } from "@/lib/auth-helpers";

export function useLogin(router: { push: (path: string) => void }) {
  const [erroAutenticacao, setErroAutenticacao] = useState<
    "INVALID_CREDENTIALS" | "ACCOUNT_INACTIVE" | null
  >(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      salvarToken(data.token);
      redirecionarPorPerfil(data, router);
    },
    onError: (error: Error) => {
      if (
        error.message === "INVALID_CREDENTIALS" ||
        error.message === "ACCOUNT_INACTIVE"
      ) {
        setErroAutenticacao(error.message);
      }
    },
  });

  return { ...mutation, erroAutenticacao, setErroAutenticacao };
}
