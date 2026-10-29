import Cookies from "js-cookie";
import type { LoginResponse } from "@/services/auth";

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
  switch (data.perfil) {
    case "PROFESSOR":
      router.push("/professor/atividades");
      break;
    case "ALUNO":
      router.push("/aluno/atividades");
      break;
    case "ADMINISTRADOR":
      router.push("/admin/dashboard");
      break;
  }
}
