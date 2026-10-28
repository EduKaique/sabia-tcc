import api from '@/lib/pedagogicoApi'
import type {
  DistribuicaoNotas,
  FiltroPeriodoTurma,
  MediaAtividade,
  ProgressaoTurma,
  StatusEntregas,
} from '@/types'

const base = (turmaId: number) => `/api/professor/relatorio/turmas/${turmaId}`

async function buscar<T>(turmaId: number, recurso: string, periodo: FiltroPeriodoTurma): Promise<T> {
  const { data } = await api.get<T>(`${base(turmaId)}/${recurso}`, { params: periodo })
  return data
}

export const buscarMediasAtividades = (turmaId: number, periodo: FiltroPeriodoTurma = {}) =>
  buscar<MediaAtividade[]>(turmaId, 'medias-atividades', periodo)

export const buscarDistribuicaoNotas = (turmaId: number, periodo: FiltroPeriodoTurma = {}) =>
  buscar<DistribuicaoNotas>(turmaId, 'distribuicao-notas', periodo)

export const buscarProgressaoAlunos = (turmaId: number, periodo: FiltroPeriodoTurma = {}) =>
  buscar<ProgressaoTurma>(turmaId, 'progressao-alunos', periodo)

export const buscarStatusEntregas = (turmaId: number, periodo: FiltroPeriodoTurma = {}) =>
  buscar<StatusEntregas>(turmaId, 'status-entregas', periodo)
