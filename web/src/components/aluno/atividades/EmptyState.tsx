import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cartao } from '@/lib/estilos'

export function EmptyState() {
  return (
    <div className={cn(cartao, 'flex flex-col items-center justify-center px-6 py-12 text-center')}>
      <BookOpen size={40} className="mb-3 text-sabia-azul" aria-hidden="true" />
      <p className="text-base font-semibold text-tinta-apoio">Nenhuma atividade disponível no momento.</p>
    </div>
  )
}
