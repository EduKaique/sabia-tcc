'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtividadeDetalhes } from '@/hooks/useAtividadeDetalhes'
import { useSubmissoes } from '@/hooks/useSubmissoes'
import { AtividadeDetalhesHeader } from '@/components/professor/atividades/detalhes/AtividadeDetalhesHeader'
import { AtividadeMetricasCards } from '@/components/professor/atividades/detalhes/AtividadeMetricasCards'
import { SubmissoesTable } from '@/components/professor/atividades/detalhes/SubmissoesTable'

function HeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
      <Skeleton className="h-12 w-96 rounded" />
      <Skeleton className="h-5 w-80 rounded" />
    </div>
  )
}

function MetricasSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  )
}

export default function AtividadeDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [filtroPendentes, setFiltroPendentes] = useState(false)

  const { data: atividade, isLoading } = useAtividadeDetalhes(id)
  const { data: submissoesData } = useSubmissoes(id, 0)

  return (
    <div className="px-8 py-6 space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/professor/atividades"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar para Turma
        </Link>
        <span>/</span>
        <span>Detalhes da Atividade</span>
      </div>

      {isLoading ? (
        <HeaderSkeleton />
      ) : atividade ? (
        <AtividadeDetalhesHeader atividade={atividade} />
      ) : null}

      {isLoading ? (
        <MetricasSkeleton />
      ) : atividade ? (
        <AtividadeMetricasCards
          atividade={atividade}
          submissoes={submissoesData?.content ?? []}
          onFiltrarPendentes={() => setFiltroPendentes(true)}
        />
      ) : null}

      <SubmissoesTable
        atividadeId={id}
        filtroPendentes={filtroPendentes}
        onFiltrarPendentes={() => setFiltroPendentes(true)}
      />
    </div>
  )
}
