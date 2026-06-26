'use client'

import { usePathname } from 'next/navigation'
import { AlunoNavbar } from '@/components/layout/AlunoNavbar'

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname?.endsWith('/editor')) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AlunoNavbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
