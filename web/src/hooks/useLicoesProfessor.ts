import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  arquivarLicao,
  buscarLicaoProfessor,
  buscarProgressoLicao,
  criarLicao,
  despublicarLicao,
  listarLicoesProfessor,
  publicarLicao,
  salvarLicao,
  vincularTurmasLicao,
} from '@/services/licoesProfessor'
import { ErroTurmasLicao } from '@/lib/licoes/erroTurmasLicao'
import type { LicaoProfessorDetalhe, SalvarLicaoPayload } from '@/types/licaoProfessor'

/** Chave própria: ['licoes'] é a das lições do aluno (hooks/useLicoes.ts). */
const QUERY_KEY = ['licoes-professor']
const CHAVE_PROGRESSO = 'licoes-progresso'

const statusDe = (err: unknown) => (err as { response?: { status?: number } })?.response?.status

export function useLicoesProfessor(turmaId?: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'lista', turmaId ?? null],
    queryFn: () => listarLicoesProfessor(turmaId),
  })
}

export function useLicaoProfessor(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detalhe', id],
    queryFn: () => buscarLicaoProfessor(id),
    enabled: Number.isFinite(id),
    // 403 (de outro professor) e 404 não melhoram tentando de novo.
    retry: (falhas, err) => statusDe(err) !== 403 && statusDe(err) !== 404 && falhas < 2,
    // O editor carrega o detalhe uma vez; não recarregar ao voltar o foco para não sobrescrever a edição.
    refetchOnWindowFocus: false,
  })
}

/** Relatório da página "Ver lição". Recarrega ao voltar o foco: o progresso muda enquanto se olha. */
export function useProgressoLicao(id: number) {
  return useQuery({
    queryKey: [CHAVE_PROGRESSO, id],
    queryFn: () => buscarProgressoLicao(id),
    enabled: Number.isFinite(id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: (falhas, err) => statusDe(err) !== 403 && statusDe(err) !== 404 && falhas < 1,
  })
}

function useAtualizarCache() {
  const queryClient = useQueryClient()
  return (detalhe?: LicaoProfessorDetalhe) => {
    if (detalhe) queryClient.setQueryData([...QUERY_KEY, 'detalhe', detalhe.id], detalhe)
    // O relatório mostra o estado da lição (publicada, rascunho).
    if (detalhe) queryClient.invalidateQueries({ queryKey: [CHAVE_PROGRESSO, detalhe.id] })
    return queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'lista'] })
  }
}

export function useCriarLicao() {
  const atualizar = useAtualizarCache()
  return useMutation({ mutationFn: criarLicao, onSuccess: (d) => atualizar(d) })
}

/** Salva a lição completa e, em seguida, as turmas (nessa ordem). Devolve o detalhe final do servidor. */
export function useSalvarLicao() {
  const atualizar = useAtualizarCache()
  return useMutation({
    mutationFn: async ({ id, payload, turmaIds }: { id: number; payload: SalvarLicaoPayload; turmaIds: number[] }) => {
      const salva = await salvarLicao(id, payload)
      try {
        return await vincularTurmasLicao(id, turmaIds)
      } catch (err) {
        throw new ErroTurmasLicao(salva, err)
      }
    },
    onSuccess: (d) => atualizar(d),
    onError: (err) => {
      if (err instanceof ErroTurmasLicao) atualizar(err.licaoSalva)
    },
  })
}

export function usePublicarLicao() {
  const atualizar = useAtualizarCache()
  return useMutation({ mutationFn: publicarLicao, onSuccess: (d) => atualizar(d) })
}

export function useDespublicarLicao() {
  const atualizar = useAtualizarCache()
  return useMutation({ mutationFn: despublicarLicao, onSuccess: (d) => atualizar(d) })
}

export function useArquivarLicao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: arquivarLicao,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [CHAVE_PROGRESSO, id] })
      return queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
