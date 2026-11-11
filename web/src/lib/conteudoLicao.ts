import type { LicaoDetalhe } from '@/types/licao'

/** O HTML tem algum texto (além de tags, espaços e &nbsp;)? */
function temTexto(html: string | null): boolean {
  return !!html && html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== ''
}

/** A lição tem página de texto na etapa de conteúdo (resumo ou `conteudo` com texto)? */
export function temPaginaTexto(licao: Pick<LicaoDetalhe, 'resumo' | 'conteudo'>): boolean {
  return !!licao.resumo?.trim() || temTexto(licao.conteudo)
}

/** A lição tem algo para a etapa de conteúdo (texto ou vídeo)? Sem isso, vai direto para a atividade. */
export function temConteudo(licao: Pick<LicaoDetalhe, 'resumo' | 'conteudo' | 'videoId'>): boolean {
  return temPaginaTexto(licao) || !!licao.videoId
}
