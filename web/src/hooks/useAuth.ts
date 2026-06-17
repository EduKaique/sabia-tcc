'use client'

import { useEffect, useState } from 'react'

interface AuthUser {
  id: string
  nome: string
  perfil: 'PROFESSOR' | 'ALUNO'
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (!stored) return

    try {
      const payload = JSON.parse(atob(stored.split('.')[1]))
      setUser({ id: payload.sub, nome: payload.nome, perfil: payload.perfil })
      setToken(stored)
    } catch {
      localStorage.removeItem('token')
    }
  }, [])

  return { user, token }
}
