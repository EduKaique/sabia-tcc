/**
 * Agenda dos pulsos do vídeo, sem React e sem rede (testável com temporizadores falsos).
 *
 * Enquanto o player toca: um pulso ao começar e outro a cada INTERVALO_PULSO_MS; um pulso extra ao pausar, ao
 * terminar e ao encerrar (trocar de página ou desmontar) se estava tocando. Nunca há mais de um pulso em
 * andamento: o tick que encontra um pendente é descartado. O servidor credita o tempo pelo próprio relógio.
 */

export const INTERVALO_PULSO_MS = 10_000

/**
 * - 'ok': continue;
 * - 'conferido': o vídeo já conta como assistido, pare de vez;
 * - 'parar': erro definitivo (404/422), pare de vez;
 * - 'erro': falha passageira (rede, 5xx), tente no próximo tick.
 */
export type ResultadoPulso = 'ok' | 'conferido' | 'parar' | 'erro'

export interface AgendaPulsos {
  tocando(): void
  pausado(): void
  terminou(): void
  /** Para tudo (com um último pulso se estava tocando). Depois disso a agenda ignora qualquer chamada. */
  encerrar(): void
}

export function criarAgendaPulsos(enviar: () => Promise<ResultadoPulso>): AgendaPulsos {
  let tocando = false
  let parada = false
  let pendente = false
  let intervalo: ReturnType<typeof setInterval> | null = null

  const pararIntervalo = () => {
    if (intervalo) clearInterval(intervalo)
    intervalo = null
  }

  const pulsar = () => {
    if (pendente || parada) return
    pendente = true
    enviar()
      .catch((): ResultadoPulso => 'erro')
      .then((r) => {
        pendente = false
        if (r === 'conferido' || r === 'parar') {
          parada = true
          tocando = false
          pararIntervalo()
        }
      })
  }

  const parouDeTocar = () => {
    if (!tocando) return
    tocando = false
    pararIntervalo()
    pulsar()
  }

  return {
    tocando() {
      if (parada || tocando) return
      tocando = true
      pulsar()
      intervalo = setInterval(pulsar, INTERVALO_PULSO_MS)
    },
    pausado: parouDeTocar,
    terminou: parouDeTocar,
    encerrar() {
      parouDeTocar()
      parada = true
      pararIntervalo()
    },
  }
}
