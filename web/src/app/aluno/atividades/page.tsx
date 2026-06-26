'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtividadesAluno } from '@/hooks/useAtividadesAluno'
import { AtividadeCard } from '@/components/aluno/atividades/AtividadeCard'
import { AtividadeEntregueCard } from '@/components/aluno/atividades/AtividadeEntregueCard'
import { FiltroTabs, type TabAtividade } from '@/components/aluno/atividades/FiltroTabs'
import { EmptyState } from '@/components/aluno/atividades/EmptyState'
import { PainelDesempenho } from '@/components/aluno/atividades/PainelDesempenho'

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
    </div>
  )
}

export default function AtividadesAlunoPage() {
  const [tab, setTab] = useState<TabAtividade>('pendentes')
  const { data: atividades = [], isLoading, error } = useAtividadesAluno()

  const pendentes = atividades.filter(
    (a) => a.status === 'PENDENTE' || a.status === 'EM_ANDAMENTO',
  )
  const entregues = atividades.filter(
    (a) => a.status === 'ENTREGUE' || a.status === 'CORRIGIDA',
  )

  const estimatedHours = (pendentes.length * 0.5).toFixed(1)

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Minhas Atividades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-foreground">{pendentes.length} atividades para completar</span>
          {' '}• Carga horária estimada: {estimatedHours}h
        </p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex justify-end mb-5">
            <FiltroTabs active={tab} onChange={setTab} />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive">
                Erro ao carregar atividades. Tente novamente mais tarde.
              </p>
            </div>
          ) : tab === 'pendentes' ? (
            pendentes.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {pendentes.map((a) => (
                  <AtividadeCard key={a.id} atividade={a} />
                ))}
              </div>
            )
          ) : entregues.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entregues.map((a) => (
                <AtividadeEntregueCard key={a.id} atividade={a} />
              ))}
            </div>
          )}
        </div>

        {!isLoading && !error && (
          <PainelDesempenho atividades={atividades} />
        )}
      </div>
    </div>
  )
}
