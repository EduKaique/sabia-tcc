import api from '@/lib/pedagogicoApi'
import authApi from '@/lib/api'
import type { AlunoBusca, AlunoDaTurma, AlunoMatriculado } from '@/types'

export interface MatricularAlunoPayload {
  alunoId: number
  alunoNome: string
}

/** Alunos da turma com matrícula, avatar e troca pendente (auth-service, que valida o dono da turma). */
export async function listarAlunosDaTurma(turmaId: number): Promise<AlunoDaTurma[]> {
  const { data } = await authApi.get<AlunoDaTurma[]>(`/api/auth/professor/turmas/${turmaId}/alunos`)
  return data
}

export async function matricularAluno(
  turmaId: number,
  payload: MatricularAlunoPayload,
): Promise<AlunoMatriculado> {
  const { data } = await api.post<AlunoMatriculado>(`/api/professor/turmas/${turmaId}/alunos`, payload)
  return data
}

export async function desmatricularAluno(turmaId: number, alunoId: number): Promise<void> {
  await api.delete(`/api/professor/turmas/${turmaId}/alunos/${alunoId}`)
}

/** Busca exata no auth-service por e-mail, CPF ou matrícula (somente professores). */
export async function buscarAluno(termo: string): Promise<AlunoBusca> {
  const { data } = await authApi.get<AlunoBusca>('/api/auth/alunos/busca', { params: { termo } })
  return data
}
