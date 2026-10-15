import type { StaticImageData } from 'next/image'

/** Ids aceitos pelo backend (auth-service, AvatarCatalogo). */
export const AVATAR_IDS = [
  'sabia-azul',
  'sabia-laranja',
  'sabia-verde',
  'sabia-amarelo',
  'sabia-roxo',
  'sabia-rosa',
  'sabia-vermelho',
  'sabia-turquesa',
] as const

export type AvatarId = (typeof AVATAR_IDS)[number]

export interface Avatar {
  id: AvatarId
  /** Rótulo acessível, lido por leitores de tela. */
  rotulo: string
  /** Cor do sabiá provisório (SVG). */
  cor: string
  /** Imagem final. Enquanto for null, a UI desenha o sabiá provisório em SVG. */
  imagem: StaticImageData | null
}

/**
 * Catálogo de avatares — ponto ÚNICO de troca.
 * Quando as artes finais existirem, coloque-as em src/public/images/avatares/<id>.png,
 * importe aqui (ex.: `import sabiaAzul from '@/public/images/avatares/sabia-azul.png'`)
 * e preencha `imagem`. O componente AvatarSabia passa a usá-las sem mudanças na UI.
 */
export const AVATARES: readonly Avatar[] = [
  { id: 'sabia-azul', rotulo: 'Sabiá azul', cor: '#426cda', imagem: null },
  { id: 'sabia-laranja', rotulo: 'Sabiá laranja', cor: '#fe7629', imagem: null },
  { id: 'sabia-verde', rotulo: 'Sabiá verde', cor: '#60bb75', imagem: null },
  { id: 'sabia-amarelo', rotulo: 'Sabiá amarelo', cor: '#f9bd15', imagem: null },
  { id: 'sabia-roxo', rotulo: 'Sabiá roxo', cor: '#8d4ce6', imagem: null },
  { id: 'sabia-rosa', rotulo: 'Sabiá rosa', cor: '#ef6aa8', imagem: null },
  { id: 'sabia-vermelho', rotulo: 'Sabiá vermelho', cor: '#e5484d', imagem: null },
  { id: 'sabia-turquesa', rotulo: 'Sabiá turquesa', cor: '#20b2aa', imagem: null },
]

export function isAvatarId(id: string): id is AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(id)
}

export function buscarAvatar(id: string): Avatar | undefined {
  return AVATARES.find((a) => a.id === id)
}
