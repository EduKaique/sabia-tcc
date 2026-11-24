'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, cartao } from '@/lib/estilos'
import { useLicoes } from '@/hooks/useLicoes'
import { ListaLicoes } from '@/components/aluno/licoes/ListaLicoes'

export default function AprenderPage() {
  const { data: licoes = [], isLoading, error } = useLicoes()
  const concluidas = licoes.filter((l) => l.estado === 'CONCLUIDA').length

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className={cn(fredoka.className, 'text-3xl font-bold text-tinta')}>Aprender</h1>
        {!isLoading && !error && licoes.length > 0 && (
          <p className="mt-1 text-base text-tinta-apoio">
            <span className="font-bold text-tinta">
              {concluidas} de {licoes.length} lições concluídas
            </span>
            {' '}• Leia, assista, responda e pratique no seu ritmo.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn(cartao, 'space-y-3 p-5')}>
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="ml-auto h-12 w-28 rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={cn(alertaErro, 'p-6 text-center')}>Erro ao carregar as lições. Tente novamente mais tarde.</div>
      ) : (
        <ListaLicoes licoes={licoes} />
      )}
    </div>
  )
}
