'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { cartao } from '@/lib/estilos'
import { formatarNota } from '@/lib/formatarNota'
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
  const nota =
    atividade.status === 'CORRIGIDA' ? formatarNota(atividade.nota, atividade.pontuacaoMaxima) : null

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

      {nota && (
        <p className="mt-3 text-base font-bold text-tinta">
          Nota <span className={cn(fredoka.className, 'text-xl')}>{nota}</span>
        </p>
      )}
    </Link>
  )
}
