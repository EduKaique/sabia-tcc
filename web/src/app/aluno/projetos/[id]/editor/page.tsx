'use client'

import { use, useRef, useState } from 'react'
import Link from 'next/link'
import type { WorkspaceSvg } from 'blockly/core'
import { isAxiosError } from 'axios'
import { Check, Loader2, Pencil, Save, TriangleAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, linkDiscreto, textoErro } from '@/lib/estilos'
import { cenarioSemLimite, lerCenario } from '@/lib/cenariosRobo'
import { extrairErroSandbox } from '@/lib/sandbox/errosSandbox'
import type { CenarioRobo } from '@/types'
import type { ProjetoSandboxDetalhe } from '@/types/projetoSandbox'
import { useAtualizarProjetoSandbox, useProjetoSandbox } from '@/hooks/useProjetosSandbox'
import { useAutoSaveSandbox, type StatusSalvamento } from '@/hooks/useAutoSaveSandbox'
import { CabecalhoEditor } from '@/components/aluno/editor/CabecalhoEditor'
import { AreaPratica } from '@/components/aluno/editor/AreaPratica'
import { NomeProjetoEditavel } from '@/components/aluno/projetos/NomeProjetoEditavel'
import { SidebarSandbox } from '@/components/aluno/projetos/SidebarSandbox'

interface Props {
  params: Promise<{ id: string }>
}

function MensagemErro({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full px-4 text-center">
      <p className={textoErro}>{texto}</p>
      <Link href="/aluno/projetos" className={linkDiscreto}>
        Voltar para Meus Projetos
      </Link>
    </div>
  )
}

export default function ProjetoSandboxEditorPage({ params }: Props) {
  const { id } = use(params)
  const { data: projeto, isLoading, error } = useProjetoSandbox(Number(id))

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

  if (error || !projeto) {
    const naoEncontrado = isAxiosError(error) && error.response?.status === 404
    return (
      <MensagemErro
        texto={naoEncontrado ? 'Projeto não encontrado.' : extrairErroSandbox(error).mensagem}
      />
    )
  }

  const cenarioLido = projeto.modo === 'JOGO_ROBO' ? lerCenario(projeto.cenarioJson) : null
  if (projeto.modo === 'JOGO_ROBO' && !cenarioLido) {
    return <MensagemErro texto="Não foi possível carregar o cenário deste projeto." />
  }
  // Sandbox não tem limite de blocos.
  const cenario = cenarioLido ? cenarioSemLimite(cenarioLido) : null

  // key: trocar de projeto remonta o workspace e o auto-save.
  return <EditorSandbox key={projeto.id} projeto={projeto} cenario={cenario} />
}

const TEXTO_STATUS: Record<Exclude<StatusSalvamento, 'erro' | 'grande'>, string> = {
  salvo: 'Salvo',
  pendente: 'Alterações não salvas',
  salvando: 'Salvando...',
}

function EditorSandbox({ projeto, cenario }: { projeto: ProjetoSandboxDetalhe; cenario: CenarioRobo | null }) {
  // Capturado uma vez: o cache atualizado a cada salvamento nunca recarrega o workspace por baixo do aluno.
  const [estadoInicial] = useState(projeto.estadoJson ?? undefined)
  const workspaceRef = useRef<WorkspaceSvg | null>(null)
  const { status, mensagemErro, notificarAlteracao, salvarAgora } = useAutoSaveSandbox(
    projeto.id,
    projeto.estadoJson,
  )

  const atualizarNome = useAtualizarProjetoSandbox(projeto.id)
  const [nome, setNome] = useState(projeto.nome)
  const [editandoNome, setEditandoNome] = useState(false)
  const erroNome = atualizarNome.isError ? extrairErroSandbox(atualizarNome.error).mensagem : null

  const salvarNome = (novo: string) => {
    const anterior = nome
    setNome(novo)
    atualizarNome.mutate(
      { nome: novo },
      {
        onSuccess: (p) => setNome(p.nome),
        onError: () => setNome(anterior),
      },
    )
  }

  const titulo = editandoNome ? (
    <NomeProjetoEditavel
      valor={nome}
      rotulo="Nome do projeto"
      erroDiscreto
      className="w-64 max-w-full font-sans"
      onSalvar={salvarNome}
      onFechar={() => setEditandoNome(false)}
    />
  ) : (
    <button
      type="button"
      onClick={() => {
        atualizarNome.reset()
        setEditandoNome(true)
      }}
      title="Renomear projeto"
      className="inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 hover:bg-sabia-azul-claro outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul"
    >
      <span className="truncate">{nome}</span>
      <Pencil size={14} aria-hidden="true" className="shrink-0 text-tinta-apoio" />
      <span className="sr-only">(renomear)</span>
    </button>
  )

  const problema = status === 'erro' || status === 'grande'
  const acoes = (
    <>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          'items-center gap-1.5 text-sm font-bold',
          problema || erroNome ? 'inline-flex' : 'hidden sm:inline-flex',
        )}
      >
        {erroNome ? (
          <span className="inline-flex items-center gap-1.5 text-sabia-erro">
            <TriangleAlert size={16} aria-hidden="true" />
            {erroNome}
          </span>
        ) : problema ? (
          <span className="inline-flex items-center gap-1.5 text-sabia-erro">
            <TriangleAlert size={16} aria-hidden="true" />
            {status === 'grande' ? mensagemErro : 'Erro ao salvar.'}
            {status === 'erro' && (
              <button type="button" onClick={salvarAgora} className="underline underline-offset-4 hover:text-tinta">
                Tentar novamente
              </button>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-tinta-apoio">
            {status === 'salvando' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {status === 'salvo' && <Check size={16} aria-hidden="true" />}
            {TEXTO_STATUS[status as keyof typeof TEXTO_STATUS]}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={salvarAgora}
        disabled={status === 'salvando'}
        className={cn(botaoPrincipal, fredoka.className, 'min-h-12 py-2 text-base')}
      >
        <Save size={16} aria-hidden="true" />
        Salvar
      </button>
    </>
  )

  return (
    <>
      <CabecalhoEditor titulo={titulo} hrefVoltar="/aluno/projetos" acoes={acoes} />

      <AreaPratica
        cenario={cenario}
        workspaceRef={workspaceRef}
        estadoInicial={estadoInicial}
        onEstadoChange={notificarAlteracao}
        sidebar={<SidebarSandbox projeto={projeto} />}
      />
    </>
  )
}
