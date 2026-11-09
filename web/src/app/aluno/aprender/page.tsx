'use client'

import { BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, cartao } from '@/lib/estilos'
import { useLicoes } from '@/hooks/useLicoes'
import { LicaoCard } from '@/components/aluno/licoes/LicaoCard'

export default function AprenderPage() {
  const { data: licoes = [], isLoading, error } = useLicoes()
  const concluidas = licoes.filter((l) => l.progresso.concluida).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className={cn(fredoka.className, 'text-3xl font-bold text-tinta')}>Aprender</h1>
        {!isLoading && !error && licoes.length > 0 && (
          <p className="mt-1 text-base text-tinta-apoio">
            <span className="font-bold text-tinta">
              {concluidas} de {licoes.length} lições concluídas
            </span>
            {' '}• Assista, pratique e avance no seu ritmo.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn(cartao, 'flex items-center gap-4 p-5')}>
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-12 w-28 rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={cn(alertaErro, 'p-6 text-center')}>
          Erro ao carregar as lições. Tente novamente mais tarde.
        </div>
      ) : licoes.length === 0 ? (
        <div className={cn(cartao, 'flex flex-col items-center justify-center px-6 py-12 text-center')}>
          <BookOpen size={40} className="mb-3 text-sabia-azul" aria-hidden="true" />
          <p className="text-base font-semibold text-tinta-apoio">Nenhuma lição disponível no momento.</p>
        </div>
      ) : (
        <ol className="space-y-4">
          {licoes.map((licao, i) => (
            <li key={licao.id}>
              <LicaoCard licao={licao} numero={i + 1} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
