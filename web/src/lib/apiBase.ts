// URLs base da API, embutidas no build (NEXT_PUBLIC_*).
// String vazia é válida: chamadas relativas à origem da página (prod atrás do proxy,
// onde /api/* vai para o api-gateway). Por isso ?? e não ||.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const PEDAGOGICO_API_URL =
  process.env.NEXT_PUBLIC_PEDAGOGICO_API_URL ?? `${API_URL}/api/pedagogico`;
