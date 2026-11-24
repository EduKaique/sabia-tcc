import type { EstadoLicaoProfessor } from '@/types/licaoProfessor'
import type { ModoAtividade } from '@/types'

export const ROTULO_ESTADO: Record<EstadoLicaoProfessor, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADA: 'Publicada',
  ARQUIVADA: 'Arquivada',
}

export const VARIANTE_ESTADO: Record<EstadoLicaoProfessor, 'secondary' | 'default' | 'outline'> = {
  RASCUNHO: 'secondary',
  PUBLICADA: 'default',
  ARQUIVADA: 'outline',
}

export const ROTULO_MODO: Record<ModoAtividade, string> = {
  BLOCOS: 'Blocos livres',
  JOGO_ROBO: 'Jogo do Robô',
}

/** Datas do servidor vêm em UTC sem fuso (LocalDateTime). */
export function formatarDataUtc(iso: string | null): string {
  if (!iso) return '—'
  const comFuso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`
  const data = new Date(comFuso)
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR')
}
