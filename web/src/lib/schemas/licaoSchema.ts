import { z } from 'zod'
import { lerDuracao } from '@/lib/licoes/youtube'
import { htmlVazio } from '@/lib/licoes/payloadLicao'
import { paginaEditavel, type EstadoEditor } from '@/lib/licoes/editorLicao'
import { LIMITES_QUESTIONARIO, type ConteudoQuestionarioEditor } from '@/lib/licoes/questionario'
import {
  DURACAO_MAX,
  DURACAO_MIN,
  MAX_ENTRADA_VIDEO,
  MAX_TITULO_VIDEO,
  extrairIdYoutube,
  type ConteudoVideoEditor,
} from '@/lib/licoes/youtube'
import type { ConteudoImagemTexto, ConteudoTexto } from '@/types/licaoProfessor'

/** Limites espelhados do servidor (CriarLicaoRequest, SalvarLicaoRequest, ValidadorConteudoPagina). */
export const LIMITES_LICAO = {
  tituloMin: 3,
  tituloMax: 255,
  conceitoMax: 255,
  resumoMax: 2000,
  tituloPaginaMax: 150,
  htmlTextoMax: 20_000,
  htmlImagemMax: 10_000,
  urlMax: 500,
  dataUriMax: 20_000,
  altMax: 200,
  legendaMax: 200,
  entradaVideoMax: MAX_ENTRADA_VIDEO,
  tituloVideoMax: MAX_TITULO_VIDEO,
  duracaoMin: DURACAO_MIN,
  duracaoMax: DURACAO_MAX,
  ...LIMITES_QUESTIONARIO,
} as const
const L = LIMITES_LICAO

/** O servidor apara os textos antes de conferir o tamanho; aqui também. */
export const metadadosLicaoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(L.tituloMin, `O título deve ter entre ${L.tituloMin} e ${L.tituloMax} caracteres.`)
    .max(L.tituloMax, `O título deve ter entre ${L.tituloMin} e ${L.tituloMax} caracteres.`),
  conceito: z
    .string()
    .trim()
    .min(1, 'O tema é obrigatório.')
    .max(L.conceitoMax, `O tema deve ter no máximo ${L.conceitoMax} caracteres.`),
  resumo: z.string().trim().max(L.resumoMax, `A descrição deve ter no máximo ${L.resumoMax} caracteres.`).optional(),
})

export const novaLicaoSchema = metadadosLicaoSchema
export type NovaLicaoForm = z.input<typeof novaLicaoSchema>

/** Imagem raster embutida (data URI), como o servidor (ValidadorConteudoPagina.DATA_URI_IMAGEM). */
export function urlDataImagem(url: string): boolean {
  return /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(url)
}

/** https com host e sem espaços, como o servidor (ValidadorConteudoPagina.https). */
export function urlHttps(url: string): boolean {
  if (/\s/.test(url)) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && !!u.hostname
  } catch {
    return false
  }
}

const tituloPagina = z
  .string()
  .trim()
  .max(L.tituloPaginaMax, `O título da página deve ter no máximo ${L.tituloPaginaMax} caracteres.`)

export const paginaTextoSchema = z.object({
  titulo: tituloPagina,
  html: z
    .string()
    .refine((h) => !htmlVazio(h), 'Escreva o texto da página.')
    .refine((h) => h.length <= L.htmlTextoMax, `O texto deve ter no máximo ${L.htmlTextoMax} caracteres.`),
})

export const paginaImagemSchema = z.object({
  titulo: tituloPagina,
  imagemUrl: z
    .string()
    .trim()
    .min(1, 'Informe o endereço da imagem.')
    .max(L.dataUriMax, `O endereço deve ter no máximo ${L.urlMax} caracteres.`)
    .refine((u) => urlDataImagem(u) || u.length <= L.urlMax, `O endereço deve ter no máximo ${L.urlMax} caracteres.`)
    .refine((u) => urlDataImagem(u) || urlHttps(u), 'Informe um endereço de imagem que comece com https://.'),
  alt: z
    .string()
    .trim()
    .min(1, 'Descreva a imagem (texto alternativo).')
    .max(L.altMax, `O texto alternativo deve ter no máximo ${L.altMax} caracteres.`),
  legenda: z.string().trim().max(L.legendaMax, `A legenda deve ter no máximo ${L.legendaMax} caracteres.`),
  html: z.string().refine((h) => h.length <= L.htmlImagemMax, `O texto deve ter no máximo ${L.htmlImagemMax} caracteres.`),
})

export const MENSAGEM_VIDEO_INVALIDO = 'Informe um link do YouTube válido (https) ou o id do vídeo.'
const MENSAGEM_DURACAO = `A duração deve ser um número inteiro de segundos entre ${L.duracaoMin} e ${L.duracaoMax}.`

/**
 * Página VIDEO_YOUTUBE. O título do vídeo usa a chave "tituloVideo" para não se misturar ao título da página
 * (no servidor os dois voltam como "paginas[i].titulo").
 */
export const paginaVideoSchema = z.object({
  titulo: tituloPagina,
  videoId: z
    .string()
    .trim()
    .min(1, 'Informe o link ou o código do vídeo.')
    .max(L.entradaVideoMax, `O link deve ter no máximo ${L.entradaVideoMax} caracteres.`)
    .refine((v) => extrairIdYoutube(v) !== null, MENSAGEM_VIDEO_INVALIDO),
  tituloVideo: z
    .string()
    .trim()
    .max(L.tituloVideoMax, `O título do vídeo deve ter no máximo ${L.tituloVideoMax} caracteres.`),
  canal: z.string().trim().max(L.tituloVideoMax, `O canal deve ter no máximo ${L.tituloVideoMax} caracteres.`),
  // Opcional no rascunho; publicar exige (o servidor confere).
  duracaoSegundos: z
    .union([z.string(), z.number()])
    .optional()
    .refine((v) => lerDuracao(v) !== 'invalida', MENSAGEM_DURACAO),
})

const perguntaSchema = z.object({
  enunciado: z
    .string()
    .trim()
    .min(1, 'Escreva a pergunta.')
    .max(L.enunciadoMax, `A pergunta deve ter no máximo ${L.enunciadoMax} caracteres.`),
  alternativas: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'A alternativa não pode ficar vazia.')
        .max(L.alternativaMax, `A alternativa deve ter no máximo ${L.alternativaMax} caracteres.`)
    )
    .min(L.minAlternativas, `Cada pergunta deve ter de ${L.minAlternativas} a ${L.maxAlternativas} alternativas.`)
    .max(L.maxAlternativas, `Cada pergunta deve ter de ${L.minAlternativas} a ${L.maxAlternativas} alternativas.`),
  correta: z.number({ invalid_type_error: 'Escolha a alternativa certa.', required_error: 'Escolha a alternativa certa.' }).int(),
})

/** Página QUESTIONARIO (escolha única). */
export const paginaQuestionarioSchema = z.object({
  titulo: tituloPagina,
  percentualMinimo: z
    .number({
      invalid_type_error: 'O percentual mínimo deve ficar entre 0 e 100.',
      required_error: 'O percentual mínimo deve ficar entre 0 e 100.',
    })
    .int('O percentual mínimo deve ser um número inteiro.')
    .min(0, 'O percentual mínimo deve ficar entre 0 e 100.')
    .max(100, 'O percentual mínimo deve ficar entre 0 e 100.'),
  perguntas: z
    .array(perguntaSchema)
    .min(L.minPerguntas, `O questionário deve ter de ${L.minPerguntas} a ${L.maxPerguntas} perguntas.`)
    .max(L.maxPerguntas, `O questionário deve ter de ${L.minPerguntas} a ${L.maxPerguntas} perguntas.`),
})

export interface ErrosEditor {
  metadados: Partial<Record<'titulo' | 'conceito' | 'resumo', string>>
  /** Por chave da página: { campo: mensagem } com os mesmos nomes de campo do servidor. */
  paginas: Record<string, Record<string, string>>
}

/** Caminho do zod como chave do servidor: ["perguntas", 0, "alternativas", 1] → "perguntas[0].alternativas[1]". */
export function chaveDoCaminho(caminho: (string | number)[]): string {
  return caminho.reduce<string>(
    (chave, parte) => (typeof parte === 'number' ? `${chave}[${parte}]` : chave ? `${chave}.${parte}` : parte),
    ''
  )
}

function errosDe(resultado: z.SafeParseReturnType<unknown, unknown>): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!resultado.success) {
    for (const issue of resultado.error.issues) {
      erros[chaveDoCaminho(issue.path)] ??= issue.message
    }
  }
  return erros
}

function errosDaPagina(p: EstadoEditor['paginas'][number]): Record<string, string> {
  switch (p.tipo) {
    case 'TEXTO':
      return errosDe(paginaTextoSchema.safeParse({ titulo: p.titulo, html: (p.conteudo as ConteudoTexto).html ?? '' }))
    case 'IMAGEM_TEXTO': {
      const c = p.conteudo as ConteudoImagemTexto
      return errosDe(
        paginaImagemSchema.safeParse({
          titulo: p.titulo,
          imagemUrl: c.imagemUrl ?? '',
          alt: c.alt ?? '',
          legenda: c.legenda ?? '',
          html: c.html ?? '',
        })
      )
    }
    case 'VIDEO_YOUTUBE': {
      const c = p.conteudo as ConteudoVideoEditor
      return errosDe(
        paginaVideoSchema.safeParse({
          titulo: p.titulo,
          videoId: c.videoId ?? '',
          tituloVideo: c.titulo ?? '',
          canal: c.canal ?? '',
          duracaoSegundos: c.duracaoSegundos,
        })
      )
    }
    case 'QUESTIONARIO': {
      const c = p.conteudo as ConteudoQuestionarioEditor
      return errosDe(
        paginaQuestionarioSchema.safeParse({
          titulo: p.titulo,
          percentualMinimo: c.percentualMinimo,
          perguntas: c.perguntas ?? [],
        })
      )
    }
    default:
      return {}
  }
}

/** Validação do editor inteiro antes do PUT. Páginas de tipos não editáveis não são conferidas aqui. */
export function validarLicaoEditor(estado: EstadoEditor): ErrosEditor & { ok: boolean } {
  const metadados = errosDe(metadadosLicaoSchema.safeParse(estado.metadados))
  const paginas: ErrosEditor['paginas'] = {}
  for (const p of estado.paginas) {
    if (!paginaEditavel(p.tipo)) continue
    const erros = errosDaPagina(p)
    if (Object.keys(erros).length > 0) paginas[p.chave] = erros
  }
  const ok = Object.keys(metadados).length === 0 && Object.keys(paginas).length === 0
  return { metadados, paginas, ok }
}
