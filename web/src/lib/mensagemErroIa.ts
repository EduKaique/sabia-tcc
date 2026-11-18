/** Mensagem mostrada quando o ia-service responde 503 com codigo COTA_IA_ESGOTADA. */
export const MENSAGEM_COTA_IA =
  'O limite diário gratuito da IA acabou por agora. Você pode continuar preenchendo manualmente ou tentar novamente mais tarde.'

/** Corpo de erro do ia-service (FastAPI): { detail: { codigo, mensagem } } ou { detail: string }. */
interface RespostaErroIa {
  status?: number
  data?: { detail?: { codigo?: unknown } | string }
}

/** true quando o erro (axios) é a cota da IA esgotada: 503 com codigo COTA_IA_ESGOTADA. */
export function ehCotaIaEsgotada(err: unknown): boolean {
  const resposta = (err as { response?: RespostaErroIa } | null | undefined)?.response
  const detail = resposta?.data?.detail
  return (
    resposta?.status === 503 &&
    typeof detail === 'object' &&
    detail !== null &&
    detail.codigo === 'COTA_IA_ESGOTADA'
  )
}

/** Texto do erro de uma chamada à IA: a mensagem de cota, ou a mensagem padrão de quem chamou. */
export function mensagemErroIa(err: unknown, mensagemPadrao: string): string {
  return ehCotaIaEsgotada(err) ? MENSAGEM_COTA_IA : mensagemPadrao
}
