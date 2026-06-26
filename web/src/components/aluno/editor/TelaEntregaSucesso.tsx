import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TelaEntregaSucesso() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
      <CheckCircle2 size={80} className="text-emerald-500" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Atividade entregue com sucesso!</h1>
        <p className="text-sm text-muted-foreground">
          Sua submissão foi enviada ao professor para avaliação.
        </p>
      </div>
      <Button asChild>
        <Link href="/aluno/atividades">Voltar para Atividades</Link>
      </Button>
    </div>
  )
}
