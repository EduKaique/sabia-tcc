'use client'

import { use } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtividadeAluno } from '@/hooks/useAtividadesAluno'
import { PainelDetalhe } from '@/components/aluno/atividades/PainelDetalhe'
import { alertaErro } from '@/lib/estilos'

interface Props {
  params: Promise<{ id: string }>
}

export default function AtividadeDetailPage({ params }: Props) {
  const { id } = use(params)
  const { data: atividade, isLoading, error } = useAtividadeAluno(Number(id))

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-14 w-48 rounded-full" />
      </div>
    )
  }

  if (error || !atividade) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <p className={alertaErro}>Atividade não encontrada ou erro ao carregar.</p>
      </div>
    )
  }

  return <PainelDetalhe atividade={atividade} />
}
