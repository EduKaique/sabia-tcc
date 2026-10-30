'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { encerrarSessao } from '@/lib/auth-helpers'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import styles from '@/styles/home.module.css'

const navItems = [{ href: '/aluno/atividades', label: 'Avaliações' }]

const botaoIcone =
  'flex size-12 items-center justify-center rounded-full text-tinta-apoio transition-colors hover:bg-sabia-azul-claro hover:text-tinta outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul'

export function AlunoNavbar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const handleLogout = () => {
    encerrarSessao()
    window.location.href = '/'
  }

  const initial = user?.nome?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b-2 border-tinta bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/aluno/atividades"
          className={cn(
            styles.brandBlock,
            fredoka.className,
            // brandBlock lê --home-blue, que só existe dentro do .page da home.
            '[--home-blue:var(--color-sabia-azul)]',
            'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-1 text-base font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul focus-visible:ring-offset-2',
          )}
        >
          <BookOpen size={18} aria-hidden="true" />
          Sabiá
        </Link>

        <nav aria-label="Principal" className="flex flex-1 items-center gap-2">
          {navItems.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  fredoka.className,
                  'inline-flex min-h-12 items-center rounded-full border-2 px-4 text-base font-semibold transition-colors outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul',
                  active
                    ? 'border-tinta bg-sabia-amarelo text-tinta'
                    : 'border-transparent text-tinta-apoio hover:bg-sabia-azul-claro hover:text-tinta',
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" aria-label="Notificações" className={cn(botaoIcone, 'hidden sm:flex')}>
            <Bell size={20} aria-hidden="true" />
          </button>
          <button type="button" onClick={handleLogout} aria-label="Sair" title="Sair" className={botaoIcone}>
            <LogOut size={20} aria-hidden="true" />
          </button>
          <div
            aria-hidden="true"
            className={cn(
              fredoka.className,
              'flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-sabia-amarelo text-base font-bold text-tinta',
            )}
          >
            {initial}
          </div>
        </div>
      </div>
    </header>
  )
}
