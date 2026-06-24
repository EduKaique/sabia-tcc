'use client'

import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import type { StatusAtividade } from '@/types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTurmas } from '@/hooks/useTurmas'

export type FilterValue = StatusAtividade | 'TODAS'

interface Props {
  value: FilterValue
  onChange: (v: FilterValue) => void
}

export function AtividadeFilters({ value, onChange }: Props) {
  const [searchText, setSearchText] = useState('')
  const [turmaId, setTurmaId] = useState('TODAS')
  const { data: turmas = [] } = useTurmas()

  return (
    <div className="flex gap-3">
      <div className="relative flex-1 max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar atividade por nome..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={turmaId} onValueChange={setTurmaId}>
        <SelectTrigger className="w-44">
          <Users size={15} className="text-muted-foreground shrink-0" />
          <SelectValue placeholder="Turma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODAS">Todas as turmas</SelectItem>
          {turmas.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>
              {t.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value} onValueChange={(v) => onChange(v as FilterValue)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODAS">Todas</SelectItem>
          <SelectItem value="RASCUNHO">Rascunho</SelectItem>
          <SelectItem value="PUBLICADA">Publicada</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
