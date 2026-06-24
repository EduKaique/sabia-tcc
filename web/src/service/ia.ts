import api from '@/lib/api'
import type { TipoAtividade } from '@/types'

export interface GerarAtividadeIaPayload {
  idTurma: number
  tipoAtividade: TipoAtividade
  descricaoObjetivo: string
}

export interface SugestaoAtividadeIa {
  titulo: string
  descricao: string
}

export async function gerarAtividadeComIa(
  payload: GerarAtividadeIaPayload,
): Promise<SugestaoAtividadeIa> {
  const { data } = await api.post<SugestaoAtividadeIa>('/api/ia/gerar-atividade', payload)
  return data
}
