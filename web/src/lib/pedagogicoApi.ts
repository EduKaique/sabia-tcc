import axios from "axios";
import { registrarRedirecionamentoSenhaTemporaria } from "@/lib/auth-helpers";
import { PEDAGOGICO_API_URL } from "@/lib/apiBase";

const pedagogicoApi = axios.create({
  baseURL: PEDAGOGICO_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

pedagogicoApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

registrarRedirecionamentoSenhaTemporaria(pedagogicoApi);

export default pedagogicoApi;
