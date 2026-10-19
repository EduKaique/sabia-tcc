import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import type { AtividadeAlunoDTO } from '@/types/atividade'

interface Props {
  atividades: AtividadeAlunoDTO[]
}

export function PainelDesempenho({ atividades }: Props) {
  const pendentes = atividades.filter(
    (a) => a.status === 'PENDENTE' || a.status === 'EM_ANDAMENTO',
  ).length

  const corrigidas = atividades.filter((a) => a.status === 'CORRIGIDA').length

  const metaSemanal =
    atividades.length > 0 ? Math.round((corrigidas / atividades.length) * 100) : 0

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="rounded-[1.5rem] border-2 border-tinta bg-sabia-azul p-5 text-white shadow-[0_4px_0_var(--color-tinta)]">
        <h2 className={cn(fredoka.className, 'mb-4 text-lg font-bold')}>Seu Desempenho</h2>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold">Meta Semanal</span>
            <span className="font-bold">{metaSemanal}%</span>
          </div>
          <div className="h-3 w-full rounded-full border-2 border-tinta bg-white/30">
            <div
              className="h-full rounded-full bg-sabia-amarelo transition-all"
              style={{ width: `${metaSemanal}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3 text-center">
            <p className={cn(fredoka.className, 'text-3xl font-bold')}>{corrigidas}</p>
            <p className="mt-0.5 text-sm font-semibold">Corrigidas</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center">
            <p className={cn(fredoka.className, 'text-3xl font-bold')}>{String(pendentes).padStart(2, '0')}</p>
            <p className="mt-0.5 text-sm font-semibold">Pendentes</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
