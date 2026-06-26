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
    <aside className="w-72 shrink-0">
      <div className="bg-primary rounded-xl p-5 text-primary-foreground">
        <h2 className="text-sm font-semibold mb-4">Seu Desempenho</h2>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="opacity-80">Meta Semanal</span>
            <span className="font-semibold">{metaSemanal}%</span>
          </div>
          <div className="w-full bg-primary-foreground/20 rounded-full h-2">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all"
              style={{ width: `${metaSemanal}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-foreground/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{corrigidas}</p>
            <p className="text-xs opacity-70 mt-0.5">Corrigidas</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{String(pendentes).padStart(2, '0')}</p>
            <p className="text-xs opacity-70 mt-0.5">Pendentes</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
