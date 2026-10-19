'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { cartao } from '@/lib/estilos'
import type { AtividadeAlunoDTO } from '@/types/atividade'
import { StatusBadge } from './StatusBadge'

interface Props {
  atividade: AtividadeAlunoDTO
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function AtividadeEntregueCard({ atividade }: Props) {
  const isCorrigida = atividade.status === 'CORRIGIDA'

  return (
    <Link
      href={`/aluno/atividades/${atividade.id}`}
      className={cn(
        cartao,
        'relative block h-full overflow-hidden p-4 transition-transform duration-150 hover:-translate-y-0.5',
        'outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul focus-visible:ring-offset-2',
      )}
    >
      <div className="mb-3">
        <StatusBadge status={atividade.status} />
      </div>

      <h3 className={cn(fredoka.className, 'mb-3 text-lg font-bold text-tinta')}>{atividade.titulo}</h3>

      <span className="flex items-center gap-1.5 text-sm font-medium text-tinta-apoio">
        <Calendar size={14} aria-hidden="true" />
        Data limite: {formatDate(atividade.dataEntrega)}
      </span>

      {isCorrigida && (
        <div
          aria-hidden="true"
          className="absolute right-0 bottom-0 h-10 w-10 bg-sabia-verde opacity-50"
          style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
        />
      )}
    </Link>
  )
}
