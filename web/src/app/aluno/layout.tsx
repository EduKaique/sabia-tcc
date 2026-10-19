'use client'

import { usePathname } from 'next/navigation'
import { AlunoNavbar } from '@/components/layout/AlunoNavbar'
import { cn } from '@/lib/utils'
import { nunito } from '@/lib/fontesHome'

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname?.endsWith('/editor')) {
    return <>{children}</>
  }

  return (
    <div
      className={cn(
        nunito.className,
        'flex min-h-screen flex-col bg-linear-to-b from-[#e8f5ff] via-[#f6f9ff] to-[#fff7e6] text-tinta',
      )}
    >
      <AlunoNavbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
