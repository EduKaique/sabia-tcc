/**
 * Regras das páginas de vídeo do YouTube, espelhadas do servidor (YoutubeUrl, ValidadorConteudoPagina e
 * ProgressoLicaoRegras).
 */

export const DURACAO_MIN = 10
export const DURACAO_MAX = 10_800
/** Porcentagem do vídeo que o aluno precisa assistir (ProgressoLicaoRegras.PERCENTUAL_MINIMO_VIDEO). */
export const PERCENTUAL_MINIMO_VIDEO = 70
/** Tamanho máximo do texto enviado em "videoId" (o servidor aceita URL ou id). */
export const MAX_ENTRADA_VIDEO = 500
export const MAX_TITULO_VIDEO = 255

/**
 * Conteúdo da página de vídeo no editor. `duracaoSegundos` pode ser o texto digitado no campo (validado antes de
 * salvar) ou o número vindo do servidor ou lido do player.
 */
export interface ConteudoVideoEditor {
  videoId: string
  titulo?: string
  canal?: string
  duracaoSegundos?: number | string
}

const ID = /^[A-Za-z0-9_-]{11}$/
const HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])
const HOST_CURTO = 'youtu.be'
const PREFIXOS = new Set(['embed', 'shorts', 'live'])
// esquema://autoridade caminho ?query #fragmento
const URL_PARTES = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?(?:#.*)?$/

function segmentos(caminho: string): string[] {
  const limpo = caminho.replace(/^\/+|\/+$/g, '')
  if (!limpo) return []
  try {
    return limpo.split('/').map((s) => decodeURIComponent(s))
  } catch {
    return limpo.split('/')
  }
}

function parametroV(query: string | undefined): string | null {
  if (query == null) return null
  for (const par of query.split('&')) {
    if (par.startsWith('v=')) return par.substring(2)
  }
  return null
}

/**
 * Id do vídeo (11 caracteres [A-Za-z0-9_-]) a partir do id puro ou de uma URL https de um host conhecido do
 * YouTube: /watch?v=, /embed/{id}, /shorts/{id}, /live/{id} e youtu.be/{id}. Recusa http, porta, credencial
 * (user@host), host parecido e segmento extra depois do id. Mesmas regras de YoutubeUrl.extrairId no servidor;
 * o parse é manual porque o URL do navegador apagaria uma porta :443 explícita, que o servidor recusa.
 */
export function extrairIdYoutube(entrada: string | null | undefined): string | null {
  if (entrada == null) return null
  const valor = entrada.trim()
  if (ID.test(valor)) return valor
  if (/\s/.test(valor)) return null

  const m = URL_PARTES.exec(valor)
  if (!m) return null
  const [, esquema, autoridade, caminho, query] = m
  if (esquema.toLowerCase() !== 'https' || !autoridade || autoridade.includes('@') || autoridade.includes(':')) {
    return null
  }
  const host = autoridade.toLowerCase()
  const partes = segmentos(caminho)

  let id: string | null = null
  if (host === HOST_CURTO) {
    if (partes.length === 1) id = partes[0]
  } else if (HOSTS.has(host)) {
    if (partes.length === 1 && partes[0] === 'watch') id = parametroV(query)
    else if (partes.length === 2 && PREFIXOS.has(partes[0])) id = partes[1]
  }
  return id != null && ID.test(id) ? id : null
}

/** "m:ss" abaixo de uma hora e "h:mm:ss" a partir de uma hora. */
export function formatarDuracao(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = s.toString().padStart(2, '0')
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** Segundos que o aluno precisa assistir: ceil(70% da duração), com a mesma conta inteira do servidor. */
export function segundosNecessarios(duracao: number): number {
  return Math.floor((duracao * PERCENTUAL_MINIMO_VIDEO + 99) / 100)
}

/**
 * Lê a duração do estado do editor: `null` se vazia, o número se for um inteiro entre 10 e 10800, ou
 * `'invalida'` (texto, decimal ou fora dos limites).
 */
export function lerDuracao(valor: number | string | null | undefined): number | null | 'invalida' {
  if (valor == null) return null
  const texto = String(valor).trim()
  if (texto === '') return null
  if (!/^\d+$/.test(texto)) return 'invalida'
  const n = Number(texto)
  return n >= DURACAO_MIN && n <= DURACAO_MAX ? n : 'invalida'
}
