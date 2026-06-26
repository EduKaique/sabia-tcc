'use client'

import Link from 'next/link'
import { Calendar, Star, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { AtividadeAlunoDTO } from '@/types/atividade'
import { StatusBadge } from './StatusBadge'
import { getInfoUrgencia } from './IndicadorUrgencia'

interface Props {
  atividade: AtividadeAlunoDTO
}

export function PainelDetalhe({ atividade }: Props) {
  const { text: dateText, urgent } = getInfoUrgencia(atividade.dataEntrega, atividade.status)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link
        href="/aluno/atividades"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar para atividades
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <StatusBadge status={atividade.status} />
      </div>

      <h1 className="text-3xl font-bold text-foreground mb-3">{atividade.titulo}</h1>

      <div className="flex items-center gap-5 mb-6 text-sm text-muted-foreground">
        <span
          className={`flex items-center gap-1.5 ${urgent ? 'text-red-500 font-medium' : ''}`}
        >
          <Calendar size={14} />
          {dateText}
        </span>
        <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          {atividade.pontuacaoMaxima} XP
        </span>
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Descrição
          </h2>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: atividade.descricao }}
          />
        </CardContent>
      </Card>

      {(atividade.status === 'PENDENTE' || atividade.status === 'EM_ANDAMENTO') && (
        <Link href={`/aluno/atividades/${atividade.id}/editor`}>
          <Button size="lg" className="w-full sm:w-auto">
            {atividade.status === 'EM_ANDAMENTO' ? 'Continuar' : 'Iniciar Atividade'}
          </Button>
        </Link>
      )}

      {atividade.status === 'CORRIGIDA' && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-5">
            <p className="text-sm text-emerald-800">
              Atividade corrigida. Acesse sua submissão para ver nota e feedback.
            </p>
          </CardContent>
        </Card>
      )}

      {atividade.status === 'ENTREGUE' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-5">
            <p className="text-sm text-yellow-800">
              Sua atividade foi entregue e aguarda avaliação do professor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
