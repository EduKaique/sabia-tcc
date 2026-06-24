import Link from 'next/link'
import { CalendarDays, Calendar, Eye, Pencil } from 'lucide-react'
import type { AtividadeDetalhes } from '@/types'
import { Button } from '@/components/ui/button'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  )
}

interface Props {
  atividade: AtividadeDetalhes
}

export function AtividadeDetalhesHeader({ atividade }: Props) {
  const isPublicada = atividade.status === 'PUBLICADA'

  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {isPublicada ? (
            <span className="inline-flex items-center bg-[#ECFDF5] text-[#065F46] rounded-full px-2.5 py-1 text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5" />
              Publicada
            </span>
          ) : (
            <span className="inline-flex items-center bg-[#FFFBEB] text-[#92400E] rounded-full px-2.5 py-1 text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5" />
              Rascunho
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 border border-border bg-muted rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <CalendarDays size={12} />
            {atividade.turmaNome}
          </span>

          {atividade.dataEntrega && (
            <span className="inline-flex items-center gap-1.5 border border-border bg-muted rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Calendar size={12} />
              Prazo: {formatDate(atividade.dataEntrega)}
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold text-primary leading-tight mb-3">
          {atividade.titulo}
        </h1>

        <p className="text-muted-foreground max-w-xl">{atividade.descricao}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-1">
        <Button variant="outline" asChild>
          <a href="#">
            <Eye size={16} />
            Visualizar
          </a>
        </Button>
        <Button asChild>
          <Link href={`/professor/atividades/${atividade.id}/editar`}>
            <Pencil size={16} />
            Editar Atividade
          </Link>
        </Button>
      </div>
    </div>
  )
}
