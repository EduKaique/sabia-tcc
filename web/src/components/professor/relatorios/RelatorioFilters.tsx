'use client'

import { CalendarDays, Users } from 'lucide-react'
import type { RelatorioRequest } from '@/types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Turma, AtividadeAvaliativa } from '@/types'

interface Props {
  value: RelatorioRequest
  turmas: Turma[]
  atividades: AtividadeAvaliativa[]
  onChange: (value: RelatorioRequest) => void
}

export function RelatorioFilters({ value, turmas, atividades, onChange }: Props) {
  const update = (changes: Partial<RelatorioRequest>) => onChange({ ...value, ...changes })

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-48 max-w-xs">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users size={14} />
          Turma
        </label>
        <Select
          value={value.turmaId ? String(value.turmaId) : 'TODAS'}
          onValueChange={(turmaId) =>
            update({ turmaId: turmaId === 'TODAS' ? undefined : Number(turmaId), atividadeId: undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todas as turmas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas as turmas</SelectItem>
            {turmas.map((turma) => (
              <SelectItem key={turma.id} value={String(turma.id)}>
                {turma.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.turmaId && (
        <div className="min-w-52 max-w-xs">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Atividade</label>
          <Select
            value={value.atividadeId ?? 'TODAS'}
            onValueChange={(atividadeId) =>
              update({ atividadeId: atividadeId === 'TODAS' ? undefined : atividadeId })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as atividades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas as atividades</SelectItem>
              {atividades
                .filter((atividade) => atividade.turmaId === value.turmaId && atividade.status === 'PUBLICADA')
                .map((atividade) => (
                <SelectItem key={atividade.id} value={atividade.id}>
                  {atividade.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CalendarDays size={14} />
          De
        </label>
        <Input
          type="date"
          value={value.dataInicio ?? ''}
          onChange={(event) => update({ dataInicio: event.target.value || undefined })}
          className="w-full sm:w-40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Até</label>
        <Input
          type="date"
          value={value.dataFim ?? ''}
          onChange={(event) => update({ dataFim: event.target.value || undefined })}
          className="w-full sm:w-40"
        />
      </div>
    </div>
  )
}
