import api from '@/lib/api'
import type { PageResponse, SubmissaoItem } from '@/types'

export async function listarSubmissoes(
  atividadeId: string,
  page = 0,
): Promise<PageResponse<SubmissaoItem>> {
  const { data } = await api.get<PageResponse<SubmissaoItem>>(
    `/api/professor/atividade/${atividadeId}/submissoes`,
    { params: { page } },
  )
  return data
}
