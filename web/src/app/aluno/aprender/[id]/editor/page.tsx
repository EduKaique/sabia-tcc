'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { WorkspaceSvg } from 'blockly/core'
import { isAxiosError } from 'axios'
import { Skeleton } from '@/components/ui/skeleton'
import { linkDiscreto, textoErro } from '@/lib/estilos'
import { lerCenario } from '@/lib/cenariosRobo'
import { hasBlocks } from '@/lib/workspaceBlockly'
import { temConteudo } from '@/lib/conteudoLicao'
import type { CenarioRobo } from '@/types'
import type { LicaoDetalhe } from '@/types/licao'
import { useLicao, useLicoes, useMutacoesLicao } from '@/hooks/useLicoes'
import { CabecalhoEditor } from '@/components/aluno/editor/CabecalhoEditor'
import { AreaPratica } from '@/components/aluno/editor/AreaPratica'
import { PainelLicao } from '@/components/aluno/licoes/PainelLicao'

/** Espera depois da última alteração do workspace antes do autosave. */
const AUTOSAVE_MS = 1500

interface Props {
  params: Promise<{ id: string }>
}

function MensagemErro({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full px-4 text-center">
      <p className={textoErro}>{texto}</p>
      <Link href="/aluno/aprender" className={linkDiscreto}>
        Voltar às lições
      </Link>
    </div>
  )
}

export default function LicaoEditorPage({ params }: Props) {
  const { id } = use(params)
  const { data: licao, isLoading, error } = useLicao(Number(id))

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-16 border-b-2 border-tinta bg-white flex items-center px-4 gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48 flex-1" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <Skeleton className="w-72 h-full" />
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="w-64 h-full" />
        </div>
      </div>
    )
  }

  if (error || !licao) {
    const naoEncontrada = isAxiosError(error) && error.response?.status === 404
    return (
      <MensagemErro
        texto={naoEncontrada ? 'Lição não encontrada ou indisponível.' : 'Não foi possível carregar a lição. Tente novamente.'}
      />
    )
  }

  const cenario = licao.modo === 'JOGO_ROBO' ? lerCenario(licao.cenarioJson) : null
  if (licao.modo === 'JOGO_ROBO' && !cenario) {
    return <MensagemErro texto="Não foi possível carregar o cenário desta lição." />
  }

  // key: trocar de lição (ex.: "Próxima lição") remonta o workspace e o autosave.
  return <PraticaLicao key={licao.id} licao={licao} cenario={cenario} />
}

function PraticaLicao({ licao, cenario }: { licao: LicaoDetalhe; cenario: CenarioRobo | null }) {
  // Estado do servidor sem blocos (ou fora do formato do Blockly) é tratado como "nada salvo":
  // não é carregado no workspace nem serve de referência para o autosave.
  const salvoValido = licao.estadoJson && hasBlocks(licao.estadoJson) ? licao.estadoJson : null
  // Capturado uma vez: refetch da lição nunca recarrega o workspace por baixo do aluno.
  const [estadoInicial] = useState(salvoValido ?? undefined)
  const workspaceRef = useRef<WorkspaceSvg | null>(null)
  const estadoRef = useRef(salvoValido ?? '')
  /** Último estado enviado (ou o válido que veio do servidor); null = nada salvo ainda. */
  const ultimoSalvoRef = useRef<string | null>(salvoValido)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const concluindoRef = useRef(false)

  const { salvarEstado, concluirAtividade } = useMutacoesLicao(licao.id)
  const { data: licoes } = useLicoes()
  const indice = licoes?.findIndex((l) => l.id === licao.id) ?? -1
  const proximaId = indice >= 0 ? licoes?.[indice + 1]?.id : undefined

  const salvarPendente = () => {
    timerRef.current = undefined
    const estado = estadoRef.current
    if (!estado || estado === ultimoSalvoRef.current) return
    const anterior = ultimoSalvoRef.current
    ultimoSalvoRef.current = estado
    salvarEstado.mutate(estado, {
      onError: () => {
        // Permite que a próxima alteração tente salvar de novo.
        if (ultimoSalvoRef.current === estado) ultimoSalvoRef.current = anterior
      },
    })
  }
  const salvarPendenteRef = useRef(salvarPendente)
  useEffect(() => {
    salvarPendenteRef.current = salvarPendente
  })

  // Ao sair da lição, não perde a última alteração ainda em debounce.
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        salvarPendenteRef.current()
      }
    },
    [],
  )

  const onEstadoChange = (estado: string) => {
    estadoRef.current = estado
    // O listener do Blockly também dispara em eventos de UI e no carregamento: só salva alteração real.
    if (estado === ultimoSalvoRef.current) return
    if (ultimoSalvoRef.current === null && !hasBlocks(estado)) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => salvarPendenteRef.current(), AUTOSAVE_MS)
  }

  const concluir = () => {
    if (licao.progresso.atividadeConcluida || concluindoRef.current) return
    const estado = estadoRef.current
    if (!estado) return
    concluindoRef.current = true
    clearTimeout(timerRef.current)
    timerRef.current = undefined
    ultimoSalvoRef.current = estado
    concluirAtividade.mutate(estado, {
      onError: () => {
        concluindoRef.current = false
      },
    })
  }

  const erro =
    concluirAtividade.isError
      ? 'Não foi possível registrar a conclusão. Execute de novo para tentar outra vez.'
      : salvarEstado.isError
        ? 'Não foi possível salvar seu progresso. Ele será salvo na próxima alteração.'
        : null

  return (
    <>
      {/* Sem conteúdo, a etapa 1 redireciona para cá: voltar para ela prenderia o aluno. */}
      <CabecalhoEditor
        titulo={licao.titulo}
        hrefVoltar={temConteudo(licao) ? `/aluno/aprender/${licao.id}` : '/aluno/aprender'}
      />

      <AreaPratica
        cenario={cenario}
        workspaceRef={workspaceRef}
        estadoInicial={estadoInicial}
        onEstadoChange={onEstadoChange}
        onResultadoRobo={(status) => { if (status === 'CHEGOU') concluir() }}
        onExecutarCodigo={concluir}
        sidebar={
          <PainelLicao
            licao={licao}
            proximaId={proximaId}
            erro={erro}
          />
        }
      />
    </>
  )
}
