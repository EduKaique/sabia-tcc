import axios from 'axios'
import api from '@/lib/pedagogicoApi'
import { ErroRequisicao, erroDeRede } from '@/lib/erroRequisicao'
import type { ErroApi } from '@/types'

export interface TurmaDoAluno {
  id: number
  nome: string
}

function paraErroRequisicao(erro: unknown): ErroRequisicao {
  if (axios.isAxiosError<Partial<ErroApi>>(erro) && erro.response) {
    return new ErroRequisicao(erro.response.status, erro.response.data?.erro ?? 'SERVER_ERROR')
  }
  return erroDeRede()
}

export async function listarTurmasAluno(): Promise<TurmaDoAluno[]> {
  const { data } = await api.get<TurmaDoAluno[]>('/api/aluno/turmas')
  return data
}

export async function entrarNaTurma(codigo: string): Promise<TurmaDoAluno> {
  try {
    const { data } = await api.post<TurmaDoAluno>('/api/aluno/turmas/entrar', { codigo })
    return data
  } catch (erro) {
    throw paraErroRequisicao(erro)
  }
}
