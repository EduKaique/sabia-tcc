'use client'

import Link from 'next/link'
import { Calendar, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatarPontos } from '@/lib/formatarNota'
import { HtmlContent } from '@/components/HtmlContent'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, botaoSecundario, cartao, linkDiscreto } from '@/lib/estilos'
import type { AtividadeAlunoDTO } from '@/types/atividade'
import { StatusBadge } from './StatusBadge'
import { getInfoUrgencia } from './IndicadorUrgencia'
import { ResultadoCorrecao } from './ResultadoCorrecao'

interface Props {
  atividade: AtividadeAlunoDTO
}

const aviso = 'rounded-2xl border-2 p-5 text-base font-semibold text-tinta'

export function PainelDetalhe({ atividade }: Props) {
  const { text: dateText, urgent } = getInfoUrgencia(atividade.dataEntrega, atividade.status)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/aluno/atividades" className={cn(linkDiscreto, 'mb-4 gap-1.5 px-0')}>
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar para atividades
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={atividade.status} />
      </div>

      <h1 className={cn(fredoka.className, 'mb-3 text-3xl font-bold text-tinta')}>{atividade.titulo}</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-tinta-apoio">
        <span className={cn('flex items-center gap-1.5', urgent && 'text-sabia-erro')}>
          <Calendar size={16} aria-hidden="true" />
          {dateText}
        </span>
        <span className="rounded-full border-2 border-tinta/15 bg-white px-3 py-1 font-bold text-tinta">
          {formatarPontos(atividade.pontuacaoMaxima)}
        </span>
      </div>

      <section className={cn(cartao, 'mb-6 p-5')}>
        <h2 className={cn(fredoka.className, 'mb-3 text-lg font-bold text-tinta')}>Descrição</h2>
        <HtmlContent html={atividade.descricao} className="max-w-none text-tinta" />
      </section>

      {(atividade.status === 'PENDENTE' || atividade.status === 'EM_ANDAMENTO') && (
        <Link
          href={`/aluno/atividades/${atividade.id}/editor`}
          className={cn(botaoPrincipal, fredoka.className, 'w-full sm:w-auto')}
        >
          {atividade.status === 'EM_ANDAMENTO' ? 'Continuar' : 'Iniciar Atividade'}
        </Link>
      )}

      <ResultadoCorrecao atividade={atividade} />

      {atividade.status === 'ENTREGUE' && (
        <div className={cn(aviso, 'mb-6 border-sabia-laranja bg-sabia-laranja/10')}>
          Sua atividade foi entregue e aguarda avaliação do professor.
        </div>
      )}

      {(atividade.status === 'ENTREGUE' || atividade.status === 'CORRIGIDA') && (
        <Link
          href={`/aluno/atividades/${atividade.id}/projeto`}
          className={cn(botaoSecundario, fredoka.className, 'w-full sm:w-auto')}
        >
          Visualizar projeto
        </Link>
      )}
    </div>
  )
}
