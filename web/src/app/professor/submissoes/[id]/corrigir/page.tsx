'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useSubmissaoProfessor, mensagemErroSubmissao } from '@/hooks/useSubmissaoProfessor'
import BlocklyEditor from '@/components/BlocklyEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CabecalhoCorrecao } from '@/components/professor/submissoes/CabecalhoCorrecao'
import { FormCorrecao } from '@/components/professor/submissoes/FormCorrecao'
import { ResumoCorrecao } from '@/components/professor/submissoes/ResumoCorrecao'
import { PainelRelatorioIa } from '@/components/professor/submissoes/PainelRelatorioIa'

function Voltar({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft size={14} />
      {texto}
    </Link>
  )
}

export default function CorrigirSubmissaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: submissao, isLoading, error, refetch } = useSubmissaoProfessor(id)

  if (isLoading) {
    return (
      <div className="px-8 py-6 space-y-6">
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-24 w-96 rounded" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-120 rounded-xl lg:col-span-2" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !submissao) {
    const status = (error as { response?: { status?: number } } | null)?.response?.status
    const mensagem =
      status === 404
        ? 'Submissão não encontrada.'
        : status === 403
          ? mensagemErroSubmissao(error)
          : 'Não foi possível carregar a submissão.'
    return (
      <div className="px-8 py-6 space-y-4">
        <Voltar href="/professor/atividades" texto="Voltar para atividades" />
        <p className="text-sm text-destructive">{mensagem}</p>
        {status !== 404 && status !== 403 && (
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="px-8 py-6 space-y-6">
      <Voltar href={`/professor/atividades/${submissao.atividadeId}`} texto="Voltar para a atividade" />

      <CabecalhoCorrecao submissao={submissao} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Projeto do aluno</CardTitle>
            </CardHeader>
            <CardContent>
              {submissao.estadoJson ? (
                <div className="h-120 overflow-hidden rounded-md border border-border">
                  <BlocklyEditor workspaceOnly readOnly initialState={submissao.estadoJson} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Projeto do aluno indisponível.</p>
              )}
            </CardContent>
          </Card>

          {submissao.correcao ? (
            <ResumoCorrecao correcao={submissao.correcao} />
          ) : (
            <FormCorrecao submissaoId={id} atividadeId={submissao.atividadeId} />
          )}
        </div>

        <PainelRelatorioIa relatorioIaJson={submissao.correcao?.relatorioIaJson} />
      </div>
    </div>
  )
}
