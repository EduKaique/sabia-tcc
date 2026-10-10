import { useState, type ReactNode } from 'react'
import { AlertTriangle, Check, ChevronDown, CircleAlert, Sparkles } from 'lucide-react'
import type { RelatorioIa } from '@/types'
import { useRevisarSubmissaoIa } from '@/hooks/useRevisarSubmissaoIa'
import type { RevisarSubmissaoIaPayload } from '@/services/ia'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function lerRelatorio(json: string | null | undefined): RelatorioIa | null {
  if (!json) return null
  try {
    const dados = JSON.parse(json)
    if (!dados || typeof dados !== 'object') return null
    const relatorio: RelatorioIa = {
      notaSugerida: typeof dados.notaSugerida === 'number' ? dados.notaSugerida : undefined,
      acertos: Array.isArray(dados.acertos) ? dados.acertos.filter((a: unknown) => typeof a === 'string') : undefined,
      erros: Array.isArray(dados.erros)
        ? dados.erros.filter((e: { descricao?: unknown }) => typeof e?.descricao === 'string')
        : undefined,
      resumo: typeof dados.resumo === 'string' ? dados.resumo : undefined,
    }
    const temDados =
      relatorio.notaSugerida !== undefined ||
      !!relatorio.acertos?.length ||
      !!relatorio.erros?.length ||
      !!relatorio.resumo
    return temDados ? relatorio : null
  } catch {
    return null
  }
}

interface Props {
  relatorioIaJson: string | null | undefined
  payload: RevisarSubmissaoIaPayload | null
}

export function PainelRelatorioIa({ relatorioIaJson, payload }: Props) {
  const revisar = useRevisarSubmissaoIa()
  const [relatorioGerado, setRelatorioGerado] = useState<RelatorioIa | null>(null)
  const [secaoAberta, setSecaoAberta] = useState<'acertos' | 'erros' | 'resumo' | null>(null)
  const relatorio = relatorioGerado ?? lerRelatorio(relatorioIaJson)

  function gerarRelatorio() {
    if (!payload) return
    revisar.mutate(payload, {
      onSuccess: setRelatorioGerado,
    })
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-blue-100 bg-blue-50/50 py-0 shadow-sm">
      <div className="border-b border-blue-100 bg-blue-100/70 px-4 py-4">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Sparkles size={18} className="text-blue-600" aria-hidden="true" />
          Relatório da IA
        </div>
      </div>
      <div className="space-y-3 p-3 text-sm text-foreground">
        {!relatorio ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">Relatório de IA ainda não disponível.</p>
            <Button onClick={gerarRelatorio} disabled={!payload || revisar.isPending}>
              {revisar.isPending ? 'Gerando relatório...' : 'Gerar relatório com IA'}
            </Button>
            {revisar.isError && (
              <p className="text-sm text-destructive">
                Não foi possível gerar o relatório. Tente novamente.
              </p>
            )}
          </div>
        ) : (
          <>
            {relatorio.notaSugerida !== undefined && (
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-3 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Nota sugerida
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-900 ring-4 ring-white">
                  {relatorio.notaSugerida}
                </span>
              </div>
            )}
            <SecaoRelatorio
              aberta={secaoAberta === 'acertos'}
              disponivel={!!relatorio.acertos?.length}
              titulo="Acertos"
              tipo="acertos"
              onToggle={() => setSecaoAberta(secaoAberta === 'acertos' ? null : 'acertos')}
            >
              <ul className="space-y-2">
                {relatorio.acertos?.map((acerto, index) => (
                  <li key={`${acerto}-${index}`} className="flex gap-2 rounded-md border border-emerald-100 bg-white p-2.5 text-slate-700">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{acerto}</span>
                  </li>
                ))}
              </ul>
            </SecaoRelatorio>
            <SecaoRelatorio
              aberta={secaoAberta === 'erros'}
              disponivel={!!relatorio.erros?.length}
              titulo="Erros encontrados"
              tipo="erros"
              onToggle={() => setSecaoAberta(secaoAberta === 'erros' ? null : 'erros')}
            >
              <ul className="space-y-2">
                {relatorio.erros?.map((erro, index) => (
                  <li
                    key={`${erro.descricao}-${index}`}
                    className={`rounded-md border p-2.5 ${
                      severidadeClasses(erro.severidade)
                    }`}
                  >
                    <div className="flex gap-2">
                      <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p>{erro.descricao}</p>
                        {erro.severidade && (
                          <span
                            className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severidadeTagClasses(erro.severidade)}`}
                          >
                            {erro.severidade}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </SecaoRelatorio>
            <SecaoRelatorio
              aberta={secaoAberta === 'resumo'}
              disponivel={!!relatorio.resumo}
              titulo="Resumo da análise"
              tipo="resumo"
              onToggle={() => setSecaoAberta(secaoAberta === 'resumo' ? null : 'resumo')}
            >
              <p className="whitespace-pre-wrap rounded-md bg-blue-100/60 p-3 text-slate-700">
                {relatorio.resumo}
              </p>
            </SecaoRelatorio>
          </>
        )}
      </div>
    </Card>
  )
}

type SecaoTipo = 'acertos' | 'erros' | 'resumo'

function SecaoRelatorio({
  aberta,
  disponivel,
  titulo,
  tipo,
  onToggle,
  children,
}: {
  aberta: boolean
  disponivel: boolean
  titulo: string
  tipo: SecaoTipo
  onToggle: () => void
  children: ReactNode
}) {
  if (!disponivel) return null

  const estilos = {
    acertos: {
      icon: <Check size={16} aria-hidden="true" />,
      container: 'border-emerald-100 bg-emerald-50/70',
      iconColor: 'text-emerald-600',
    },
    erros: {
      icon: <AlertTriangle size={16} aria-hidden="true" />,
      container: 'border-red-100 bg-red-50/70',
      iconColor: 'text-red-600',
    },
    resumo: {
      icon: <Sparkles size={16} aria-hidden="true" />,
      container: 'border-blue-100 bg-blue-50/70',
      iconColor: 'text-blue-600',
    },
  }[tipo]

  return (
    <div className={`overflow-hidden rounded-lg border ${estilos.container}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberta}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left font-semibold text-slate-800 transition-colors hover:bg-white/50"
      >
        <span className="flex items-center gap-2">
          <span className={estilos.iconColor}>{estilos.icon}</span>
          {titulo}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${aberta ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          aberta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-inherit p-2">{children}</div>
        </div>
      </div>
    </div>
  )
}

function severidadeClasses(severidade?: string) {
  switch (severidade?.toUpperCase()) {
    case 'ALTA':
    case 'ALTO':
      return 'border-red-200 bg-red-100/70 text-red-800'
    case 'MEDIA':
    case 'MÉDIA':
    case 'MEDIO':
    case 'MÉDIO':
      return 'border-amber-200 bg-amber-100/70 text-amber-800'
    default:
      return 'border-slate-200 bg-slate-100/70 text-slate-700'
  }
}

function severidadeTagClasses(severidade?: string) {
  switch (severidade?.toUpperCase()) {
    case 'ALTA':
    case 'ALTO':
      return 'border-red-300 bg-red-200 text-red-900'
    case 'MEDIA':
    case 'MÉDIA':
    case 'MEDIO':
    case 'MÉDIO':
      return 'border-amber-300 bg-amber-200 text-amber-900'
    default:
      return 'border-slate-300 bg-slate-200 text-slate-800'
  }
}
