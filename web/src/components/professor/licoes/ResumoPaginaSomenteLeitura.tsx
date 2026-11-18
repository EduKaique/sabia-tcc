import type { ConteudoQuestionario, ConteudoVideoYoutube, TipoPagina } from '@/types/licaoProfessor'

function duracao(segundos: number | undefined): string {
  if (!segundos) return 'duração não informada'
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return m > 0 ? `${m} min ${s.toString().padStart(2, '0')} s` : `${s} s`
}

/**
 * Resumo de uma página que ainda não pode ser editada aqui (vídeo, questionário, vídeo enviado). Ela é mantida
 * exatamente como está ao salvar; só pode mudar de posição ou ser removida.
 */
export function ResumoPaginaSomenteLeitura({ tipo, conteudo }: { tipo: TipoPagina; conteudo: unknown }) {
  let resumo: string
  if (tipo === 'VIDEO_YOUTUBE') {
    const v = conteudo as Partial<ConteudoVideoYoutube>
    resumo = `${v.titulo ? `"${v.titulo}" · ` : ''}vídeo ${v.videoId ?? '?'} · ${duracao(v.duracaoSegundos)}`
  } else if (tipo === 'QUESTIONARIO') {
    const q = conteudo as Partial<ConteudoQuestionario>
    const n = q.perguntas?.length ?? 0
    resumo = `${n} ${n === 1 ? 'pergunta' : 'perguntas'} · mínimo para aprovar: ${q.percentualMinimo ?? '?'}%`
  } else {
    resumo = 'Vídeo enviado (recurso ainda não disponível).'
  }
  return (
    <div className="space-y-1 text-sm">
      <p className="text-foreground">{resumo}</p>
      <p className="text-xs text-muted-foreground">
        Esta página ainda não pode ser editada aqui. Ela será mantida como está ao salvar; você pode mudar a posição
        ou removê-la.
      </p>
    </div>
  )
}
