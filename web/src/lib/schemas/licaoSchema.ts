import { z } from 'zod'
import { htmlVazio } from '@/lib/licoes/payloadLicao'
import { paginaEditavel, type EstadoEditor } from '@/lib/licoes/editorLicao'
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
  altMax: 200,
  legendaMax: 200,
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
    .max(L.urlMax, `O endereço deve ter no máximo ${L.urlMax} caracteres.`)
    .refine(urlHttps, 'Informe um endereço de imagem que comece com https://.'),
  alt: z
    .string()
    .trim()
    .min(1, 'Descreva a imagem (texto alternativo).')
    .max(L.altMax, `O texto alternativo deve ter no máximo ${L.altMax} caracteres.`),
  legenda: z.string().trim().max(L.legendaMax, `A legenda deve ter no máximo ${L.legendaMax} caracteres.`),
  html: z.string().refine((h) => h.length <= L.htmlImagemMax, `O texto deve ter no máximo ${L.htmlImagemMax} caracteres.`),
})

export interface ErrosEditor {
  metadados: Partial<Record<'titulo' | 'conceito' | 'resumo', string>>
  /** Por chave da página: { campo: mensagem } com os mesmos nomes de campo do servidor. */
  paginas: Record<string, Record<string, string>>
}

function errosDe(resultado: z.SafeParseReturnType<unknown, unknown>): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!resultado.success) {
    for (const issue of resultado.error.issues) {
      const campo = String(issue.path[0])
      erros[campo] ??= issue.message
    }
  }
  return erros
}

/** Validação do editor inteiro antes do PUT. Páginas de tipos não editáveis não são conferidas aqui. */
export function validarLicaoEditor(estado: EstadoEditor): ErrosEditor & { ok: boolean } {
  const metadados = errosDe(metadadosLicaoSchema.safeParse(estado.metadados))
  const paginas: ErrosEditor['paginas'] = {}
  for (const p of estado.paginas) {
    if (!paginaEditavel(p.tipo)) continue
    const erros =
      p.tipo === 'TEXTO'
        ? errosDe(paginaTextoSchema.safeParse({ titulo: p.titulo, html: (p.conteudo as ConteudoTexto).html ?? '' }))
        : errosDe(
            paginaImagemSchema.safeParse({
              titulo: p.titulo,
              imagemUrl: (p.conteudo as ConteudoImagemTexto).imagemUrl ?? '',
              alt: (p.conteudo as ConteudoImagemTexto).alt ?? '',
              legenda: (p.conteudo as ConteudoImagemTexto).legenda ?? '',
              html: (p.conteudo as ConteudoImagemTexto).html ?? '',
            })
          )
    if (Object.keys(erros).length > 0) paginas[p.chave] = erros
  }
  const ok = Object.keys(metadados).length === 0 && Object.keys(paginas).length === 0
  return { metadados, paginas, ok }
}
