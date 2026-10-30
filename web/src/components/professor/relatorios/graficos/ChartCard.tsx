import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  titulo: string
  descricao: string
  isLoading: boolean
  isError: boolean
  vazio?: boolean
  mensagemVazio?: string
  acoes?: ReactNode
  className?: string
  children: ReactNode
}

export function ChartCard({
  titulo,
  descricao,
  isLoading,
  isError,
  vazio = false,
  mensagemVazio = 'Ainda não há dados suficientes para este gráfico.',
  acoes,
  className = '',
  children,
}: Props) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">{titulo}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{descricao}</p>
        </div>
        {acoes}
      </div>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-lg bg-muted" aria-label="Carregando gráfico" />
      ) : isError ? (
        <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <AlertCircle className="text-destructive" size={24} />
          Não foi possível carregar este gráfico.
        </div>
      ) : vazio ? (
        <div className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground">
          {mensagemVazio}
        </div>
      ) : (
        children
      )}
    </section>
  )
}
