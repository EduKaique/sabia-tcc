'use client'

import { use, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { WorkspaceSvg } from 'blockly/core'
import { BookOpen } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { botaoSecundario, linkDiscreto, textoErro } from '@/lib/estilos'
import { toolboxRobo } from '@/lib/blocosRobo'
import type { CenarioRobo } from '@/types'
import { useAtividadeAluno } from '@/hooks/useAtividadesAluno'
import { submeterAtividade } from '@/services/atividadesAlunoService'
import { CabecalhoEditor } from '@/components/aluno/editor/CabecalhoEditor'
import { SidebarInstrucoes } from '@/components/aluno/editor/SidebarInstrucoes'
import BlocklyEditor from '@/components/BlocklyEditor'
import { PainelEntradaSaida } from '@/components/aluno/editor/PainelEntradaSaida'
import { ModalConfirmarEntrega } from '@/components/aluno/editor/ModalConfirmarEntrega'
import { TelaEntregaSucesso } from '@/components/aluno/editor/TelaEntregaSucesso'
import { ModalNomeVariavel } from '@/components/aluno/editor/ModalNomeVariavel'
import { PainelJogo } from '@/components/aluno/editor/PainelJogo'

interface Props {
  params: Promise<{ id: string }>
}

function hasBlocks(stateJson: string): boolean {
  try {
    const state = JSON.parse(stateJson)
    return Array.isArray(state?.blocks?.blocks) && state.blocks.blocks.length > 0
  } catch {
    return false
  }
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

export default function EditorPage({ params }: Props) {
  const { id } = use(params)
  const queryClient = useQueryClient()

  const { data: atividade, isLoading, error } = useAtividadeAluno(Number(id))

  const estadoJsonRef = useRef<string>('')
  const codeRef = useRef<string>('')
  const workspaceRef = useRef<WorkspaceSvg | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [emptyAlert, setEmptyAlert] = useState(false)
  const [variablePrompt, setVariablePrompt] = useState<{
    message: string
    defaultValue: string
    callback: (value: string | null) => void
  } | null>(null)

  const [estadoSerializado, setEstadoSerializado] = useState('')
  const [instrucoesAbertas, setInstrucoesAbertas] = useState(false)
  const modoJogo = atividade?.modo === 'JOGO_ROBO'
  const cenario = useMemo(
    () => (modoJogo ? lerCenario(atividade?.cenarioJson) : null),
    [modoJogo, atividade?.cenarioJson],
  )

  const handleDeliver = () => {
    if (!hasBlocks(estadoJsonRef.current)) {
      setEmptyAlert(true)
      setTimeout(() => setEmptyAlert(false), 3000)
      return
    }
    workspaceRef.current?.getFlyout()?.hide()
    setShowModal(true)
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    try {
      await submeterAtividade(Number(id), estadoJsonRef.current)
      await queryClient.invalidateQueries({ queryKey: ['atividades-aluno'] })
      setSubmitted(true)
    } catch {
      window.alert('Erro ao entregar atividade. Tente novamente.')
    } finally {
      setIsSubmitting(false)
      setShowModal(false)
    }
  }

  if (submitted) {
    return <TelaEntregaSucesso />
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-16 border-b-2 border-tinta bg-white flex items-center px-4 gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-12 w-44 rounded-full" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <Skeleton className="w-72 h-full" />
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="w-64 h-full" />
        </div>
      </div>
    )
  }

  if (error || !atividade) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={textoErro}>Atividade não encontrada.</p>
      </div>
    )
  }

  if (modoJogo && !cenario) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full px-4 text-center">
        <p className={textoErro}>Não foi possível carregar o cenário desta atividade. Avise seu professor.</p>
        <Link href={`/aluno/atividades/${id}`} className={linkDiscreto}>
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <>
      <CabecalhoEditor
        titulo={atividade.titulo}
        atividadeId={Number(id)}
        onDeliver={handleDeliver}
      />

      {emptyAlert && (
        <div role="status" className="absolute top-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl border-2 border-sabia-laranja bg-[#fff4ec] px-4 py-3 text-base font-bold text-tinta shadow-[0_4px_0_var(--color-tinta)]">
          Adicione pelo menos um bloco antes de entregar.
        </div>
      )}

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
            <SidebarInstrucoes atividade={atividade} />
          </div>

          <div className="relative min-h-0 min-w-0 flex-1">
            <BlocklyEditor
              workspaceOnly
              tema="scratch"
              workspaceExternoRef={workspaceRef}
              toolbox={toolboxRobo(cenario.blocosPermitidos)}
              opcoesExtras={cenario.maxBlocos ? { maxBlocks: cenario.maxBlocos } : undefined}
              onStateChange={(s) => {
                estadoJsonRef.current = s
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
            {(showModal || !!variablePrompt) && (
              <div className="absolute inset-0 z-30" aria-hidden="true" />
            )}
          </div>

          <PainelJogo cenario={cenario} estadoSerializado={estadoSerializado} workspaceRef={workspaceRef} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <SidebarInstrucoes atividade={atividade} />

          <div className="relative flex-1 h-full">
            <BlocklyEditor
              workspaceOnly
              tema="scratch"
              workspaceExternoRef={workspaceRef}
              onStateChange={(s) => { estadoJsonRef.current = s }}
              onCodeChange={(c) => { codeRef.current = c }}
              onVariablePrompt={(message, defaultValue, callback) =>
                setVariablePrompt({ message, defaultValue, callback })
              }
            />
            {(showModal || !!variablePrompt) && (
              <div className="absolute inset-0 z-30" aria-hidden="true" />
            )}
          </div>

          <PainelEntradaSaida tema="scratch" getCode={() => codeRef.current} />
        </div>
      )}

      <ModalConfirmarEntrega
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSubmit}
        isLoading={isSubmitting}
      />

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
