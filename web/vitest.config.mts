import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const raiz = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(raiz, "src") },
  },
  test: {
    // Funções puras rodam em node; testes de componente pedem jsdom no próprio arquivo.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
