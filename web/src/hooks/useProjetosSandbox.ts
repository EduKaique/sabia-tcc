import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  atualizarProjetoSandbox,
  buscarProjetoSandbox,
  copiarAtividadeParaSandbox,
  criarProjetoSandbox,
  excluirProjetoSandbox,
  listarProjetosSandbox,
} from '@/services/projetosSandbox'
import type {
  AtualizarProjetoSandboxPayload,
  CriarProjetoSandboxPayload,
  ProjetoSandboxDetalhe,
} from '@/types/projetoSandbox'

const QUERY_KEY = ['projetos-sandbox']

export function useProjetosSandbox() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listarProjetosSandbox })
}

export function useProjetoSandbox(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => buscarProjetoSandbox(id),
    // O editor captura o estado uma vez; refetch em foco só geraria tráfego.
    refetchOnWindowFocus: false,
    // 404 (inexistente ou de outro aluno) não melhora com nova tentativa.
    retry: (falhas, erro) => !(isAxiosError(erro) && erro.response?.status === 404) && falhas < 3,
  })
}

export function useCriarProjetoSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarProjetoSandboxPayload) => criarProjetoSandbox(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: true }),
  })
}

export function useCopiarAtividadeParaSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (atividadeId: number) => copiarAtividadeParaSandbox(atividadeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: true }),
  })
}

export function useExcluirProjetoSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => excluirProjetoSandbox(id),
    onSuccess: (_r, id) => {
      queryClient.removeQueries({ queryKey: [...QUERY_KEY, id] })
      return queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: true })
    },
  })
}

/**
 * Atualização (nome e/ou estado) de um projeto. As escritas do mesmo projeto compartilham o `scope`, então o
 * TanStack Query as executa em fila. Atualiza o cache do detalhe e invalida só a lista (ordem e data da galeria).
 */
export function useAtualizarProjetoSandbox(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    scope: { id: `projeto-sandbox-${id}` },
    mutationFn: (payload: AtualizarProjetoSandboxPayload) => atualizarProjetoSandbox(id, payload),
    onSuccess: (projeto) => {
      queryClient.setQueryData<ProjetoSandboxDetalhe>([...QUERY_KEY, id], projeto)
      return queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: true })
    },
  })
}
