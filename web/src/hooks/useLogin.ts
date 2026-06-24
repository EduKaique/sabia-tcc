'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { login } from '@/service/auth'
import { salvarToken, redirecionarPorPerfil } from '@/lib/auth-helpers'

export function useLogin(router: { push: (path: string) => void }) {
  const [erroAutenticacao, setErroAutenticacao] = useState(false)

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      salvarToken(data.token)
      redirecionarPorPerfil(data, router)
    },
    onError: (error: Error) => {
      if (error.message === 'INVALID_CREDENTIALS') {
        setErroAutenticacao(true)
      }
    },
  })

  return { ...mutation, erroAutenticacao, setErroAutenticacao }
}
