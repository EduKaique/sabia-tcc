import { Calendar, Star } from 'lucide-react'
import type { AtividadeAlunoDTO } from '@/types/atividade'

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

export function SidebarInstrucoes({ atividade }: Props) {
  return (
    <aside className="w-80 h-full flex flex-col border-r border-border bg-white overflow-y-auto shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground leading-snug">{atividade.titulo}</h2>
      </div>

      <div className="flex-1 p-4 space-y-4 text-sm">
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: atividade.descricao }}
        />

        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span>Data limite: {formatDate(atividade.dataEntrega)}</span>
          </div>
          <div className="flex items-center gap-2 text-amber-500 font-medium">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span>{atividade.pontuacaoMaxima} XP</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
