import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { aplicarCorrecao, aplicarPulso, aplicarVista } from '@/lib/licoes/aluno'
import {
  buscarLicao,
  concluirAtividadeLicao,
  enviarPulsoVideo,
  enviarQuestionario,
  listarLicoes,
  marcarPaginaVista,
  salvarEstadoLicao,
} from '@/services/licoes'
import type { LicaoDetalhe } from '@/types/licao'

const QUERY_KEY = ['licoes']

export function useLicoes() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listarLicoes })
}

export function useLicao(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => buscarLicao(id),
    // 404 (inexistente ou invisível) não melhora com nova tentativa.
    retry: (falhas, erro) => !(isAxiosError(erro) && erro.response?.status === 404) && falhas < 3,
  })
}

/**
 * Escritas de uma lição. Compartilham o mesmo `scope`, então o TanStack Query as executa em fila: duas escritas
 * simultâneas antes de existir progresso fariam o backend responder 500.
 * Vista e questionário atualizam o detalhe com a resposta e invalidam só a LISTA (o progresso do card).
 */
export function useMutacoesLicao(id: number) {
  const queryClient = useQueryClient()
  const scope = { id: `licao-${id}` }
  const chaveDetalhe = [...QUERY_KEY, id]
  const atualizarDetalhe = (f: (d: LicaoDetalhe) => LicaoDetalhe) =>
    queryClient.setQueryData<LicaoDetalhe>(chaveDetalhe, (d) => (d ? f(d) : d))
  const invalidarLista = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: true })
  const invalidarTudo = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const marcarVista = useMutation({
    scope,
    mutationFn: (paginaId: number) => marcarPaginaVista(id, paginaId),
    onSuccess: (r) => {
      atualizarDetalhe((d) => aplicarVista(d, r))
      invalidarLista()
    },
  })
  const responderQuestionario = useMutation({
    scope,
    mutationFn: ({ paginaId, respostas }: { paginaId: number; respostas: number[] }) =>
      enviarQuestionario(id, paginaId, respostas),
    onSuccess: (r) => {
      atualizarDetalhe((d) => aplicarCorrecao(d, r))
      invalidarLista()
    },
  })
  // Autosave não invalida: o progresso não muda e o refetch seria só tráfego.
  const salvarEstado = useMutation({
    scope,
    mutationFn: (estadoJson: string) => salvarEstadoLicao(id, estadoJson),
  })
  const concluirAtividade = useMutation({
    scope,
    mutationFn: (estadoJson: string) => concluirAtividadeLicao(id, estadoJson),
    onSuccess: invalidarTudo,
  })

  return { marcarVista, responderQuestionario, salvarEstado, concluirAtividade }
}

/**
 * Função que envia um pulso do vídeo e aplica a resposta ao cache do detalhe, sem refetch e sem invalidar a lista.
 * Fica fora do `scope` das mutações: a agenda de pulsos já garante um por vez.
 */
export function useEnviarPulso(id: number) {
  const queryClient = useQueryClient()
  return useCallback(
    async (paginaId: number) => {
      const r = await enviarPulsoVideo(id, paginaId)
      queryClient.setQueryData<LicaoDetalhe>([...QUERY_KEY, id], (d) => (d ? aplicarPulso(d, r) : d))
      return r
    },
    [id, queryClient]
  )
}
