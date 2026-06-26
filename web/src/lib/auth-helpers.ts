import Cookies from "js-cookie";
import type { LoginResponse } from "@/services/auth";

export function salvarToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
  Cookies.set("sabia_token", token, {
    expires: 1,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
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
