'use client'

import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  titulo: string
  atividadeId: number
  onDeliver: () => void
}

export function CabecalhoEditor({ titulo, atividadeId, onDeliver }: Props) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-white shrink-0">
      <Link
        href={`/aluno/atividades/${atividadeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <h1 className="text-sm font-semibold text-foreground truncate max-w-sm">{titulo}</h1>

      <Button onClick={onDeliver} size="sm" className="gap-1.5">
        Entregar Atividade
        <Send size={14} />
      </Button>
    </header>
  )
}
