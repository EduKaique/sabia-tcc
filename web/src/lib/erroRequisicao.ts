import type { ErroApi } from '@/types'

/**
 * Erro de chamada HTTP com o status e os `campos` do corpo de erro dos serviços
 * ({status, erro, timestamp, campos?}). `status` 0 = falha de rede (sem resposta).
 */
export class ErroRequisicao extends Error {
  readonly status: number
  readonly campos?: Record<string, string>

  constructor(status: number, mensagem: string, campos?: Record<string, string>) {
    super(mensagem)
    this.name = 'ErroRequisicao'
    this.status = status
    this.campos = campos
  }
}

export async function erroDaResposta(res: Response): Promise<ErroRequisicao> {
  const corpo: Partial<ErroApi> = await res.json().catch(() => ({}))
  return new ErroRequisicao(res.status, corpo.erro ?? 'SERVER_ERROR', corpo.campos)
}

export function erroDeRede(): ErroRequisicao {
  return new ErroRequisicao(0, 'NETWORK_ERROR')
}
