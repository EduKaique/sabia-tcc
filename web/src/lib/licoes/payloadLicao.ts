import type { ConteudoImagemTexto, ConteudoTexto, PaginaLicaoPayload, SalvarLicaoPayload } from '@/types/licaoProfessor'
import { paginaEditavel, type EstadoEditor, type PaginaEditor } from './editorLicao'
import type { ConteudoQuestionarioEditor } from './questionario'
import { lerDuracao, type ConteudoVideoEditor } from './youtube'

/** HTML do editor sem texto visível (ex.: "<p></p>" do TipTap vazio). */
export function htmlVazio(html: string | null | undefined): boolean {
  if (!html) return true
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === ''
}

function conteudoDaPagina(p: PaginaEditor): unknown {
  if (p.tipo === 'TEXTO') {
    const c = p.conteudo as ConteudoTexto
    return { html: c.html ?? '' }
  }
  if (p.tipo === 'IMAGEM_TEXTO') {
    const c = p.conteudo as ConteudoImagemTexto
    const conteudo: ConteudoImagemTexto = { imagemUrl: (c.imagemUrl ?? '').trim(), alt: (c.alt ?? '').trim() }
    if (c.legenda?.trim()) conteudo.legenda = c.legenda.trim()
    if (!htmlVazio(c.html)) conteudo.html = c.html
    return conteudo
  }
  if (p.tipo === 'VIDEO_YOUTUBE') {
    const c = p.conteudo as ConteudoVideoEditor
    // O texto digitado vai como está (aparado): o servidor extrai e grava só o id.
    const conteudo: Record<string, unknown> = { videoId: (c.videoId ?? '').trim() }
    if (c.titulo?.trim()) conteudo.titulo = c.titulo.trim()
    if (c.canal?.trim()) conteudo.canal = c.canal.trim()
    const duracao = lerDuracao(c.duracaoSegundos)
    if (duracao !== null) conteudo.duracaoSegundos = duracao === 'invalida' ? c.duracaoSegundos : duracao
    return conteudo
  }
  if (p.tipo === 'QUESTIONARIO') {
    const c = p.conteudo as ConteudoQuestionarioEditor
    return {
      percentualMinimo: c.percentualMinimo,
      perguntas: (c.perguntas ?? []).map((q) => ({
        enunciado: (q.enunciado ?? '').trim(),
        alternativas: (q.alternativas ?? []).map((a) => (a ?? '').trim()),
        // A validação do cliente exige a certa; −1 seria recusado pelo servidor, nunca gravado.
        correta: q.correta ?? -1,
      })),
    }
  }
  // Upload de vídeo: o objeto recebido do servidor, sem tocar.
  return p.conteudo
}

function paginaParaPayload(p: PaginaEditor): PaginaLicaoPayload {
  const pagina: PaginaLicaoPayload = {
    tipo: p.tipo,
    titulo: p.titulo.trim() || null,
    conteudo: paginaEditavel(p.tipo) ? conteudoDaPagina(p) : p.conteudo,
  }
  // Sem id o servidor cria a página; com id, atualiza. A que faltar na lista é apagada.
  return p.id != null ? { id: p.id, ...pagina } : pagina
}

/** Corpo do PUT /api/professor/licoes/{id}: estado completo, páginas na ordem da lista. */
export function montarPayload(estado: EstadoEditor): SalvarLicaoPayload {
  const resumo = estado.metadados.resumo.trim()
  return {
    titulo: estado.metadados.titulo.trim(),
    conceito: estado.metadados.conceito.trim(),
    resumo: resumo || null,
    modo: estado.modo,
    // Em BLOCOS o servidor ignora o cenário; mandamos nulo para não sugerir o contrário.
    cenarioJson: estado.modo === 'JOGO_ROBO' ? estado.cenarioJson : null,
    paginas: estado.paginas.map(paginaParaPayload),
  }
}
