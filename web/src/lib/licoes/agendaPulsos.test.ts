import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INTERVALO_PULSO_MS, criarAgendaPulsos, type ResultadoPulso } from './agendaPulsos'

/** Envio controlado: cada chamada fica pendente até `responder`. */
function envioControlado() {
  const pendentes: ((r: ResultadoPulso) => void)[] = []
  const enviar = vi.fn(() => new Promise<ResultadoPulso>((resolve) => pendentes.push(resolve)))
  const responder = async (r: ResultadoPulso = 'ok') => {
    pendentes.shift()?.(r)
    for (let i = 0; i < 5; i++) await Promise.resolve()
  }
  return { enviar, responder }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('agenda de pulsos', () => {
  it('tocar envia um pulso imediato e depois um a cada 10 s', async () => {
    const { enviar, responder } = envioControlado()
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    expect(enviar).toHaveBeenCalledTimes(1)
    await responder()
    vi.advanceTimersByTime(INTERVALO_PULSO_MS - 1)
    expect(enviar).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(enviar).toHaveBeenCalledTimes(2)
    await responder()
    vi.advanceTimersByTime(INTERVALO_PULSO_MS)
    expect(enviar).toHaveBeenCalledTimes(3)
    agenda.encerrar()
  })

  it('tocar de novo enquanto toca não duplica o intervalo', async () => {
    const { enviar, responder } = envioControlado()
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    await responder()
    agenda.tocando()
    expect(enviar).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(INTERVALO_PULSO_MS)
    expect(enviar).toHaveBeenCalledTimes(2)
    agenda.encerrar()
  })

  it('pausar envia um pulso extra e para os ticks', async () => {
    const { enviar, responder } = envioControlado()
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    await responder()
    vi.advanceTimersByTime(4_000)
    agenda.pausado()
    expect(enviar).toHaveBeenCalledTimes(2)
    await responder()
    vi.advanceTimersByTime(INTERVALO_PULSO_MS * 3)
    expect(enviar).toHaveBeenCalledTimes(2)
    // Pausar de novo (sem estar tocando) não envia nada.
    agenda.pausado()
    expect(enviar).toHaveBeenCalledTimes(2)
  })

  it('um pulso por vez: o tick com um pendente é descartado', async () => {
    const { enviar, responder } = envioControlado()
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    vi.advanceTimersByTime(INTERVALO_PULSO_MS * 2)
    expect(enviar).toHaveBeenCalledTimes(1)
    await responder()
    vi.advanceTimersByTime(INTERVALO_PULSO_MS)
    expect(enviar).toHaveBeenCalledTimes(2)
    agenda.encerrar()
  })

  it('terminar envia um pulso extra e para', async () => {
    const { enviar, responder } = envioControlado()
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    await responder()
    agenda.terminou()
    expect(enviar).toHaveBeenCalledTimes(2)
    await responder()
    vi.advanceTimersByTime(INTERVALO_PULSO_MS * 2)
    expect(enviar).toHaveBeenCalledTimes(2)
  })

  it('encerrar (trocar de página ou desmontar) envia o último pulso se tocando, limpa e ignora o resto', async () => {
    const { enviar, responder } = envioControlado()
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    await responder()
    agenda.encerrar()
    expect(enviar).toHaveBeenCalledTimes(2)
    await responder()
    expect(vi.getTimerCount()).toBe(0)
    agenda.tocando()
    vi.advanceTimersByTime(INTERVALO_PULSO_MS * 2)
    expect(enviar).toHaveBeenCalledTimes(2)

    // Encerrar sem estar tocando não envia nada.
    const outro = envioControlado()
    criarAgendaPulsos(outro.enviar).encerrar()
    expect(outro.enviar).not.toHaveBeenCalled()
  })

  it('conferido para de vez', async () => {
    const { enviar, responder } = envioControlado()
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    await responder('conferido')
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(INTERVALO_PULSO_MS * 2)
    agenda.pausado()
    agenda.tocando()
    expect(enviar).toHaveBeenCalledTimes(1)
  })

  it('404/422 ("parar") para de vez', async () => {
    const { enviar, responder } = envioControlado()
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    await responder('parar')
    vi.advanceTimersByTime(INTERVALO_PULSO_MS * 2)
    expect(enviar).toHaveBeenCalledTimes(1)
  })

  it('erro de rede continua no próximo tick (inclusive se a promessa rejeitar)', async () => {
    const enviar = vi
      .fn<() => Promise<ResultadoPulso>>()
      .mockResolvedValueOnce('erro')
      .mockRejectedValueOnce(new Error('rede'))
      .mockResolvedValue('ok')
    const agenda = criarAgendaPulsos(enviar)
    agenda.tocando()
    await vi.advanceTimersByTimeAsync(INTERVALO_PULSO_MS)
    await vi.advanceTimersByTimeAsync(INTERVALO_PULSO_MS)
    expect(enviar).toHaveBeenCalledTimes(3)
    agenda.encerrar()
  })
})
