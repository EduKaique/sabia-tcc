'use client'

import Link from 'next/link'
import { Calendar, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, cartao } from '@/lib/estilos'
import type { AtividadeAlunoDTO } from '@/types/atividade'
import { getInfoUrgencia } from './IndicadorUrgencia'

interface Props {
  atividade: AtividadeAlunoDTO
}

export function AtividadeCard({ atividade }: Props) {
  const { text: dateText, urgent } = getInfoUrgencia(atividade.dataEntrega, atividade.status)

  const actionLabel =
    atividade.status === 'EM_ANDAMENTO' ? 'Continuar' : 'Começar Agora'

  return (
    <article className={cn(cartao, 'p-5', urgent && 'border-l-8 border-l-sabia-erro')}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className={cn(fredoka.className, 'text-xl font-bold text-tinta')}>{atividade.titulo}</h3>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-sabia-amarelo/30 px-3 py-1 text-sm font-bold text-tinta">
          <Star size={14} className="fill-sabia-amarelo text-sabia-amarelo" aria-hidden="true" />
          {atividade.pontuacaoMaxima} XP
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-base text-tinta-apoio">{atividade.descricao}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn(
            'flex items-center gap-1.5 text-sm font-semibold',
            urgent ? 'text-sabia-erro' : 'text-tinta-apoio',
          )}
        >
          <Calendar size={16} aria-hidden="true" />
          {dateText}
        </span>

        <Link
          href={`/aluno/atividades/${atividade.id}`}
          className={cn(botaoPrincipal, fredoka.className, 'min-h-12 px-5 py-2 text-base')}
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  )
}
