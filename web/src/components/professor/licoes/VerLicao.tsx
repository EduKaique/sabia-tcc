'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Archive, FileText, Pencil, RefreshCw, Send, Undo2, Users } from 'lucide-react'
import { useDespublicarLicao, useProgressoLicao, usePublicarLicao } from '@/hooks/useLicoesProfessor'
import { extrairErro } from '@/lib/licoes/errosLicao'
import { montarRelatorioLicao } from '@/lib/licoes/painelProgresso'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArquivarLicaoDialog } from './ArquivarLicaoDialog'
import { ROTULO_ESTADO, ROTULO_MODO, VARIANTE_ESTADO } from './estadoLicao'
import { LegendaEstados } from './progresso/LegendaEstados'
import { RelatorioLicao } from './progresso/RelatorioLicao'

/** Página "Ver lição": dados da lição, ações (editar, publicar, arquivar) e o progresso de cada aluno. */
export function VerLicao({ licaoId }: { licaoId: number }) {
  const router = useRouter()
  const { data, isLoading, isError, error, isFetching, refetch } = useProgressoLicao(licaoId)
  const publicar = usePublicarLicao()
  const despublicar = useDespublicarLicao()
  const [arquivando, setArquivando] = useState(false)
  const relatorio = useMemo(() => (data ? montarRelatorioLicao(data) : null), [data])

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Carregando a lição">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data || !relatorio) {
    const status = (error as { response?: { status?: number } } | null)?.response?.status
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center">
        <AlertCircle className="mb-3 text-destructive" size={32} aria-hidden="true" />
        <p className="font-semibold text-foreground">{error ? extrairErro(error).mensagem : 'Lição não encontrada.'}</p>
        {status !== 403 && status !== 404 && (
          <Button className="mt-5" variant="outline" onClick={() => refetch()}>
            <RefreshCw size={16} aria-hidden="true" />
            Tentar de novo
          </Button>
        )}
      </div>
    )
  }

  const { licao } = data
  const publicada = licao.estado === 'PUBLICADA'
  const arquivada = licao.estado === 'ARQUIVADA'
  const acao = publicada ? despublicar : publicar
  const erroAcao = publicar.error ?? despublicar.error

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold break-words text-foreground">{licao.titulo}</h1>
              <Badge variant={VARIANTE_ESTADO[licao.estado]}>{ROTULO_ESTADO[licao.estado]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{licao.conceito}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li>{ROTULO_MODO[licao.modo]}</li>
              <li className="flex items-center gap-1">
                <FileText size={12} aria-hidden="true" />
                {data.paginas.length} {data.paginas.length === 1 ? 'página' : 'páginas'}
              </li>
              <li className="flex items-center gap-1">
                <Users size={12} aria-hidden="true" />
                {data.turmas.length > 0 ? data.turmas.map((t) => t.turmaNome).join(', ') : 'Nenhuma turma vinculada'}
              </li>
              <li className="font-medium text-foreground">{relatorio.resumo}</li>
            </ul>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            {!arquivada && (
              <>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href={`/professor/licoes/${licao.id}/editar`}>
                    <Pencil size={16} />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={acao.isPending}
                  onClick={() => {
                    publicar.reset()
                    despublicar.reset()
                    acao.mutate(licao.id)
                  }}
                >
                  {publicada ? <Undo2 size={16} /> : <Send size={16} />}
                  {publicada ? 'Despublicar' : 'Publicar'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive sm:w-auto"
                  onClick={() => setArquivando(true)}
                >
                  <Archive size={16} />
                  Arquivar
                </Button>
              </>
            )}
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : undefined} aria-hidden="true" />
              Atualizar
            </Button>
          </div>
        </div>

        {erroAcao && <p className="text-sm text-destructive">{extrairErro(erroAcao).mensagem}</p>}
        {licao.estado === 'RASCUNHO' && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
            Os alunos não veem esta lição enquanto ela não for publicada.
          </p>
        )}
        {arquivada && (
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Esta lição está arquivada: não aparece para os alunos e não pode mais ser editada.
          </p>
        )}
      </section>

      <section aria-labelledby="titulo-progresso" className="space-y-3">
        <div className="space-y-2">
          <h2 id="titulo-progresso" className="text-xl font-semibold">
            Progresso dos alunos
          </h2>
          {data.turmas.length > 0 && <LegendaEstados />}
        </div>
        {data.turmas.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            Esta lição ainda não está vinculada a nenhuma turma. Vincule a lição a uma turma em Editar.
          </p>
        ) : (
          <RelatorioLicao grupos={relatorio.grupos} colunas={relatorio.colunas} />
        )}
      </section>

      <ArquivarLicaoDialog
        licao={arquivando ? { id: licao.id, titulo: licao.titulo } : null}
        onOpenChange={(open) => !open && setArquivando(false)}
        onArquivada={() => router.replace('/professor/licoes')}
      />
    </div>
  )
}
