'use client'

import { useRef, useState, type ReactNode } from 'react'
import type { WorkspaceSvg } from 'blockly/core'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { botaoSecundario } from '@/lib/estilos'
import { toolboxRobo } from '@/lib/blocosRobo'
import type { StatusSimulacao } from '@/lib/simuladorRobo'
import type { CenarioRobo } from '@/types'
import BlocklyEditor from '@/components/BlocklyEditor'
import { PainelEntradaSaida } from './PainelEntradaSaida'
import { ModalNomeVariavel } from './ModalNomeVariavel'
import { PainelJogo } from './PainelJogo'

interface Props {
  /** Cenário do Jogo do Robô; null = blocos livres. */
  cenario: CenarioRobo | null
  /** Painel à esquerda (instruções da atividade, conteúdo da lição...). */
  sidebar: ReactNode
  workspaceRef: React.MutableRefObject<WorkspaceSvg | null>
  /** Estado serializado do workspace carregado ao abrir. */
  estadoInicial?: string
  onEstadoChange: (estado: string) => void
  /** Cobre o workspace enquanto a página mostra um modal próprio. */
  bloqueado?: boolean
  /** Modo robô: fim de cada execução. */
  onResultadoRobo?: (status: StatusSimulacao) => void
  /** Blocos livres: o aluno rodou código com blocos no workspace. */
  onExecutarCodigo?: () => void
}

/** Área de prática do aluno (workspace + painel lateral), nos layouts do robô e dos blocos livres. */
export function AreaPratica({
  cenario,
  sidebar,
  workspaceRef,
  estadoInicial,
  onEstadoChange,
  bloqueado = false,
  onResultadoRobo,
  onExecutarCodigo,
}: Props) {
  const codeRef = useRef<string>('')
  const [estadoSerializado, setEstadoSerializado] = useState('')
  const [instrucoesAbertas, setInstrucoesAbertas] = useState(false)
  const [variablePrompt, setVariablePrompt] = useState<{
    message: string
    defaultValue: string
    callback: (value: string | null) => void
  } | null>(null)

  return (
    <>
      {cenario ? (
        <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div
            id="instrucoes-atividade"
            onKeyDown={(e) => { if (e.key === 'Escape') setInstrucoesAbertas(false) }}
            className={cn(
              instrucoesAbertas ? 'flex' : 'hidden',
              'absolute inset-y-0 left-0 z-[25] shadow-[4px_0_0_var(--color-tinta)] xl:static xl:flex xl:shadow-none',
            )}
          >
            {sidebar}
          </div>

          <div className="relative min-h-0 min-w-0 flex-1">
            <BlocklyEditor
              workspaceOnly
              tema="scratch"
              workspaceExternoRef={workspaceRef}
              initialState={estadoInicial}
              toolbox={toolboxRobo(cenario.blocosPermitidos)}
              opcoesExtras={cenario.maxBlocos ? { maxBlocks: cenario.maxBlocos } : undefined}
              onStateChange={(s) => {
                onEstadoChange(s)
                setEstadoSerializado(s)
              }}
            />
            <button
              type="button"
              aria-expanded={instrucoesAbertas}
              aria-controls="instrucoes-atividade"
              onClick={() => setInstrucoesAbertas((aberto) => !aberto)}
              className={cn(botaoSecundario, 'absolute top-3 right-3 z-10 xl:hidden')}
            >
              <BookOpen size={16} aria-hidden="true" />
              Instruções
            </button>
            {(bloqueado || !!variablePrompt) && (
              <div className="absolute inset-0 z-30" aria-hidden="true" />
            )}
          </div>

          <PainelJogo
            cenario={cenario}
            estadoSerializado={estadoSerializado}
            workspaceRef={workspaceRef}
            onResultado={onResultadoRobo}
          />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {sidebar}

          <div className="relative flex-1 h-full">
            <BlocklyEditor
              workspaceOnly
              tema="scratch"
              workspaceExternoRef={workspaceRef}
              initialState={estadoInicial}
              onStateChange={onEstadoChange}
              onCodeChange={(c) => { codeRef.current = c }}
              onVariablePrompt={(message, defaultValue, callback) =>
                setVariablePrompt({ message, defaultValue, callback })
              }
            />
            {(bloqueado || !!variablePrompt) && (
              <div className="absolute inset-0 z-30" aria-hidden="true" />
            )}
          </div>

          <PainelEntradaSaida tema="scratch" getCode={() => codeRef.current} onExecutar={onExecutarCodigo} />
        </div>
      )}

      {variablePrompt && (
        <ModalNomeVariavel
          open
          message={variablePrompt.message}
          defaultValue={variablePrompt.defaultValue}
          onConfirm={(value) => { variablePrompt.callback(value); setVariablePrompt(null) }}
          onCancel={() => { variablePrompt.callback(null); setVariablePrompt(null) }}
        />
      )}
    </>
  )
}
