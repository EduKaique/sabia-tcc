import api from '@/lib/pedagogicoApi'
import type {
  CorrigirSubmissaoPayload,
  PageResponse,
  SubmissaoAvaliativa,
  SubmissaoItem,
  SubmissaoProfessorDetalhe,
} from '@/types'

export async function listarSubmissoes(
  atividadeId: string,
  page = 0,
): Promise<PageResponse<SubmissaoItem>> {
  const { data } = await api.get<PageResponse<SubmissaoItem>>(
    `/api/professor/atividades/${atividadeId}/submissoes`,
    { params: { page } },
  )
  return data
}

export async function buscarSubmissaoProfessor(id: string): Promise<SubmissaoProfessorDetalhe> {
  const { data } = await api.get<SubmissaoProfessorDetalhe>(`/api/professor/submissoes/${id}`)
  return data
}

export async function corrigirSubmissao(
  id: string,
  payload: CorrigirSubmissaoPayload,
): Promise<SubmissaoAvaliativa> {
  const { data } = await api.post<SubmissaoAvaliativa>(
    `/api/professor/submissoes/${id}/corrigir`,
    payload,
  )
  return data
}
