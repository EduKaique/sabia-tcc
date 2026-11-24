// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const scripts = () => document.head.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')

async function carregador() {
  vi.resetModules()
  return import('./carregadorYoutube')
}

beforeEach(() => {
  delete window.YT
  delete window.onYouTubeIframeAPIReady
  document.head.innerHTML = ''
})

afterEach(() => {
  vi.useRealTimers()
})

describe('carregarApiYoutube', () => {
  it('injeta o script uma única vez para vários players e resolve todos no ready', async () => {
    const { carregarApiYoutube } = await carregador()
    const a = carregarApiYoutube()
    const b = carregarApiYoutube()
    expect(a).toBe(b)
    expect(scripts()).toHaveLength(1)

    const Player = vi.fn()
    window.YT = { Player } as never
    window.onYouTubeIframeAPIReady?.()
    await expect(a).resolves.toBe(window.YT)
    await expect(b).resolves.toBe(window.YT)

    // Com a API já presente, não injeta de novo.
    await expect(carregarApiYoutube()).resolves.toBe(window.YT)
    expect(scripts()).toHaveLength(1)
  })

  it('preserva um onYouTubeIframeAPIReady anterior', async () => {
    const anterior = vi.fn()
    window.onYouTubeIframeAPIReady = anterior
    const { carregarApiYoutube } = await carregador()
    const p = carregarApiYoutube()
    window.YT = { Player: vi.fn() } as never
    window.onYouTubeIframeAPIReady?.()
    await p
    expect(anterior).toHaveBeenCalledOnce()
  })

  it('rejeita quando o script falha e permite tentar de novo', async () => {
    const { carregarApiYoutube } = await carregador()
    const p = carregarApiYoutube()
    scripts()[0].dispatchEvent(new Event('error'))
    await expect(p).rejects.toThrow('Não foi possível carregar a API do YouTube.')
    expect(scripts()).toHaveLength(0)

    const nova = carregarApiYoutube()
    expect(nova).not.toBe(p)
    expect(scripts()).toHaveLength(1)
    nova.catch(() => {})
  })

  it('rejeita por tempo esgotado', async () => {
    vi.useFakeTimers()
    const { carregarApiYoutube } = await carregador()
    const p = carregarApiYoutube()
    vi.advanceTimersByTime(15_000)
    await expect(p).rejects.toThrow(/demorou/)
  })
})
