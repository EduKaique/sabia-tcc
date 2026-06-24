import { useQuery } from '@tanstack/react-query'
import { listarTurmas } from '@/service/turmas'

export function useTurmas() {
  return useQuery({ queryKey: ['turmas'], queryFn: listarTurmas })
}
