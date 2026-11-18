'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useLicaoProfessor } from '@/hooks/useLicoesProfessor'
import { extrairErro } from '@/lib/licoes/errosLicao'
import { EditorLicao } from '@/components/professor/licoes/EditorLicao'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditarLicaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const licaoId = Number(id)
  const { data: licao, isLoading, error } = useLicaoProfessor(licaoId)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/professor/licoes" aria-label="Voltar para as lições">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Editar lição</h1>
          {licao && <p className="truncate text-sm text-muted-foreground">{licao.titulo}</p>}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : licao ? (
        // key: outra lição (ou recarga completa) reinicia o editor.
        <EditorLicao key={licao.id} detalhe={licao} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {error ? extrairErro(error).mensagem : 'Lição não encontrada.'}
        </p>
      )}
    </div>
  )
}
