import { API_URL } from '@/lib/apiBase'
import { ErroRequisicao, erroDaResposta, erroDeRede } from '@/lib/erroRequisicao'

const BASE = API_URL

export const MENSAGEM_CODIGO_INVALIDO = 'Código de turma inválido. Verifique com seu professor.'
export const FORMATO_CODIGO = /^[A-Z0-9]{6}$/

export interface ConviteValido {
  codigo: string
  turmaNome: string
}

/** Mesma normalização do servidor: sem espaços e em maiúsculas. */
export function normalizarCodigo(codigo: string): string {
  return codigo.replace(/\s+/g, '').toUpperCase()
}

/** GET /api/publico/convites/{codigo} (público). 404 também para formato inválido. */
export async function validarConvite(codigoBruto: string): Promise<ConviteValido> {
  const codigo = normalizarCodigo(codigoBruto)
  if (!FORMATO_CODIGO.test(codigo)) {
    throw new ErroRequisicao(404, MENSAGEM_CODIGO_INVALIDO)
  }

  let res: Response
  try {
    res = await fetch(`${BASE}/api/publico/convites/${encodeURIComponent(codigo)}`, {
      cache: 'no-store',
    })
  } catch {
    throw erroDeRede()
  }

  if (!res.ok) {
    throw await erroDaResposta(res)
  }
  return res.json()
}
