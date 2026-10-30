import { useQuery } from '@tanstack/react-query'
import {
  buscarDistribuicaoNotas,
  buscarMediasAtividades,
  buscarProgressaoAlunos,
  buscarStatusEntregas,
} from '@/services/relatoriosTurma'
import type { FiltroPeriodoTurma } from '@/types'

export function useMediasAtividades(turmaId: number, periodo: FiltroPeriodoTurma) {
  return useQuery({
    queryKey: ['relatorio-turma', turmaId, 'medias-atividades', periodo],
    queryFn: () => buscarMediasAtividades(turmaId, periodo),
  })
}

export function useDistribuicaoNotas(turmaId: number, periodo: FiltroPeriodoTurma) {
  return useQuery({
    queryKey: ['relatorio-turma', turmaId, 'distribuicao-notas', periodo],
    queryFn: () => buscarDistribuicaoNotas(turmaId, periodo),
  })
}

export function useProgressaoAlunos(turmaId: number, periodo: FiltroPeriodoTurma) {
  return useQuery({
    queryKey: ['relatorio-turma', turmaId, 'progressao-alunos', periodo],
    queryFn: () => buscarProgressaoAlunos(turmaId, periodo),
  })
}

export function useStatusEntregas(turmaId: number, periodo: FiltroPeriodoTurma) {
  return useQuery({
    queryKey: ['relatorio-turma', turmaId, 'status-entregas', periodo],
    queryFn: () => buscarStatusEntregas(turmaId, periodo),
  })
}
