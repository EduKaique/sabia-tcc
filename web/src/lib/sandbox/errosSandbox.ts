import type { ErroApi } from '@/types'

export const CODIGO_LIMITE_PROJETOS = 'SANDBOX_LIMITE_PROJETOS'
export const CODIGO_PROJETO_GRANDE = 'SANDBOX_PROJETO_GRANDE'

export const MSG_LIMITE_PROJETOS = 'Você atingiu o limite de 10 projetos. Exclua um para criar outro.'
export const MSG_MUITAS_TENTATIVAS = 'Muitas tentativas. Aguarde alguns minutos.'
const MSG_PADRAO = 'Não foi possível concluir a operação. Tente novamente.'

export interface ErroSandbox {
  status: number | null
  codigo?: string
  mensagem: string
}

/** Lê o ErroResponse do servidor (com o `codigo` opcional) a partir de um erro do axios. */
export function extrairErroSandbox(err: unknown): ErroSandbox {
  const resposta = (err as { response?: { status?: number; data?: Partial<ErroApi> & { codigo?: string } } })
    ?.response
  if (!resposta) return { status: null, mensagem: 'Sem conexão com o servidor. Tente novamente.' }
  const status = resposta.status ?? null
  const data = resposta.data ?? {}
  if (status === 429) return { status, mensagem: MSG_MUITAS_TENTATIVAS }
  if (data.codigo === CODIGO_LIMITE_PROJETOS) return { status, codigo: data.codigo, mensagem: MSG_LIMITE_PROJETOS }
  if (status === 404) return { status, codigo: data.codigo, mensagem: data.erro ?? 'Projeto não encontrado.' }
  const campos = data.campos ? Object.values(data.campos) : []
  return { status, codigo: data.codigo, mensagem: campos[0] ?? data.erro ?? MSG_PADRAO }
}
