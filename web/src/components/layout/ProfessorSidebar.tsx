'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/professor/atividades', label: 'Atividades', icon: BookOpen },
]

export function ProfessorSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const initial = user?.nome?.charAt(0).toUpperCase() ?? '?'

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-sidebar text-sidebar-foreground shrink-0 border-r border-sidebar-border">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold font-heading leading-none">Sabiá</p>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Professor</p>
          </div>
        </div>
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
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
        {/* <Link
          href="/professor/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <Settings size={18} />
          Configurações
        </Link> */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nome ?? '...'}</p>
            <p className="text-xs text-sidebar-foreground/60">Professor</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
