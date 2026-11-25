'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, linkDiscreto } from '@/lib/estilos'

interface Props {
  /** Texto do título ou, no Sandbox, o campo de nome editável. */
  titulo: ReactNode
  hrefVoltar: string
  /** Sem ele, o botão "Entregar Atividade" não aparece. */
  onDeliver?: () => void
  /** Ações à direita no lugar de "Entregar" (Sandbox: indicador de salvamento e botão Salvar). */
  acoes?: ReactNode
}

export function CabecalhoEditor({ titulo, hrefVoltar, onDeliver, acoes }: Props) {
  return (
    <header className="h-16 flex items-center justify-between gap-4 px-4 border-b-2 border-tinta bg-white shrink-0">
      <Link
        href={hrefVoltar}
        className={cn(linkDiscreto, 'gap-1.5 no-underline text-tinta-apoio hover:bg-sabia-azul-claro')}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar
      </Link>

      <h1 className={cn(fredoka.className, 'text-lg font-bold text-tinta truncate max-w-md')}>{titulo}</h1>

      {acoes ? (
        <div className="flex shrink-0 items-center gap-2">{acoes}</div>
      ) : onDeliver ? (
        <button
          type="button"
          onClick={onDeliver}
          className={cn(botaoPrincipal, fredoka.className, 'min-h-12 py-2 text-base')}
        >
          Entregar Atividade
          <Send size={16} aria-hidden="true" />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </header>
  )
}
