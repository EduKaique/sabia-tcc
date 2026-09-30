import api from '@/lib/api'
import type { RelatorioIa, TipoAtividade } from '@/types'

export interface GerarAtividadeIaPayload {
  idTurma: number
  tipoAtividade: TipoAtividade
  descricaoObjetivo: string
}

export interface GerarAtividadeIaRequest {
  titulo: string
  descricao: string
  gabaritoEstadoJson?: string
}

export interface RevisarSubmissaoIaPayload {
  atividade: {
    titulo: string
    descricao: string | null
    pontuacaoMaxima: number
    gabaritoEstadoJson: string | null
  },
  submissaoEstadoJson: string,
}

export type RevisarSubmissaoIaResponse = RelatorioIa


export async function gerarAtividadeComIa(
  payload: GerarAtividadeIaPayload,
): Promise<GerarAtividadeIaRequest> {
  const { data } = await api.post<GerarAtividadeIaRequest>('/api/ia/atividade/gerar', payload)
  return data
}

export async function revisarSubmissaoComIa(
  payload: RevisarSubmissaoIaPayload,
): Promise<RevisarSubmissaoIaResponse> {
  const { data } = await api.post<RevisarSubmissaoIaResponse>(
    '/api/ia/submissao/revisar',
    payload,
  )
  return data
}
