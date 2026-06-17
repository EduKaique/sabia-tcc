import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  filtered?: boolean
}

export function EmptyState({ filtered }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 bg-primary/10 rounded-full mb-4">
        <BookOpen size={32} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {filtered ? 'Nenhuma atividade neste filtro' : 'Nenhuma atividade criada'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {filtered
          ? 'Tente trocar o filtro selecionado.'
          : 'Crie sua primeira atividade para começar.'}
      </p>
      {!filtered && (
        <Button asChild>
          <Link href="/professor/atividades/nova">Criar atividade</Link>
        </Button>
      )}
    </div>
  )
}
