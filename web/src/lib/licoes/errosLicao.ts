import type { ErroApi } from '@/types'
import type { PaginaEditor } from './editorLicao'

export interface ErroLicao {
  status: number | null
  mensagem: string
  campos?: Record<string, string>
}

const MENSAGEM_PADRAO = 'Não foi possível concluir a operação. Tente novamente.'

/** Lê o ErroResponse do servidor a partir de um erro do axios. */
export function extrairErro(err: unknown): ErroLicao {
  const resposta = (err as { response?: { status?: number; data?: Partial<ErroApi> } })?.response
  if (!resposta) return { status: null, mensagem: 'Sem conexão com o servidor. Tente novamente.' }
  const data = resposta.data ?? {}
  const campos = data.campos && Object.keys(data.campos).length > 0 ? data.campos : undefined
  const mensagem =
    resposta.status === 403
      ? 'Você não tem acesso a esta lição.'
      : resposta.status === 404
        ? 'Lição não encontrada.'
        : (data.erro ?? MENSAGEM_PADRAO)
  return { status: resposta.status ?? null, mensagem, campos }
}

export type CampoMetadado = 'titulo' | 'conceito' | 'resumo'
const CAMPOS_METADADOS: readonly string[] = ['titulo', 'conceito', 'resumo']

export interface ErrosSeparados {
  /** Por chave da página: { campo: mensagem }, com campo como "html", "alt", "titulo"... */
  paginas: Record<string, Record<string, string>>
  metadados: Partial<Record<CampoMetadado, string>>
  /** Mensagens sem lugar próprio (ex.: "paginas" acima de 30 ou de 256 KB, "modo"). */
  gerais: string[]
}

const CHAVE_PAGINA = /^paginas\[(\d+)\]\.(.+)$/

/**
 * Distribui os `campos` de um 400 do PUT. "paginas[i].campo" usa o índice da lista enviada, que é a ordem de
 * `paginas` no momento do envio.
 */
export function separarErros(campos: Record<string, string> | undefined, paginas: PaginaEditor[]): ErrosSeparados {
  const separados: ErrosSeparados = { paginas: {}, metadados: {}, gerais: [] }
  for (const [chave, mensagem] of Object.entries(campos ?? {})) {
    const m = CHAVE_PAGINA.exec(chave)
    const pagina = m ? paginas[Number(m[1])] : undefined
    if (m && pagina) {
      separados.paginas[pagina.chave] = { ...separados.paginas[pagina.chave], [m[2]]: mensagem }
    } else if (CAMPOS_METADADOS.includes(chave)) {
      separados.metadados[chave as CampoMetadado] = mensagem
    } else {
      separados.gerais.push(mensagem)
    }
  }
  return separados
}

/**
 * O erro pertence à seção Prática? No salvamento, o 400 sem `campos` é o do validador de cenário; na
 * publicação, os 422 que falam do cenário do robô.
 */
export function erroDaPratica(erro: ErroLicao, operacao: 'salvar' | 'publicar'): boolean {
  if (operacao === 'salvar') return erro.status === 400 && !erro.campos
  return erro.status === 422 && /cen[aá]rio/i.test(erro.mensagem)
}
