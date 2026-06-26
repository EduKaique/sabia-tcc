'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bird, BookOpen, Map, Code2, Users, Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/aluno', label: 'Início', exact: true },
  { href: '/aluno/atividades', label: 'Avaliações', icon: BookOpen },
  { href: '/aluno/trilha', label: 'Trilha de Aprendizado', icon: Map },
  { href: '/aluno/sandbox', label: 'Sandbox', icon: Code2 },
  { href: '/aluno/turma', label: 'Minha turma', icon: Users },
]

export function AlunoNavbar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const initial = user?.nome?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="flex items-center h-14 px-6 bg-white border-b border-border shrink-0">
      <div className="flex items-center gap-2 mr-8">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Bird size={16} className="text-primary-foreground" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold">Sabiá</p>
          <p className="text-xs text-muted-foreground">Estudante</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 flex-1">
        {navItems.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <Bell size={18} />
        </button>
        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
          {initial}
        </div>
      </div>
    </header>
  )
}
