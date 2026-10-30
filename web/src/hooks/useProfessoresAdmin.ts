import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  alterarStatusProfessor,
  criarProfessor,
  listarProfessores,
  type CriarProfessorPayload,
} from '@/services/admin'

const QUERY_KEY = ['admin', 'professores']

export function useProfessoresAdmin(ativo?: boolean) {
  return useQuery({ queryKey: [...QUERY_KEY, ativo], queryFn: () => listarProfessores(ativo) })
}

export function useCriarProfessor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarProfessorPayload) => criarProfessor(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useAlterarStatusProfessor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alterarStatusProfessor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function mensagemErroAdmin(error: unknown) {
  const message = (error as { response?: { data?: { erro?: string } } })?.response?.data?.erro
  return message ?? 'Não foi possível concluir a operação. Tente novamente.'
}
