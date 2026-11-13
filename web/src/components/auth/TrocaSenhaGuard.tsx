'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ROTA_TROCAR_SENHA } from '@/lib/auth-helpers'

// true só no cliente: evita decidir o redirecionamento no render do servidor.
const subscribeNoop = () => () => {}

/**
 * Só verifica a troca de senha pendente (claim do JWT) e leva para /trocar-senha.
 * Não faz controle de login nem de perfil.
 */
export function TrocaSenhaGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
  const pendente = hydrated && !!user?.mustChangePassword

  useEffect(() => {
    if (pendente) router.replace(ROTA_TROCAR_SENHA)
  }, [pendente, router])

  if (pendente) return null
  return children
}
