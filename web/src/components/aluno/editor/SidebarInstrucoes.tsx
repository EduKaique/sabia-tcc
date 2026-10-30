import { Calendar, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { textoApoio } from '@/lib/estilos'
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
    <aside className="w-80 h-full flex flex-col border-r-2 border-tinta/15 bg-white overflow-y-auto shrink-0">
      <div className="p-4 border-b-2 border-tinta/10">
        <h2 className={cn(fredoka.className, 'text-xl font-bold text-tinta leading-snug')}>
          {atividade.titulo}
        </h2>
      </div>

      <div className="flex-1 p-4 space-y-4 text-base">
        <div
          className="prose prose-sm max-w-none text-tinta"
          dangerouslySetInnerHTML={{ __html: atividade.descricao }}
        />

        <div className="pt-3 border-t-2 border-tinta/10 space-y-3">
          <div className={cn(textoApoio, 'flex items-center gap-2')}>
            <Calendar size={16} aria-hidden="true" />
            <span>Data limite: {formatDate(atividade.dataEntrega)}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-sabia-amarelo/30 px-3 py-1 text-sm font-bold text-tinta">
            <Star size={14} className="fill-sabia-amarelo text-sabia-amarelo" aria-hidden="true" />
            {atividade.pontuacaoMaxima} XP
          </span>
        </div>
      </div>
    </aside>
  )
}
