import { erroDaResposta, erroDeRede } from '@/lib/erroRequisicao'

const BASE = process.env.NEXT_PUBLIC_API_URL

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  tipo: string
  perfil: 'PROFESSOR' | 'ALUNO' | 'ADMINISTRADOR'
  nome: string
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (res.status === 401) {
    throw new Error('INVALID_CREDENTIALS')
  }

  if (!res.ok) {
    throw new Error('SERVER_ERROR')
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
  email: string
  senha: string
  confirmarSenha: string
}

export interface PrimeiroAcessoResponse extends LoginResponse {
  mustChangePassword: boolean
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
