import { useQuery } from '@tanstack/react-query'
import { buscarRelatorioProfessor } from '@/services/submissoes'
import type { RelatorioRequest } from '@/types'

export function useRelatorioProfessor(request: RelatorioRequest, enabled = true) {
  return useQuery({
    queryKey: ['relatorio-professor', request],
    queryFn: () => buscarRelatorioProfessor(request),
    enabled,
  })
}
