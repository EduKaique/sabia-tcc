'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Bell, KeyRound, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { buscarPerfil } from '@/services/auth'
import { encerrarSessao } from '@/lib/auth-helpers'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { AvatarCabecalhoAluno } from '@/components/layout/AvatarCabecalhoAluno'
import styles from '@/styles/home.module.css'

const navItems = [
  { href: '/aluno/aprender', label: 'Aprender' },
  { href: '/aluno/atividades', label: 'Avaliações' },
]

const botaoIcone =
  'flex size-12 items-center justify-center rounded-full text-tinta-apoio transition-colors hover:bg-sabia-azul-claro hover:text-tinta outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul'

export function AlunoNavbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  // O avatar não vem no token. Mesma chave da tela de perfil, que atualiza este cache ao salvar.
  const { data: perfil } = useQuery({ queryKey: ['perfil'], queryFn: buscarPerfil, enabled: !!user })

  const handleLogout = () => {
    encerrarSessao()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b-2 border-tinta bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/aluno/aprender"
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
          <Link href="/perfil" aria-label="Meu perfil" title="Meu perfil" className={botaoIcone}>
            <UserRound size={20} aria-hidden="true" />
          </Link>
          <Link href="/trocar-senha" aria-label="Alterar senha" title="Alterar senha" className={botaoIcone}>
            <KeyRound size={20} aria-hidden="true" />
          </Link>
          <button type="button" onClick={handleLogout} aria-label="Sair" title="Sair" className={botaoIcone}>
            <LogOut size={20} aria-hidden="true" />
          </button>
          <AvatarCabecalhoAluno nome={user?.nome} avatar={perfil?.avatar} />
        </div>
      </div>
    </header>
  )
}
