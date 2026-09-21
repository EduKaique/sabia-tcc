const BASE = process.env.NEXT_PUBLIC_AUTH_URL

interface ErroResponse {
  erro?: string
}

export interface EsqueciSenhaRequest {
  email: string
}

export interface EsqueciSenhaResponse {
  mensagem: string
}

export async function esqueciSenha(data: EsqueciSenhaRequest): Promise<EsqueciSenhaResponse> {
  const res = await fetch(`${BASE}/api/auth/esqueci-senha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error('SERVER_ERROR')
  }

  return res.json()
}

export interface RedefinirSenhaRequest {
  token: string
  novaSenha: string
  confirmarSenha: string
}

export interface RedefinirSenhaResponse {
  mensagem: string
}

export async function redefinirSenha(data: RedefinirSenhaRequest): Promise<RedefinirSenhaResponse> {
  const res = await fetch(`${BASE}/api/auth/redefinir-senha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const corpo: ErroResponse = await res.json().catch(() => ({}))
    throw new Error(corpo.erro ?? 'SERVER_ERROR')
  }

  return res.json()
}
