import Link from 'next/link'
import { ArrowRight, PartyPopper, Puzzle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, cartao, rotulo, textoApoio } from '@/lib/estilos'
import { pendencias } from '@/lib/licoes/aluno'
import type { LicaoDetalhe } from '@/types/licao'

interface Props {
  licao: Pick<LicaoDetalhe, 'id' | 'praticaLiberada' | 'concluidaEm' | 'paginas'>
  /** Leva o aluno a uma página pendente. */
  onIrPagina: (indice: number) => void
}

/** "Atividade": liberada quando todas as páginas estão concluídas (decisão do servidor). */
export function BlocoAtividade({ licao, onIrPagina }: Props) {
  const href = `/aluno/aprender/${licao.id}/editor`
  const concluida = !!licao.concluidaEm
  const faltam = pendencias(licao.paginas)

  return (
    <section aria-labelledby="titulo-atividade" className={cn(cartao, 'space-y-4 p-6')}>
      <h2 id="titulo-atividade" className={cn(fredoka.className, 'flex items-center gap-2 text-2xl font-bold text-tinta')}>
        <Puzzle size={22} aria-hidden="true" />
        Atividade
      </h2>

      {concluida && (
        <p role="status" className={cn(fredoka.className, 'flex items-center gap-2 rounded-2xl border-2 border-sabia-verde bg-sabia-verde/15 px-4 py-3 text-lg font-bold text-tinta')}>
          <PartyPopper size={20} className="shrink-0" aria-hidden="true" />
          <span>Parabéns! Você concluiu esta lição.</span>
        </p>
      )}

      {licao.praticaLiberada ? (
        <Link href={href} className={cn(botaoPrincipal, fredoka.className)}>
          {concluida ? (
            <>
              <RotateCcw size={18} aria-hidden="true" />
              Refazer a atividade
            </>
          ) : (
            <>
              Ir para a atividade
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </Link>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            disabled
            aria-describedby="falta-concluir"
            className={cn(botaoPrincipal, fredoka.className, 'cursor-not-allowed opacity-50')}
          >
            Ir para a atividade
          </button>
          <div id="falta-concluir" className="space-y-1">
            <p className={rotulo}>Falta concluir:</p>
            <ul className="space-y-1">
              {faltam.map((p) => (
                <li key={p.indice}>
                  <button
                    type="button"
                    onClick={() => onIrPagina(p.indice)}
                    className="min-h-10 text-base font-bold text-sabia-azul-escuro underline underline-offset-4 hover:text-tinta"
                  >
                    {p.rotulo}
                  </button>
                </li>
              ))}
            </ul>
            <p className={textoApoio}>A atividade abre quando todas as páginas estiverem concluídas.</p>
          </div>
        </div>
      )}
    </section>
  )
}
