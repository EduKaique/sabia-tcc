'use client'

import { use, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { WorkspaceSvg } from 'blockly/core'
import { useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { linkDiscreto, textoErro } from '@/lib/estilos'
import { lerCenario } from '@/lib/cenariosRobo'
import { hasBlocks } from '@/lib/workspaceBlockly'
import { useAtividadeAluno } from '@/hooks/useAtividadesAluno'
import { submeterAtividade } from '@/services/atividadesAlunoService'
import { CabecalhoEditor } from '@/components/aluno/editor/CabecalhoEditor'
import { SidebarInstrucoes } from '@/components/aluno/editor/SidebarInstrucoes'
import { AreaPratica } from '@/components/aluno/editor/AreaPratica'
import { ModalConfirmarEntrega } from '@/components/aluno/editor/ModalConfirmarEntrega'
import { TelaEntregaSucesso } from '@/components/aluno/editor/TelaEntregaSucesso'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditorPage({ params }: Props) {
  const { id } = use(params)
  const queryClient = useQueryClient()

  const { data: atividade, isLoading, error } = useAtividadeAluno(Number(id))

  const estadoJsonRef = useRef<string>('')
  const workspaceRef = useRef<WorkspaceSvg | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [emptyAlert, setEmptyAlert] = useState(false)
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
        hrefVoltar={`/aluno/atividades/${id}`}
        onDeliver={handleDeliver}
      />

      {emptyAlert && (
        <div role="status" className="absolute top-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl border-2 border-sabia-laranja bg-[#fff4ec] px-4 py-3 text-base font-bold text-tinta shadow-[0_4px_0_var(--color-tinta)]">
          Adicione pelo menos um bloco antes de entregar.
        </div>
      )}

      <AreaPratica
        cenario={cenario}
        sidebar={<SidebarInstrucoes atividade={atividade} />}
        workspaceRef={workspaceRef}
        onEstadoChange={(s) => { estadoJsonRef.current = s }}
        bloqueado={showModal}
      />

      <ModalConfirmarEntrega
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSubmit}
        isLoading={isSubmitting}
      />
    </>
  )
}
