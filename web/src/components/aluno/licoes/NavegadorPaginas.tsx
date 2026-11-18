'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, botaoSecundario } from '@/lib/estilos'
import { ROTULO_TIPO_ALUNO } from '@/lib/licoes/aluno'
import type { PaginaAluno } from '@/types/licao'

interface Props {
  paginas: Pick<PaginaAluno, 'id' | 'tipo' | 'progresso'>[]
  indice: number
  onIr: (indice: number) => void
}

/** Passos (um por página, com marca de concluída) e Anterior/Próxima. A navegação é livre. */
export function NavegadorPaginas({ paginas, indice, onIr }: Props) {
  const ultima = paginas.length - 1
  return (
    <nav aria-label="Páginas da lição" className="space-y-4">
      <ol className="flex flex-wrap items-center justify-center gap-2">
        {paginas.map((p, i) => {
          const concluida = p.progresso.concluida
          const atual = i === indice
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onIr(i)}
                aria-current={atual ? 'step' : undefined}
                aria-label={`Página ${i + 1}: ${ROTULO_TIPO_ALUNO[p.tipo]}${concluida ? ' (concluída)' : ''}`}
                className={cn(
                  'flex size-11 items-center justify-center rounded-full border-2 border-tinta text-base font-bold text-tinta',
                  'outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul focus-visible:ring-offset-2',
                  concluida ? 'bg-sabia-verde/30' : 'bg-white',
                  atual && 'bg-sabia-amarelo shadow-[0_3px_0_var(--color-tinta)]'
                )}
              >
                {concluida && !atual ? <Check size={18} aria-hidden="true" /> : i + 1}
              </button>
            </li>
          )
        })}
      </ol>

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => onIr(indice - 1)} disabled={indice <= 0} className={cn(botaoSecundario, 'disabled:opacity-40')}>
          <ArrowLeft size={18} aria-hidden="true" />
          Anterior
        </button>
        <p className="text-sm font-medium text-tinta-apoio" aria-live="polite">
          Página {indice + 1} de {paginas.length}
        </p>
        <button
          type="button"
          onClick={() => onIr(indice + 1)}
          disabled={indice >= ultima}
          className={cn(botaoPrincipal, fredoka.className, 'min-h-12 px-5 py-2 text-base disabled:cursor-not-allowed disabled:opacity-40')}
        >
          Próxima
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
