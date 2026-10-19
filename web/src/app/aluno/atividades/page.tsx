'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtividadesAluno } from '@/hooks/useAtividadesAluno'
import { useTurmasAluno } from '@/hooks/useTurmasAluno'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, cartao } from '@/lib/estilos'
import { AtividadeCard } from '@/components/aluno/atividades/AtividadeCard'
import { AtividadeEntregueCard } from '@/components/aluno/atividades/AtividadeEntregueCard'
import { FiltroTabs, type TabAtividade } from '@/components/aluno/atividades/FiltroTabs'
import { EmptyState } from '@/components/aluno/atividades/EmptyState'
import { PainelDesempenho } from '@/components/aluno/atividades/PainelDesempenho'
import { PainelEntrarTurma } from '@/components/aluno/atividades/PainelEntrarTurma'

function CardSkeleton() {
  return (
    <div className={cn(cartao, 'space-y-3 p-5')}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
    </div>
  )
}

export default function AtividadesAlunoPage() {
  const [tab, setTab] = useState<TabAtividade>('pendentes')
  const { data: atividades = [], isLoading, error } = useAtividadesAluno()
  const turmas = useTurmasAluno()
  // Falha ao listar turmas não bloqueia a lista: o painel só aparece com a resposta "nenhuma turma".
  const semTurma = turmas.data?.length === 0

  const pendentes = atividades.filter(
    (a) => a.status === 'PENDENTE' || a.status === 'EM_ANDAMENTO',
  )
  const entregues = atividades.filter(
    (a) => a.status === 'ENTREGUE' || a.status === 'CORRIGIDA',
  )

  const estimatedHours = (pendentes.length * 0.5).toFixed(1)

  if (semTurma) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className={cn(fredoka.className, 'mb-6 text-center text-3xl font-bold text-tinta')}>
          Minhas Atividades
        </h1>
        <PainelEntrarTurma />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className={cn(fredoka.className, 'text-3xl font-bold text-tinta')}>Minhas Atividades</h1>
        <p className="mt-1 text-base text-tinta-apoio">
          <span className="font-bold text-tinta">{pendentes.length} atividades para completar</span>
          {' '}• Carga horária estimada: {estimatedHours}h
        </p>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="w-full min-w-0 flex-1">
          <div className="mb-5 flex justify-end">
            <FiltroTabs active={tab} onChange={setTab} />
          </div>

          {isLoading || turmas.isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <div className={cn(alertaErro, 'p-6 text-center')}>
              Erro ao carregar atividades. Tente novamente mais tarde.
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
