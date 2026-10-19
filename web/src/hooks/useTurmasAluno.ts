import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { entrarNaTurma, listarTurmasAluno } from '@/services/turmasAluno'

const QUERY_KEY = ['turmas-aluno']

export function useTurmasAluno() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listarTurmasAluno })
}

export function useEntrarNaTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: entrarNaTurma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['atividades-aluno'] })
    },
  })
}
