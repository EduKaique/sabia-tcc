'use client'

import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, linkDiscreto } from '@/lib/estilos'

interface Props {
  titulo: string
  atividadeId: number
  onDeliver: () => void
}

export function CabecalhoEditor({ titulo, atividadeId, onDeliver }: Props) {
  return (
    <header className="h-16 flex items-center justify-between gap-4 px-4 border-b-2 border-tinta bg-white shrink-0">
      <Link
        href={`/aluno/atividades/${atividadeId}`}
        className={cn(linkDiscreto, 'gap-1.5 no-underline text-tinta-apoio hover:bg-sabia-azul-claro')}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar
      </Link>

      <h1 className={cn(fredoka.className, 'text-lg font-bold text-tinta truncate max-w-md')}>{titulo}</h1>

      <button
        type="button"
        onClick={onDeliver}
        className={cn(botaoPrincipal, fredoka.className, 'min-h-12 py-2 text-base')}
      >
        Entregar Atividade
        <Send size={16} aria-hidden="true" />
      </button>
    </header>
  )
}
