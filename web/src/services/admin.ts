import api from '@/lib/api'

export interface ProfessorAdmin {
  id: number
  nome: string
  cpf: string
  email: string
  ativo: boolean
  mustChangePassword: boolean
}

export interface CriarProfessorPayload {
  nomeCompleto: string
  cpf: string
  email: string
}

export async function listarProfessores(ativo?: boolean) {
  const response = await api.get<ProfessorAdmin[]>('/api/admin/professores', {
    params: ativo === undefined ? undefined : { ativo },
  })
  return response.data
}

export async function criarProfessor(payload: CriarProfessorPayload) {
  const response = await api.post<ProfessorAdmin>('/api/admin/professores', payload)
  return response.data
}

export async function alterarStatusProfessor({ id, ativo }: { id: number; ativo: boolean }) {
  const action = ativo ? 'reativar' : 'desativar'
  const response = await api.patch(`/api/admin/professores/${id}/${action}`)
  return response.data
}
