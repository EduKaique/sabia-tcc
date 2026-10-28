import type { RelatorioTurma } from '@/types'

interface Props {
  turmas: RelatorioTurma[]
}

function percent(value: number) {
  return `${Math.round(value)}%`
}

export function RelatorioTurmasTable({ turmas }: Props) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="font-heading text-lg font-semibold">Desempenho por turma</h2>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe entregas e médias das suas turmas.</p>
      </div>
      {turmas.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Nenhum dado encontrado para os filtros selecionados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Turma</th>
                <th className="px-5 py-3 font-medium">Alunos</th>
                <th className="px-5 py-3 font-medium">Atividades</th>
                <th className="px-5 py-3 font-medium">Entregas</th>
                <th className="px-5 py-3 font-medium">Taxa</th>
                <th className="px-5 py-3 font-medium">Média</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {turmas.map((turma) => (
                <tr key={turma.turmaId} className="hover:bg-muted/20">
                  <td className="px-5 py-4 font-medium text-foreground">{turma.turmaNome}</td>
                  <td className="px-5 py-4 text-muted-foreground">{turma.totalAlunos}</td>
                  <td className="px-5 py-4 text-muted-foreground">{turma.totalAtividades}</td>
                  <td className="px-5 py-4 text-muted-foreground">{turma.totalEntregas}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(turma.taxaEntrega, 100)}%` }} />
                      </div>
                      <span className="text-muted-foreground">{percent(turma.taxaEntrega)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-foreground">
                    {turma.mediaTurma == null ? '--' : turma.mediaTurma.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
