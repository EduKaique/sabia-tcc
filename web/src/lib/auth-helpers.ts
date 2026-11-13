import Cookies from "js-cookie";
import type { AxiosInstance } from "axios";
import type { LoginResponse } from "@/services/auth";

export const ROTA_TROCAR_SENHA = "/trocar-senha";

export function salvarToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
  Cookies.set("sabia_token", token, {
    expires: 1,
    sameSite: "strict",
    // Pelo protocolo real: acessado por HTTP (antes do certificado), um cookie secure
    // não seria gravado e o login entraria em loop.
    secure: typeof window !== "undefined" && window.location.protocol === "https:",
  });
}

export function encerrarSessao() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
  Cookies.remove("sabia_token");
}

export function redirecionarPorPerfil(
  data: LoginResponse,
  router: { push: (path: string) => void }
) {
  if (data.mustChangePassword) {
    router.push(ROTA_TROCAR_SENHA);
    return;
  }
  switch (data.role) {
    case "PROFESSOR":
      router.push("/professor/atividades");
      break;
    case "ALUNO":
      router.push("/aluno/atividades");
      break;
    case "ADMINISTRADOR":
      router.push("/admin/professores");
      break;
  }
}

/** 403 com `codigo: "SENHA_TEMPORARIA"`: o backend exige a troca de senha antes de qualquer ação. */
export function ehErroSenhaTemporaria(err: unknown): boolean {
  const resposta = (err as { response?: { status?: number; data?: { codigo?: string } } })?.response;
  return resposta?.status === 403 && resposta.data?.codigo === "SENHA_TEMPORARIA";
}

/** Leva para a troca de senha quando qualquer chamada da instância recebe 403 SENHA_TEMPORARIA. */
export function registrarRedirecionamentoSenhaTemporaria(instancia: AxiosInstance) {
  instancia.interceptors.response.use(undefined, (err) => {
    if (
      ehErroSenhaTemporaria(err) &&
      typeof window !== "undefined" &&
      window.location.pathname !== ROTA_TROCAR_SENHA
    ) {
      window.location.href = ROTA_TROCAR_SENHA;
    }
    return Promise.reject(err);
  });
}
