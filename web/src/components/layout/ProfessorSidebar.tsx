'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, GraduationCap, Users, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/professor/atividades', label: 'Atividades', icon: BookOpen },
  { href: '/professor/turmas', label: 'Turmas', icon: GraduationCap },
  { href: '/professor/alunos', label: 'Alunos', icon: Users },
  { href: '/professor/configuracoes', label: 'Configurações', icon: Settings },
]

export function ProfessorSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground shrink-0 border-r border-sidebar-border">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <span className="text-xl font-bold tracking-tight">Sabiá</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.nome ?? '...'}</p>
            <p className="text-xs text-sidebar-foreground/60">Professor</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              window.location.href = '/login'
            }}
            className="p-1.5 hover:bg-sidebar-accent/50 rounded-lg transition-colors shrink-0"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
