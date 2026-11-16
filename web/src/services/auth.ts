import api from '@/lib/api'
import { API_URL } from '@/lib/apiBase'
import { erroDaResposta, erroDeRede } from '@/lib/erroRequisicao'

const BASE = API_URL

export interface LoginRequest {
  /** Matrícula (aluno) ou e-mail (qualquer perfil). */
  login: string
  senha: string
}

export interface LoginResponse {
  token: string
  tipo: string
  role: 'PROFESSOR' | 'ALUNO' | 'ADMINISTRADOR'
  nome: string
  /** true: o usuário precisa trocar a senha antes de usar o sistema. */
  mustChangePassword: boolean
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    throw erroDeRede()
  }

  if (!res.ok) {
    throw await erroDaResposta(res)
  }
  return res.json()
}

export interface PrimeiroAcessoRequest {
  codigoTurma: string
  nomeCompleto: string
  matricula: string
  /** yyyy-MM-dd */
  dataNascimento: string
  avatar: string
  senha: string
  confirmarSenha: string
}

export interface PrimeiroAcessoResponse extends LoginResponse {
  turma: { nome: string }
}

/**
 * Cria a conta do aluno pelo convite (público). Em erro lança ErroRequisicao com o status
 * e os `campos` do backend (400/409), ou status 0 em falha de rede.
 */
export async function primeiroAcesso(data: PrimeiroAcessoRequest): Promise<PrimeiroAcessoResponse> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api/auth/primeiro-acesso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    throw erroDeRede()
  }

  if (!res.ok) {
    throw await erroDaResposta(res)
  }
  return res.json()
}

export interface TrocarSenhaRequest {
  senhaAtual: string
  novaSenha: string
  confirmarSenha: string
}

/** Troca a senha do usuário logado; devolve um token novo, já sem a troca pendente. */
export async function trocarSenha(data: TrocarSenhaRequest): Promise<LoginResponse> {
  const { data: resposta } = await api.post<LoginResponse>('/api/auth/trocar-senha', data)
  return resposta
}

export interface Perfil {
  nome: string
  /** Pode faltar para aluno que entrou só pela matrícula. */
  email?: string
  perfil: LoginResponse['role']
  /** Só aluno. */
  matricula?: string
  /** Só aluno. */
  avatar?: string
}

export interface EditarPerfilRequest {
  nome: string
  /** Só aluno; ausente mantém o atual. */
  avatar?: string
}

export interface EditarPerfilResponse {
  nome: string
  avatar?: string
  /** Token novo, já com o nome atualizado. */
  token: string
  /** Presente quando o nome ainda não chegou às atividades (pedagógico indisponível). */
  aviso?: string
}

export async function buscarPerfil(): Promise<Perfil> {
  const { data } = await api.get<Perfil>('/api/auth/perfil')
  return data
}

export async function editarPerfil(data: EditarPerfilRequest): Promise<EditarPerfilResponse> {
  const { data: resposta } = await api.patch<EditarPerfilResponse>('/api/auth/perfil', data)
  return resposta
}
