// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PainelRelatorioIa } from '@/components/professor/submissoes/PainelRelatorioIa'
import { AVISO_RELATORIO_ROBO } from '@/lib/relatorioIaRobo'

// Só a exibição é testada: os hooks de rede viram mutations paradas.
const mutacaoParada = { mutate: vi.fn(), isPending: false, isError: false, error: null }
vi.mock('@/hooks/useRevisarSubmissaoIa', () => ({ useRevisarSubmissaoIa: () => mutacaoParada }))
vi.mock('@/hooks/useRelatorioIaSubmissao', () => ({
  useSalvarRelatorioIa: () => mutacaoParada,
  useRemoverRelatorioIa: () => mutacaoParada,
}))

afterEach(cleanup)

const SALVO = JSON.stringify({ resumo: 'Chegou ao destino.', notaSugerida: 9, acertos: ['Usou repetir'], erros: [] })

describe('PainelRelatorioIa', () => {
  it('no robô mostra o aviso fixo e não mostra a nota sugerida', () => {
    render(<PainelRelatorioIa submissaoId="1" relatorioIaPreGeradoJson={SALVO} payload={null} modoRobo />)

    expect(screen.getByText(AVISO_RELATORIO_ROBO)).toBeTruthy()
    expect(screen.queryByText('Nota sugerida')).toBeNull()
  })

  it('nos blocos mostra a nota sugerida e não mostra o aviso', () => {
    render(<PainelRelatorioIa submissaoId="1" relatorioIaPreGeradoJson={SALVO} payload={null} />)

    expect(screen.getByText('Nota sugerida')).toBeTruthy()
    expect(screen.queryByText(AVISO_RELATORIO_ROBO)).toBeNull()
  })

  it('indisponível desabilita o botão e mostra o motivo', () => {
    render(
      <PainelRelatorioIa
        submissaoId="1"
        relatorioIaPreGeradoJson={null}
        payload={null}
        modoRobo
        indisponivel="Sem análise."
      />,
    )

    expect(screen.getByText('Sem análise.')).toBeTruthy()
    const botao = screen.getByRole('button', { name: 'Gerar relatório com IA' }) as HTMLButtonElement
    expect(botao.disabled).toBe(true)
  })
})
