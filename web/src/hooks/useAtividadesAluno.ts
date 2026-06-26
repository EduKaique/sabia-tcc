import { useQuery } from '@tanstack/react-query'
import { listarAtividadesAluno, buscarAtividadeAluno } from '@/services/atividadesAlunoService'

const QUERY_KEY = ['atividades-aluno']

export function useAtividadesAluno() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listarAtividadesAluno })
}

export function useAtividadeAluno(id: number) {
  return useQuery({ queryKey: [...QUERY_KEY, id], queryFn: () => buscarAtividadeAluno(id) })
}
