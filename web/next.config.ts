import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // turbopack é estável e padrão no Next.js 16 — configurações aqui se necessário
  // turbopack: {},
};

export default nextConfig;
