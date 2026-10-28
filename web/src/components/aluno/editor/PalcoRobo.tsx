import { cn } from '@/lib/utils'
import { estiloBlocosRobo } from '@/lib/temaBlocklyScratch'
import type { CenarioRobo, PosicaoRobo } from '@/types'

const CELULA = 40

interface Props {
  cenario: CenarioRobo
  posicao: PosicaoRobo
  /** Pinta o robô de vermelho quando a execução terminou em erro. */
  erro: boolean
}

function descrever({ linha, coluna }: PosicaoRobo) {
  return `linha ${linha + 1}, coluna ${coluna + 1}`
}

/** Estrela de 5 pontas centrada na célula. */
function pontosEstrela(cx: number, cy: number, externo: number, interno: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const raio = i % 2 === 0 ? externo : interno
    const angulo = -Math.PI / 2 + (i * Math.PI) / 5
    return `${(cx + raio * Math.cos(angulo)).toFixed(2)},${(cy + raio * Math.sin(angulo)).toFixed(2)}`
  }).join(' ')
}

/** Grade vista de cima, desenhada só com formas geométricas. */
export function PalcoRobo({ cenario, posicao, erro }: Props) {
  const { linhas, colunas, inicio, destino, obstaculos } = cenario
  const rotulo =
    `Grade de ${linhas} linhas por ${colunas} colunas. ` +
    `Robô na ${descrever(posicao)}. Destino na ${descrever(destino)}. ` +
    (obstaculos.length === 1 ? '1 obstáculo.' : `${obstaculos.length} obstáculos.`)

  return (
    <svg
      role="img"
      aria-label={rotulo}
      viewBox={`0 0 ${colunas * CELULA} ${linhas * CELULA}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {Array.from({ length: linhas * colunas }, (_, i) => {
        const linha = Math.floor(i / colunas)
        const coluna = i % colunas
        return (
          <rect
            key={i}
            x={coluna * CELULA}
            y={linha * CELULA}
            width={CELULA}
            height={CELULA}
            className={cn(
              'stroke-tinta/15',
              (linha + coluna) % 2 === 0 ? 'fill-white' : 'fill-sabia-azul-claro',
            )}
            strokeWidth={1}
          />
        )
      })}

      <rect
        x={1}
        y={1}
        width={colunas * CELULA - 2}
        height={linhas * CELULA - 2}
        rx={6}
        className="fill-none stroke-tinta"
        strokeWidth={2}
      />

      {/* Ponto de partida: círculo tracejado discreto. */}
      <circle
        cx={inicio.coluna * CELULA + CELULA / 2}
        cy={inicio.linha * CELULA + CELULA / 2}
        r={15}
        className="fill-none stroke-tinta/30"
        strokeWidth={2}
        strokeDasharray="4 3"
      />

      <polygon
        points={pontosEstrela(destino.coluna * CELULA + CELULA / 2, destino.linha * CELULA + CELULA / 2, 15, 6.5)}
        className="fill-sabia-amarelo stroke-tinta"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {obstaculos.map(({ linha, coluna }) => {
        const x = coluna * CELULA
        const y = linha * CELULA
        return (
          <g key={`${linha}-${coluna}`}>
            <rect x={x + 5} y={y + 5} width={30} height={30} rx={5} className="fill-tinta-apoio stroke-tinta" strokeWidth={2} />
            <rect x={x + 11} y={y + 11} width={18} height={18} rx={3} className="fill-none stroke-white/40" strokeWidth={2} />
            {[
              [x + 9, y + 9],
              [x + 31, y + 9],
              [x + 9, y + 31],
              [x + 31, y + 31],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.6} className="fill-white/70" />
            ))}
          </g>
        )
      })}

      <g
        className="transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: `translate(${posicao.coluna * CELULA}px, ${posicao.linha * CELULA}px)` }}
      >
        <line x1={20} y1={5} x2={20} y2={10} className="stroke-tinta" strokeWidth={2} />
        <circle cx={20} cy={4.5} r={2.5} className="fill-sabia-laranja stroke-tinta" strokeWidth={1.5} />
        <rect
          x={10}
          y={10}
          width={20}
          height={12}
          rx={3}
          fill={erro ? undefined : estiloBlocosRobo.colourSecondary}
          className={cn('stroke-tinta', erro && 'fill-sabia-erro')}
          strokeWidth={2}
        />
        <circle cx={16} cy={16} r={2.4} className="fill-white" />
        <circle cx={24} cy={16} r={2.4} className="fill-white" />
        <rect
          x={8}
          y={23}
          width={24}
          height={12}
          rx={3}
          fill={erro ? undefined : estiloBlocosRobo.colourPrimary}
          className={cn('stroke-tinta', erro && 'fill-sabia-erro')}
          strokeWidth={2}
        />
        <rect x={15} y={27} width={10} height={4} rx={1.5} className="fill-white/70" />
      </g>
    </svg>
  )
}
