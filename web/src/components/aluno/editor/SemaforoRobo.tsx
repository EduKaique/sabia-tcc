import { CircleCheck, Loader, OctagonX, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusSimulacao } from '@/lib/simuladorRobo'

export type FaseJogo = 'PARADO' | 'EXECUTANDO' | StatusSimulacao

/** Texto curto de cada fase, usado no semáforo e no anúncio do resultado. */
export const TEXTO_FASE: Record<FaseJogo, string> = {
  PARADO: 'Parado',
  EXECUTANDO: 'Executando…',
  CHEGOU: 'Chegou!',
  COLIDIU: 'Bateu num obstáculo',
  SAIU_DO_GRID: 'Saiu da grade',
  NAO_CHEGOU: 'Não chegou ao destino',
  LIMITE_EXCEDIDO: 'Passos demais',
  SEM_BLOCOS: 'Adicione blocos',
}

type Luz = 'vermelha' | 'amarela' | 'verde'

function luzDaFase(fase: FaseJogo): Luz {
  if (fase === 'EXECUTANDO') return 'amarela'
  if (fase === 'CHEGOU') return 'verde'
  return 'vermelha'
}

const corAcesa: Record<Luz, string> = {
  vermelha: 'bg-sabia-erro',
  amarela: 'bg-sabia-amarelo',
  verde: 'bg-sabia-verde',
}

/** Semáforo com cor, ícone e texto: a cor nunca é a única informação. */
export function SemaforoRobo({ fase }: { fase: FaseJogo }) {
  const acesa = luzDaFase(fase)
  const Icone =
    fase === 'EXECUTANDO'
      ? Loader
      : fase === 'CHEGOU'
        ? CircleCheck
        : fase === 'PARADO'
          ? OctagonX
          : TriangleAlert

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex flex-col gap-1 rounded-xl border-2 border-tinta bg-tinta p-1.5"
        aria-hidden="true"
      >
        {(['vermelha', 'amarela', 'verde'] as const).map((luz) => (
          <span
            key={luz}
            className={cn(
              'block size-4 rounded-full',
              luz === acesa ? corAcesa[luz] : 'bg-white/20',
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          'flex items-center gap-2 text-base font-bold',
          acesa === 'vermelha' && fase !== 'PARADO' ? 'text-sabia-erro' : 'text-tinta',
        )}
      >
        <Icone
          size={20}
          aria-hidden="true"
          className={cn('shrink-0', fase === 'EXECUTANDO' && 'motion-safe:animate-spin')}
        />
        {TEXTO_FASE[fase]}
      </p>
    </div>
  )
}
