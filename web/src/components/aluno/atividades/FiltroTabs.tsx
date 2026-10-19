'use client'

import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'

export type TabAtividade = 'pendentes' | 'entregues'

interface Props {
  active: TabAtividade
  onChange: (tab: TabAtividade) => void
}

const abas: { valor: TabAtividade; label: string }[] = [
  { valor: 'pendentes', label: 'Avaliação Pedentes' },
  { valor: 'entregues', label: 'Entregues' },
]

export function FiltroTabs({ active, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border-2 border-tinta bg-white p-1">
      {abas.map(({ valor, label }) => (
        <button
          key={valor}
          type="button"
          aria-pressed={active === valor}
          onClick={() => onChange(valor)}
          className={cn(
            fredoka.className,
            'min-h-10 rounded-full px-4 text-base font-semibold transition-colors outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul',
            active === valor ? 'bg-sabia-amarelo text-tinta' : 'text-tinta-apoio hover:bg-sabia-azul-claro hover:text-tinta',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
