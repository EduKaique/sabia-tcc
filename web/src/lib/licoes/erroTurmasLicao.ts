import type { LicaoProfessorDetalhe } from '@/types/licaoProfessor'

/**
 * O PUT da lição deu certo, mas o PUT das turmas falhou. Leva o detalhe já salvo: o editor precisa dele para
 * as páginas novas ganharem id (sem isso, salvar de novo as criaria em dobro).
 */
export class ErroTurmasLicao extends Error {
  readonly licaoSalva: LicaoProfessorDetalhe
  readonly causa: unknown

  constructor(licaoSalva: LicaoProfessorDetalhe, causa: unknown) {
    super('Falha ao vincular as turmas da lição.')
    this.name = 'ErroTurmasLicao'
    this.licaoSalva = licaoSalva
    this.causa = causa
  }
}
