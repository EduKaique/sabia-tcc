import Link from 'next/link'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, cartao, textoApoio } from '@/lib/estilos'
import type { LicaoResumo, ProgressoLicao } from '@/types/licao'

type SituacaoLicao = 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'CONCLUIDA'

const config: Record<SituacaoLicao, { label: string; className: string; acao: string }> = {
  NAO_INICIADA: { label: 'Não iniciada', className: 'border-tinta/30 bg-white', acao: 'Começar' },
  EM_ANDAMENTO: { label: 'Em andamento', className: 'border-sabia-azul bg-sabia-azul-claro', acao: 'Continuar' },
  CONCLUIDA: { label: '✓ Concluída', className: 'border-sabia-verde bg-sabia-verde/20', acao: 'Praticar de novo' },
}

function situacao(p: ProgressoLicao): SituacaoLicao {
  if (p.concluida) return 'CONCLUIDA'
  return p.videoVisto || p.atividadeConcluida ? 'EM_ANDAMENTO' : 'NAO_INICIADA'
}

interface Props {
  licao: LicaoResumo
  numero: number
}

export function LicaoCard({ licao, numero }: Props) {
  const { label, className, acao } = config[situacao(licao.progresso)]

  return (
    <article className={cn(cartao, 'flex flex-wrap items-center gap-4 p-5')}>
      <span
        aria-hidden="true"
        className={cn(
          fredoka.className,
          'flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-sabia-amarelo text-xl font-bold text-tinta',
        )}
      >
        {numero}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className={cn(fredoka.className, 'text-xl font-bold text-tinta')}>{licao.titulo}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={textoApoio}>{licao.conceito}</span>
          <span
            className={cn(
              'inline-flex items-center rounded-full border-2 px-3 py-0.5 text-xs font-bold text-tinta',
              className,
            )}
          >
            {label}
          </span>
        </div>
      </div>

      <Link
        href={`/aluno/aprender/${licao.id}`}
        className={cn(botaoPrincipal, fredoka.className, 'min-h-12 px-5 py-2 text-base')}
      >
        {acao}
        <span className="sr-only">: {licao.titulo}</span>
      </Link>
    </article>
  )
}
