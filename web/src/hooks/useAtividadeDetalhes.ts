import { useQuery } from '@tanstack/react-query'
import { buscarAtividadeDetalhes } from '@/service/atividades'

export function useAtividadeDetalhes(id: string) {
  return useQuery({
    queryKey: ['atividade-detalhes', id],
    queryFn: () => buscarAtividadeDetalhes(id),
    enabled: !!id,
  })
}
