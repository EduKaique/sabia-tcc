'use client'

import Link from 'next/link'
import { Calendar, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    <Card
      className={`bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 ${
        urgent ? 'border-l-red-500' : 'border-l-transparent'
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            &nbsp;
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-500 shrink-0">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {atividade.pontuacaoMaxima} XP
          </span>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1">{atividade.titulo}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{atividade.descricao}</p>

        <div className="flex items-center justify-between gap-3">
          <span
            className={`flex items-center gap-1.5 text-sm ${
              urgent ? 'text-red-500 font-medium' : 'text-muted-foreground'
            }`}
          >
            <Calendar size={14} />
            {dateText}
          </span>

          <Link href={`/aluno/atividades/${atividade.id}`}>
            <Button size="sm">{actionLabel}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
