'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ROTA_TROCAR_SENHA } from '@/lib/auth-helpers'

const homeByRole = {
  ADMINISTRADOR: '/admin/professores',
  PROFESSOR: '/professor/atividades',
  ALUNO: '/aluno/atividades',
} as const

type Role = keyof typeof homeByRole

// true só no cliente: evita decidir o redirecionamento no render do servidor.
const subscribeNoop = () => () => {}

export function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: Role[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, token } = useAuth()
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  useEffect(() => {
    if (!hydrated) return

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    if (user?.mustChangePassword) {
      router.replace(ROTA_TROCAR_SENHA)
      return
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.replace(homeByRole[user.role])
    }
  }, [allowedRoles, hydrated, pathname, router, token, user])

  if (!hydrated || !token || !user || user.mustChangePassword || !allowedRoles.includes(user.role)) {
    return null
  }
  return children
}
