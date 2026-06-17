import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listarAtividades,
  buscarAtividade,
  criarAtividade,
  atualizarAtividade,
  publicarAtividade,
  despublicarAtividade,
  deletarAtividade,
  type CriarAtividadePayload,
} from '@/service/atividades'

const QUERY_KEY = ['atividades']

export function useAtividades() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listarAtividades })
}

export function useAtividade(id: string) {
  return useQuery({ queryKey: [...QUERY_KEY, id], queryFn: () => buscarAtividade(id) })
}

export function useCriarAtividade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criarAtividade,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useAtualizarAtividade(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<CriarAtividadePayload>) => atualizarAtividade(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function usePublicarAtividade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: publicarAtividade,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDespublicarAtividade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: despublicarAtividade,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeletarAtividade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletarAtividade,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
