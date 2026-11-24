import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, cartao, textoApoio } from '@/lib/estilos'
import { ROTULO_ESTADO_ALUNO, ROTULO_MODO } from '@/lib/licoes/aluno'
import type { EstadoLicaoAluno, LicaoResumo } from '@/types/licao'

const estiloEstado: Record<EstadoLicaoAluno, string> = {
  NAO_INICIADA: 'border-tinta/30 bg-white',
  EM_ANDAMENTO: 'border-sabia-azul bg-sabia-azul-claro',
  PRATICA_LIBERADA: 'border-sabia-amarelo bg-sabia-amarelo/30',
  CONCLUIDA: 'border-sabia-verde bg-sabia-verde/20',
}

const acao: Record<EstadoLicaoAluno, string> = {
  NAO_INICIADA: 'Começar',
  EM_ANDAMENTO: 'Continuar',
  PRATICA_LIBERADA: 'Continuar',
  CONCLUIDA: 'Rever',
}

export function LicaoCard({ licao }: { licao: LicaoResumo }) {
  const percentual = licao.totalPaginas > 0 ? Math.round((licao.paginasConcluidas * 100) / licao.totalPaginas) : 100

  return (
    <article className={cn(cartao, 'space-y-3 p-5')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={textoApoio}>{licao.conceito}</p>
          <h3 className={cn(fredoka.className, 'text-xl font-bold text-tinta')}>{licao.titulo}</h3>
        </div>
        <span className={cn('inline-flex items-center rounded-full border-2 px-3 py-0.5 text-xs font-bold text-tinta', estiloEstado[licao.estado])}>
          {licao.estado === 'CONCLUIDA' && '✓ '}
          {ROTULO_ESTADO_ALUNO[licao.estado]}
        </span>
      </div>

      {licao.resumo && <p className="line-clamp-2 text-base text-tinta-apoio">{licao.resumo}</p>}

      <div className="space-y-1">
        <p className="text-sm font-bold text-tinta">
          {licao.paginasConcluidas} de {licao.totalPaginas} páginas
        </p>
        <div
          role="progressbar"
          aria-label={`Páginas concluídas de ${licao.titulo}`}
          aria-valuemin={0}
          aria-valuemax={licao.totalPaginas}
          aria-valuenow={licao.paginasConcluidas}
          className="h-2.5 w-full overflow-hidden rounded-full border-2 border-tinta bg-white"
        >
          <div className="h-full bg-sabia-azul" style={{ width: `${percentual}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={textoApoio}>{ROTULO_MODO[licao.modo]}</span>
        {licao.atividadeConcluida && (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-tinta">
            <CheckCircle2 size={16} className="text-sabia-verde" aria-hidden="true" />
            Atividade concluída
          </span>
        )}
        {licao.turmas.map((t) => (
          <span key={t.id} className="rounded-full bg-tinta/5 px-2.5 py-0.5 text-xs font-bold text-tinta-apoio">
            {t.nome}
          </span>
        ))}
      </div>

      <div className="flex justify-end">
        <Link href={`/aluno/aprender/${licao.id}`} className={cn(botaoPrincipal, fredoka.className, 'min-h-12 px-5 py-2 text-base')}>
          {acao[licao.estado]}
          <span className="sr-only">: {licao.titulo}</span>
        </Link>
      </div>
    </article>
  )
}
