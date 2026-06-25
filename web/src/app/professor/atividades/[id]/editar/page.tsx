'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAtividade } from '@/hooks/useAtividades'
import { AtividadeForm } from '@/components/professor/atividades/AtividadeFormModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditarAtividadePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: atividade, isLoading } = useAtividade(id)

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/professor/atividades">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar atividade</h1>
          {atividade && <p className="text-sm text-muted-foreground">{atividade.titulo}</p>}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : atividade ? (
            <AtividadeForm atividade={atividade} tipoAtividade="ATIVIDADE_AVALIATIVA" />
          ) : (
            <p className="text-sm text-muted-foreground">Atividade não encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
