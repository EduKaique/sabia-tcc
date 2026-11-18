import type { ModoAtividade } from '@/types'
import type {
  ConteudoImagemTexto,
  ConteudoTexto,
  EstadoLicaoProfessor,
  LicaoProfessorDetalhe,
  TipoPagina,
} from '@/types/licaoProfessor'

/** Mesmo limite do servidor (SalvarLicaoRequest). */
export const MAX_PAGINAS = 30

/** Tipos que o editor sabe editar nesta versão; os demais são preservados intactos. */
export const TIPOS_EDITAVEIS = ['TEXTO', 'IMAGEM_TEXTO'] as const
export type TipoEditavel = (typeof TIPOS_EDITAVEIS)[number]

export function paginaEditavel(tipo: TipoPagina): tipo is TipoEditavel {
  return (TIPOS_EDITAVEIS as readonly TipoPagina[]).includes(tipo)
}

export const ROTULO_TIPO: Record<TipoPagina, string> = {
  TEXTO: 'Texto',
  IMAGEM_TEXTO: 'Imagem e texto',
  VIDEO_YOUTUBE: 'Vídeo do YouTube',
  VIDEO_UPLOAD: 'Vídeo enviado',
  QUESTIONARIO: 'Questionário',
}

/**
 * Página no editor. `chave` é estável para o React: "s-<id>" para páginas do servidor e "n-<n>" para as novas.
 * `conteudo` das páginas não editáveis é o objeto recebido do servidor e nunca é alterado.
 */
export interface PaginaEditor {
  chave: string
  id?: number
  tipo: TipoPagina
  titulo: string
  conteudo: unknown
}

export interface MetadadosLicao {
  titulo: string
  conceito: string
  resumo: string
}

export interface EstadoEditor {
  licaoId: number | null
  estadoPublicacao: EstadoLicaoProfessor | null
  metadados: MetadadosLicao
  modo: ModoAtividade
  cenarioJson: string | null
  turmaIds: number[]
  paginas: PaginaEditor[]
  /** Há mudança local ainda não salva. */
  sujo: boolean
  /** Contador das chaves temporárias das páginas novas. */
  proximaChave: number
  /** Muda a cada carga do servidor: usado como key de componentes que inicializam a partir do estado. */
  versao: number
}

export type AcaoEditor =
  | { tipo: 'carregar'; detalhe: LicaoProfessorDetalhe; manterTurmas?: boolean }
  | { tipo: 'sincronizarPublicacao'; estadoPublicacao: EstadoLicaoProfessor }
  | { tipo: 'adicionarPagina'; tipoPagina: TipoEditavel }
  | { tipo: 'removerPagina'; chave: string }
  | { tipo: 'moverPagina'; chave: string; direcao: -1 | 1 }
  | { tipo: 'atualizarPagina'; chave: string; titulo?: string; conteudo?: Partial<ConteudoTexto & ConteudoImagemTexto> }
  | { tipo: 'atualizarMetadados'; metadados: Partial<MetadadosLicao> }
  | { tipo: 'trocarModo'; modo: ModoAtividade }
  | { tipo: 'trocarCenario'; cenarioJson: string | null }
  | { tipo: 'trocarTurmas'; turmaIds: number[] }

export function estadoInicialEditor(): EstadoEditor {
  return {
    licaoId: null,
    estadoPublicacao: null,
    metadados: { titulo: '', conceito: '', resumo: '' },
    modo: 'BLOCOS',
    cenarioJson: null,
    turmaIds: [],
    paginas: [],
    sujo: false,
    proximaChave: 1,
    versao: 0,
  }
}

function conteudoVazio(tipo: TipoEditavel): ConteudoTexto | ConteudoImagemTexto {
  return tipo === 'TEXTO' ? { html: '' } : { imagemUrl: '', alt: '', legenda: '', html: '' }
}

export function editorReducer(estado: EstadoEditor, acao: AcaoEditor): EstadoEditor {
  switch (acao.tipo) {
    case 'carregar': {
      const d = acao.detalhe
      return {
        ...estado,
        licaoId: d.id,
        estadoPublicacao: d.estado,
        metadados: { titulo: d.titulo, conceito: d.conceito, resumo: d.resumo ?? '' },
        modo: d.modo,
        cenarioJson: d.cenarioJson,
        turmaIds: acao.manterTurmas ? estado.turmaIds : [...d.turmaIds],
        paginas: [...d.paginas]
          .sort((a, b) => a.ordem - b.ordem)
          .map((p) => ({ chave: `s-${p.id}`, id: p.id, tipo: p.tipo, titulo: p.titulo ?? '', conteudo: p.conteudo })),
        sujo: !!acao.manterTurmas,
        versao: estado.versao + 1,
      }
    }
    case 'sincronizarPublicacao':
      return { ...estado, estadoPublicacao: acao.estadoPublicacao }
    case 'adicionarPagina': {
      if (estado.paginas.length >= MAX_PAGINAS) return estado
      const nova: PaginaEditor = {
        chave: `n-${estado.proximaChave}`,
        tipo: acao.tipoPagina,
        titulo: '',
        conteudo: conteudoVazio(acao.tipoPagina),
      }
      return { ...estado, paginas: [...estado.paginas, nova], proximaChave: estado.proximaChave + 1, sujo: true }
    }
    case 'removerPagina': {
      const paginas = estado.paginas.filter((p) => p.chave !== acao.chave)
      return paginas.length === estado.paginas.length ? estado : { ...estado, paginas, sujo: true }
    }
    case 'moverPagina': {
      const i = estado.paginas.findIndex((p) => p.chave === acao.chave)
      const j = i + acao.direcao
      if (i < 0 || j < 0 || j >= estado.paginas.length) return estado
      const paginas = [...estado.paginas]
      ;[paginas[i], paginas[j]] = [paginas[j], paginas[i]]
      return { ...estado, paginas, sujo: true }
    }
    case 'atualizarPagina': {
      let mudou = false
      const paginas = estado.paginas.map((p) => {
        // Páginas de tipos ainda não editáveis voltam ao servidor exatamente como vieram.
        if (p.chave !== acao.chave || !paginaEditavel(p.tipo)) return p
        mudou = true
        return {
          ...p,
          titulo: acao.titulo ?? p.titulo,
          conteudo: acao.conteudo ? { ...(p.conteudo as object), ...acao.conteudo } : p.conteudo,
        }
      })
      return mudou ? { ...estado, paginas, sujo: true } : estado
    }
    case 'atualizarMetadados':
      return { ...estado, metadados: { ...estado.metadados, ...acao.metadados }, sujo: true }
    case 'trocarModo':
      return acao.modo === estado.modo ? estado : { ...estado, modo: acao.modo, sujo: true }
    case 'trocarCenario':
      return acao.cenarioJson === estado.cenarioJson ? estado : { ...estado, cenarioJson: acao.cenarioJson, sujo: true }
    case 'trocarTurmas':
      return { ...estado, turmaIds: [...new Set(acao.turmaIds)].sort((a, b) => a - b), sujo: true }
  }
}

export interface ItemProntidao {
  ok: boolean
  texto: string
}

/** Checklist mostrado antes de publicar. O servidor continua sendo a autoridade (422). */
export function prontidaoPublicacao(estado: EstadoEditor): ItemProntidao[] {
  const itens: ItemProntidao[] = [{ ok: estado.paginas.length > 0, texto: 'Ao menos uma página de conteúdo' }]
  if (estado.modo === 'JOGO_ROBO') {
    itens.push({ ok: !!estado.cenarioJson, texto: 'Cenário do Jogo do Robô escolhido' })
  }
  return itens
}
