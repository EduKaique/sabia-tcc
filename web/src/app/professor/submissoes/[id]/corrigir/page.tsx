'use client'

import { use, useMemo, useRef } from 'react'
import Link from 'next/link'
import type { WorkspaceSvg } from 'blockly/core'
import { ArrowLeft } from 'lucide-react'
import { useSubmissaoProfessor, mensagemErroSubmissao } from '@/hooks/useSubmissaoProfessor'
import { useAtividade } from '@/hooks/useAtividades'
import BlocklyEditor from '@/components/BlocklyEditor'
import { PainelEntradaSaida } from '@/components/aluno/editor/PainelEntradaSaida'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CabecalhoCorrecao } from '@/components/professor/submissoes/CabecalhoCorrecao'
import { FormCorrecao } from '@/components/professor/submissoes/FormCorrecao'
import { ResumoCorrecao } from '@/components/professor/submissoes/ResumoCorrecao'
import { PainelRelatorioIa } from '@/components/professor/submissoes/PainelRelatorioIa'
import {
  PainelResultadoSimulacao,
  notaSugeridaRobo,
} from '@/components/professor/submissoes/PainelResultadoSimulacao'
import { PainelJogo } from '@/components/aluno/editor/PainelJogo'
import { simular } from '@/lib/simuladorRobo'
import type { CenarioRobo } from '@/types'

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

/** Lê o cenarioJson do modo Jogo do Robô; devolve null se estiver ausente ou com formato inesperado. */
function lerCenario(cenarioJson: string | null | undefined): CenarioRobo | null {
  if (!cenarioJson) return null
  try {
    const c = JSON.parse(cenarioJson)
    const posicaoValida = (p: unknown) =>
      typeof p === 'object' && p !== null &&
      Number.isInteger((p as CenarioRobo['inicio']).linha) &&
      Number.isInteger((p as CenarioRobo['inicio']).coluna)
    const valido =
      Number.isInteger(c?.linhas) && Number.isInteger(c?.colunas) &&
      posicaoValida(c.inicio) && posicaoValida(c.destino) &&
      Array.isArray(c.obstaculos) && c.obstaculos.every(posicaoValida) &&
      Array.isArray(c.blocosPermitidos)
    return valido ? (c as CenarioRobo) : null
  } catch {
    return null
  }
}

const MENSAGEM_CENARIO_INVALIDO =
  'Não foi possível carregar o cenário desta atividade; o replay e a nota sugerida não estão disponíveis.'

export default function CorrigirSubmissaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const codeRef = useRef('')
  const { data: submissao, isLoading, error, refetch } = useSubmissaoProfessor(id)
  const { data: atividade } = useAtividade(submissao ? String(submissao.atividadeId) : '')

  // Jogo do Robô: replay e nota sugerida pela mesma simulação que o aluno viu.
  const workspaceRef = useRef<WorkspaceSvg | null>(null)
  const modoJogo = atividade?.modo === 'JOGO_ROBO'
  const cenario = useMemo(
    () => (modoJogo ? lerCenario(atividade?.cenarioJson) : null),
    [modoJogo, atividade?.cenarioJson],
  )
  const estadoJson = submissao?.estadoJson
  const simulacao = useMemo(
    () => (cenario && estadoJson ? simular(cenario, estadoJson) : null),
    [cenario, estadoJson],
  )

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
              {submissao.estadoJson && modoJogo ? (
                <div className="space-y-2">
                  <div className="flex flex-col overflow-hidden rounded-md border border-border lg:h-120 lg:flex-row">
                    <div className="h-80 min-w-0 lg:h-auto lg:flex-1">
                      <BlocklyEditor
                        workspaceOnly
                        readOnly
                        initialState={submissao.estadoJson}
                        workspaceExternoRef={workspaceRef}
                      />
                    </div>
                    {cenario && (
                      <PainelJogo
                        cenario={cenario}
                        estadoSerializado={submissao.estadoJson}
                        workspaceRef={workspaceRef}
                        className="lg:w-72"
                      />
                    )}
                  </div>
                  {!cenario && <p className="text-sm text-destructive">{MENSAGEM_CENARIO_INVALIDO}</p>}
                </div>
              ) : submissao.estadoJson ? (
                <div className="flex h-120 overflow-hidden rounded-md border border-border">
                  <div className="min-w-0 flex-1">
                    <BlocklyEditor
                      workspaceOnly
                      readOnly
                      initialState={submissao.estadoJson}
                      onCodeChange={(code) => { codeRef.current = code }}
                    />
                  </div>
                  <PainelEntradaSaida getCode={() => codeRef.current} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Projeto do aluno indisponível.</p>
              )}
            </CardContent>
          </Card>

          {submissao.correcao ? (
            <ResumoCorrecao correcao={submissao.correcao} />
          ) : (
            <FormCorrecao
              submissaoId={id}
              atividadeId={submissao.atividadeId}
              notaSugerida={
                simulacao && atividade
                  ? notaSugeridaRobo(simulacao, atividade.pontuacaoMaxima)
                  : undefined
              }
            />
          )}
        </div>

        {modoJogo ? (
          simulacao && cenario && atividade ? (
            <PainelResultadoSimulacao
              simulacao={simulacao}
              cenario={cenario}
              pontuacaoMaxima={atividade.pontuacaoMaxima}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Resultado da simulação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {cenario ? 'Não há projeto do aluno para simular.' : MENSAGEM_CENARIO_INVALIDO}
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          <PainelRelatorioIa
            relatorioIaJson={submissao.correcao?.relatorioIaJson}
            payload={
              atividade && submissao.estadoJson
                ? {
                    atividade: {
                      titulo: atividade.titulo,
                      descricao: atividade.descricao,
                      pontuacaoMaxima: atividade.pontuacaoMaxima,
                      gabaritoEstadoJson: atividade.gabaritoEstadoJson,
                    },
                    submissaoEstadoJson: submissao.estadoJson,
                  }
                : null
            }
          />
        )}
      </div>
    </div>
  )
}
