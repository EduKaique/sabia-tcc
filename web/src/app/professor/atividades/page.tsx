'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  useAtividades,
  usePublicarAtividade,
  useDespublicarAtividade,
  useDeletarAtividade,
} from '@/hooks/useAtividades'
import { useTurmas } from '@/hooks/useTurmas'
import { AtividadeCard } from '@/components/professor/atividades/AtividadeCard'
import { AtividadeFilters, type FilterValue } from '@/components/professor/atividades/AtividadeFilters'
import { EmptyState } from '@/components/professor/atividades/EmptyState'
import { LoadingSkeleton } from '@/components/professor/atividades/LoadingSkeleton'
import { Button } from '@/components/ui/button'

export default function AtividadesPage() {
  const [filter, setFilter] = useState<FilterValue>('TODAS')

  const { data: atividades, isLoading } = useAtividades()
  const { data: turmas = [] } = useTurmas()
  const publicar = usePublicarAtividade()
  const despublicar = useDespublicarAtividade()
  const deletar = useDeletarAtividade()

  const turmaMap = Object.fromEntries(turmas.map((t) => [t.id, t.nome]))

  const filtered = (atividades ?? []).filter(
    (a) => filter === 'TODAS' || a.status === filter,
  )

  const total = atividades?.length ?? 0
  const hasFilter = filter !== 'TODAS'

  return (
    <div className="px-8 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atividades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os desafios de lógica e acompanhe o progresso das turmas.
          </p>
        </div>
        <Button asChild>
          <Link href="/professor/atividades/nova">
            <Plus size={16} />
            Nova Atividade
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <AtividadeFilters value={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState filtered={hasFilter} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((atividade) => (
            <AtividadeCard
              key={atividade.id}
              atividade={atividade}
              turmaNome={turmaMap[atividade.turmaId]}
              onEdit={() => (window.location.href = `/professor/atividades/${atividade.id}/editar`)}
              onPublicar={() => publicar.mutate(atividade.id)}
              onDespublicar={() => despublicar.mutate(atividade.id)}
              onDeletar={() => {
                if (confirm('Deseja excluir esta atividade?')) deletar.mutate(atividade.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
