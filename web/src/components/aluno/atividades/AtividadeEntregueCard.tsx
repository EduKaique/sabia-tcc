'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
    <Link href={`/aluno/atividades/${atividade.id}`} className="block">
      <Card className="relative overflow-hidden bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4">
          <div className="mb-3">
            <StatusBadge status={atividade.status} />
          </div>

          <h3 className="text-base font-bold text-foreground mb-3">{atividade.titulo}</h3>

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar size={12} />
            Data limite: {formatDate(atividade.dataEntrega)}
          </span>
        </CardContent>

        {isCorrigida && (
          <div
            className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-400 opacity-30"
            style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
          />
        )}
      </Card>
    </Link>
  )
}
