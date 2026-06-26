import { BookOpen } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BookOpen size={40} className="text-muted-foreground/40 mb-3" />
      <p className="text-muted-foreground text-sm">Nenhuma atividade disponível no momento.</p>
    </div>
  )
}
