import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removerRelatorioIa, salvarRelatorioIa } from '@/services/submissoes'
import type { RelatorioIa } from '@/types'

export function useSalvarRelatorioIa(submissaoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (relatorio: RelatorioIa) => salvarRelatorioIa(submissaoId, relatorio),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissao-professor'] }),
  })
}

export function useRemoverRelatorioIa(submissaoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => removerRelatorioIa(submissaoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissao-professor'] }),
  })
}
