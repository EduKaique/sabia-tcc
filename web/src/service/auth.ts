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
