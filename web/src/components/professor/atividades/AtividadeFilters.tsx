'use client'

import type { StatusAtividade } from '@/types'

export type FilterValue = StatusAtividade | 'TODAS'

interface Props {
  value: FilterValue
  onChange: (v: FilterValue) => void
}

const tabs: { label: string; value: FilterValue }[] = [
  { label: 'Todas', value: 'TODAS' },
  { label: 'Rascunho', value: 'RASCUNHO' },
  { label: 'Publicadas', value: 'PUBLICADA' },
]

export function AtividadeFilters({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === tab.value
              ? 'bg-background text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
