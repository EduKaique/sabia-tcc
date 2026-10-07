'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const homeByRole = {
  ADMINISTRADOR: '/admin/professores',
  PROFESSOR: '/professor/atividades',
  ALUNO: '/aluno/atividades',
} as const

type Role = keyof typeof homeByRole

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
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.replace(homeByRole[user.role])
    }
  }, [allowedRoles, hydrated, pathname, router, token, user])

  if (!hydrated || !token || !user || !allowedRoles.includes(user.role)) return null
  return children
}
