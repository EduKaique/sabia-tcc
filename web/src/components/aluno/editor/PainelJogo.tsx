'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WorkspaceSvg } from 'blockly/core'
import { Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, botaoSecundario, textoApoio } from '@/lib/estilos'
import { simular, type Simulacao } from '@/lib/simuladorRobo'
import type { CenarioRobo } from '@/types'
import { PalcoRobo } from './PalcoRobo'
import { SemaforoRobo, TEXTO_FASE, type FaseJogo } from './SemaforoRobo'

/** Tempo de cada casa andada pelo robô. */
const RITMO_MS = 400

interface Props {
  cenario: CenarioRobo
  estadoSerializado: string
  workspaceRef: React.MutableRefObject<WorkspaceSvg | null>
  className?: string
}

interface Execucao {
  simulacao: Simulacao
  estado: string
  instantanea: boolean
}

interface BlocoSerializado {
  next?: { block?: BlocoSerializado }
  inputs?: Record<string, { block?: BlocoSerializado }>
}

/** Conta todos os blocos do workspace (pilhas soltas inclusive) a partir do JSON serializado. */
function contarBlocos(estadoSerializado: string): number {
  const contar = (bloco?: BlocoSerializado): number =>
    bloco
      ? 1 +
        contar(bloco.next?.block) +
        Object.values(bloco.inputs ?? {}).reduce((soma, input) => soma + contar(input.block), 0)
      : 0
  try {
    const topo = JSON.parse(estadoSerializado)?.blocks?.blocks
    return Array.isArray(topo) ? topo.reduce((soma: number, b: BlocoSerializado) => soma + contar(b), 0) : 0
  } catch {
    return 0
  }
}

/**
 * Destaca um bloco (ou limpa com null). Lê o ref na hora da chamada de propósito: no unmount o
 * BlocklyEditor descarta o workspace e zera o ref antes, e aí não há o que limpar.
 */
function destacarBloco(workspaceRef: Props['workspaceRef'], blockId: string | null) {
  workspaceRef.current?.highlightBlock(blockId)
}

export function PainelJogo({ cenario, estadoSerializado, workspaceRef, className }: Props) {
  const [execucao, setExecucao] = useState<Execucao | null>(null)
  const [indice, setIndice] = useState(0)
  const [concluida, setConcluida] = useState(false)

  if (execucao && estadoSerializado !== execucao.estado) {
    setExecucao(null)
  }

  useEffect(() => {
    if (!execucao) return
    const { passos } = execucao.simulacao
    const ultimo = passos[passos.length - 1]
    const destacarResultado = () =>
      destacarBloco(workspaceRef, ultimo && !ultimo.ok ? ultimo.blockId : null)

    let timer: ReturnType<typeof setTimeout> | undefined
    if (execucao.instantanea) {
      destacarResultado()
    } else {
      let i = 0
      const andar = () => {
        const passo = passos[i]
        i++
        setIndice(i)
        destacarBloco(workspaceRef, passo.blockId)
        timer = setTimeout(
          i < passos.length
            ? andar
            : () => {
                destacarResultado()
                setConcluida(true)
              },
          RITMO_MS,
        )
      }
      timer = setTimeout(andar, RITMO_MS)
    }

    return () => {
      clearTimeout(timer)
      destacarBloco(workspaceRef, null)
    }
  }, [execucao, workspaceRef])

  const totalBlocos = useMemo(() => contarBlocos(estadoSerializado), [estadoSerializado])

  const executar = () => {
    const simulacao = simular(cenario, estadoSerializado)
    const instantanea =
      simulacao.passos.length === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setIndice(instantanea ? simulacao.passos.length : 0)
    setConcluida(instantanea)
    setExecucao({ simulacao, estado: estadoSerializado, instantanea })
  }

  const reiniciar = () => setExecucao(null)

  const fase: FaseJogo = !execucao
    ? 'PARADO'
    : !concluida
      ? 'EXECUTANDO'
      : execucao.simulacao.resultado.status
  const posicao =
    execucao && indice > 0 ? execucao.simulacao.passos[indice - 1] : cenario.inicio
  const final = execucao?.simulacao.resultado.posicaoFinal
  const textoFase = TEXTO_FASE[fase].endsWith('!') ? TEXTO_FASE[fase] : `${TEXTO_FASE[fase]}.`
  const anuncio =
    fase === 'PARADO'
      ? ''
      : fase === 'EXECUTANDO'
        ? TEXTO_FASE.EXECUTANDO
        : `${textoFase} O robô está na linha ${final!.linha + 1}, coluna ${final!.coluna + 1}.`

  return (
    <aside
      aria-label="Jogo do robô"
      className={cn(
        'order-first flex h-64 shrink-0 gap-4 border-b-2 border-tinta/15 bg-white p-4',
        'lg:order-none lg:h-full lg:w-[28rem] lg:flex-col lg:border-b-0 lg:border-l-2',
        className,
      )}
    >
      <div className="h-full w-56 shrink-0 lg:h-auto lg:min-h-0 lg:w-full lg:flex-1">
        <PalcoRobo
          cenario={cenario}
          posicao={posicao}
          erro={concluida && fase !== 'CHEGOU' && fase !== 'PARADO'}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-none">
        <SemaforoRobo fase={fase} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={executar}
            disabled={fase === 'EXECUTANDO'}
            className={cn(
              botaoPrincipal,
              fredoka.className,
              'min-h-12 flex-1 py-2 text-base bg-sabia-verde hover:bg-[#6fc983] disabled:bg-sabia-verde/60',
            )}
          >
            <Play size={16} className="fill-current" aria-hidden="true" />
            Executar
          </button>
          <button type="button" onClick={reiniciar} className={cn(botaoSecundario, 'flex-1')}>
            <RotateCcw size={16} aria-hidden="true" />
            Reiniciar
          </button>
        </div>

        <p className={textoApoio}>
          Blocos: {totalBlocos}
          {cenario.maxBlocos ? ` / ${cenario.maxBlocos}` : ''}
        </p>

        <p aria-live="polite" className="sr-only">
          {anuncio}
        </p>
      </div>
    </aside>
  )
}
