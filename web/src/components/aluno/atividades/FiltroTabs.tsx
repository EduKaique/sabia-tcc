'use client'

export type TabAtividade = 'pendentes' | 'entregues'

interface Props {
  active: TabAtividade
  onChange: (tab: TabAtividade) => void
}

export function FiltroTabs({ active, onChange }: Props) {
  return (
    <div className="inline-flex items-center bg-muted rounded-lg p-1 gap-1">
      <button
        onClick={() => onChange('pendentes')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
          active === 'pendentes'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Avaliação Pedentes
      </button>
      <button
        onClick={() => onChange('entregues')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
          active === 'entregues'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Entregues
      </button>
    </div>
  )
}
