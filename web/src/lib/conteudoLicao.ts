import type { LicaoDetalhe } from '@/types/licao'

/**
 * Divide o `conteudo` (HTML) da lição em páginas pelo marcador <hr>. A divisão acontece antes do
 * sanitizarHtml; trechos sem texto (só tags/espaços) são descartados.
 */
export function paginasTexto(conteudo: string | null): string[] {
  if (!conteudo) return []
  return conteudo
    .split(/<hr\s*\/?>/i)
    .filter((trecho) => trecho.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== '')
}

/** A lição tem algo para a etapa de conteúdo (texto ou vídeo)? Sem isso, vai direto para a atividade. */
export function temConteudo(licao: Pick<LicaoDetalhe, 'resumo' | 'conteudo' | 'videoId'>): boolean {
  return !!licao.resumo?.trim() || paginasTexto(licao.conteudo).length > 0 || !!licao.videoId
}
