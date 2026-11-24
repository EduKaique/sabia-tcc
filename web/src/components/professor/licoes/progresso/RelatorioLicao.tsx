import { CheckCircle2, Circle, Users } from 'lucide-react'
import type { AlunoRelatorio, CelulaPagina, ColunaPagina, GrupoTurma } from '@/lib/licoes/painelProgresso'
import { SeloEstado } from './SeloEstado'

const th = 'px-3 py-3 text-left align-bottom text-xs font-medium text-muted-foreground'

/** ✓ Concluída ou ○ Pendente (ícone e texto; a cor só reforça), com o detalhe do questionário. */
function SituacaoPagina({ celula }: { celula: CelulaPagina }) {
  return (
    <>
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${
          celula.concluida ? 'text-green-800 dark:text-green-300' : 'text-muted-foreground'
        }`}
      >
        {celula.concluida ? <CheckCircle2 size={12} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
        {celula.texto}
      </span>
      {celula.detalhe && <span className="block text-xs text-muted-foreground">{celula.detalhe}</span>}
    </>
  )
}

function Resumo({ aluno }: { aluno: AlunoRelatorio }) {
  return (
    <>
      <SeloEstado celula={aluno} />
      <span className="mt-1 block text-xs text-muted-foreground">{aluno.paginas}</span>
      {aluno.questionario && <span className="block text-xs text-muted-foreground">{aluno.questionario}</span>}
      <span className="block text-xs text-muted-foreground">{aluno.pratica}</span>
    </>
  )
}

/** Desktop: aluno fixo à esquerda, resumo e uma coluna por página; a rolagem horizontal fica no contêiner. */
function TabelaTurma({ grupo, colunas }: { grupo: GrupoTurma; colunas: ColunaPagina[] }) {
  return (
    <div className="hidden min-w-0 overflow-x-auto md:block">
      <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
        <caption className="sr-only">Progresso dos alunos da turma {grupo.turmaNome}</caption>
        <thead>
          <tr>
            <th scope="col" className={`${th} sticky left-0 z-10 border-b border-r border-border bg-card px-4 uppercase tracking-wide`}>
              Aluno
            </th>
            <th scope="col" className={`${th} min-w-40 border-b border-border uppercase tracking-wide`}>
              Situação
            </th>
            {colunas.map((c) => (
              <th key={c.id} scope="col" className={`${th} min-w-28 border-b border-border`} title={c.titulo ?? undefined}>
                <span className="block text-sm font-semibold text-foreground">{c.rotulo}</span>
                {c.titulo && <span className="block max-w-36 truncate font-normal">{c.titulo}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupo.alunos.map((a) => (
            <tr key={a.alunoId} className="group">
              <th
                scope="row"
                title={a.nome}
                className="sticky left-0 z-10 max-w-56 truncate border-b border-r border-border bg-card px-4 py-3 text-left font-medium text-foreground group-last:border-b-0"
              >
                {a.nome}
              </th>
              <td aria-label={a.ariaLabel} data-estado={a.estado} className="border-b border-border px-3 py-3 align-top group-last:border-b-0">
                <Resumo aluno={a} />
              </td>
              {a.celulas.map((c) => (
                <td key={c.paginaId} aria-label={c.ariaLabel} className="border-b border-border px-3 py-3 align-top group-last:border-b-0">
                  <SituacaoPagina celula={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Celular: um cartão por aluno com o resumo e a lista das páginas. */
function CartoesTurma({ grupo, colunas }: { grupo: GrupoTurma; colunas: ColunaPagina[] }) {
  return (
    <ul className="divide-y divide-border md:hidden" aria-label={`Progresso por aluno — ${grupo.turmaNome}`}>
      {grupo.alunos.map((a) => (
        <li key={a.alunoId} className="space-y-2 p-4">
          <p className="font-medium break-words text-foreground">{a.nome}</p>
          <div aria-label={a.ariaLabel}>
            <Resumo aluno={a} />
          </div>
          <ul className="space-y-1.5">
            {a.celulas.map((c, i) => (
              <li key={c.paginaId} aria-label={c.ariaLabel} className="text-sm">
                <span className="block text-muted-foreground">
                  {colunas[i].rotulo}
                  {colunas[i].titulo ? ` — ${colunas[i].titulo}` : ''}
                </span>
                <SituacaoPagina celula={c} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

/** Um bloco por turma vinculada. */
export function RelatorioLicao({ grupos, colunas }: { grupos: GrupoTurma[]; colunas: ColunaPagina[] }) {
  return (
    <div className="space-y-5">
      {grupos.map((g) => (
        <section
          key={g.turmaId}
          aria-labelledby={`turma-${g.turmaId}`}
          className="min-w-0 rounded-xl border border-border bg-card shadow-sm"
        >
          <h3 id={`turma-${g.turmaId}`} className="border-b border-border px-5 py-3 font-semibold text-foreground">
            {g.turmaNome}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {g.alunos.length} {g.alunos.length === 1 ? 'aluno' : 'alunos'}
            </span>
          </h3>
          {g.alunos.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
              <Users size={16} aria-hidden="true" />
              Nenhum aluno matriculado nesta turma.
            </p>
          ) : (
            <>
              <TabelaTurma grupo={g} colunas={colunas} />
              <CartoesTurma grupo={g} colunas={colunas} />
            </>
          )}
        </section>
      ))}
    </div>
  )
}
