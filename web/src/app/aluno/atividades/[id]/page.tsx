'use client'

import { use } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtividadeAluno } from '@/hooks/useAtividadesAluno'
import { PainelDetalhe } from '@/components/aluno/atividades/PainelDetalhe'

interface Props {
  params: Promise<{ id: string }>
}

export default function AtividadeDetailPage({ params }: Props) {
  const { id } = use(params)
  const { data: atividade, isLoading, error } = useAtividadeAluno(Number(id))

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    )
  }

  if (error || !atividade) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-sm text-destructive">
          Atividade não encontrada ou erro ao carregar.
        </p>
      </div>
    )
  }

  return <PainelDetalhe atividade={atividade} />
}
