import axios from "axios";

const pedagogicoApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PEDAGOGICO_API_URL ?? "http://localhost:8081",
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
