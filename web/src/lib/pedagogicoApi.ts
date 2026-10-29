import axios from "axios";
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

export default pedagogicoApi;
