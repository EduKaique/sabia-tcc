import { cn, formatarDataHora, parseDataUtc } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { cartao, textoApoio } from '@/lib/estilos'
import { formatarNota } from '@/lib/formatarNota'
import type { AtividadeAlunoDTO } from '@/types/atividade'

interface Props {
  atividade: AtividadeAlunoDTO
}

/** Nota e comentário do professor; só aparece quando a atividade está corrigida. */
export function ResultadoCorrecao({ atividade }: Props) {
  const nota = formatarNota(atividade.nota, atividade.pontuacaoMaxima)
  if (atividade.status !== 'CORRIGIDA' || nota == null) return null

  return (
    <section className={cn(cartao, 'mb-6 space-y-4 border-sabia-verde p-5')}>
      <h2 className={cn(fredoka.className, 'text-lg font-bold text-tinta')}>Resultado</h2>

      <div>
        <p className={textoApoio}>Nota</p>
        <p className={cn(fredoka.className, 'text-4xl font-bold text-tinta')}>{nota}</p>
      </div>

      {atividade.feedbackProfessor && (
        <div>
          <p className={textoApoio}>Comentário do professor</p>
          <p className="whitespace-pre-wrap text-base text-tinta">{atividade.feedbackProfessor}</p>
        </div>
      )}

      {atividade.avaliadaEm && (
        <p className={textoApoio}>
          Corrigida em {formatarDataHora(parseDataUtc(atividade.avaliadaEm))}
        </p>
      )}
    </section>
  )
}
