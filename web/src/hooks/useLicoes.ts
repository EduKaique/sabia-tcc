import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  buscarLicao,
  concluirAtividadeLicao,
  listarLicoes,
  marcarVideoVisto,
  salvarEstadoLicao,
} from '@/services/licoes'

const QUERY_KEY = ['licoes']

export function useLicoes() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listarLicoes })
}

export function useLicao(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => buscarLicao(id),
    // 404 (inexistente ou inativa) não melhora com nova tentativa.
    retry: (falhas, erro) => !(isAxiosError(erro) && erro.response?.status === 404) && falhas < 3,
  })
}

/**
 * Escritas de uma lição. Compartilham o mesmo `scope`, então o TanStack Query as executa em fila:
 * duas escritas simultâneas antes de existir progresso fariam o backend responder 500.
 */
export function useMutacoesLicao(id: number) {
  const queryClient = useQueryClient()
  const scope = { id: `licao-${id}` }
  const invalidar = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const videoVisto = useMutation({ scope, mutationFn: () => marcarVideoVisto(id), onSuccess: invalidar })
  // Autosave não invalida: o progresso não muda e o refetch seria só tráfego.
  const salvarEstado = useMutation({
    scope,
    mutationFn: (estadoJson: string) => salvarEstadoLicao(id, estadoJson),
  })
  const concluirAtividade = useMutation({
    scope,
    mutationFn: (estadoJson: string) => concluirAtividadeLicao(id, estadoJson),
    onSuccess: invalidar,
  })

  return { videoVisto, salvarEstado, concluirAtividade }
}
