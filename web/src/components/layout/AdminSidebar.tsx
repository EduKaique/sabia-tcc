'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const logout = () => {
    localStorage.removeItem('token')
    document.cookie = 'sabia_token=; Max-Age=0; path=/'
    router.push('/login')
  }

  return (
    <aside className="flex min-h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <ShieldCheck size={16} className="text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold leading-none">Sabiá</p>
            <p className="mt-0.5 text-xs text-sidebar-foreground/60">Administração</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <Link
          href="/admin/professores"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${pathname.startsWith('/admin/professores') ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
        >
          <Users size={18} />
          Professores
        </Link>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10">
          <LogOut size={18} />
          Sair
        </button>
      </div>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {user?.nome?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.nome ?? '...'}</p>
            <p className="text-xs text-sidebar-foreground/60">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
