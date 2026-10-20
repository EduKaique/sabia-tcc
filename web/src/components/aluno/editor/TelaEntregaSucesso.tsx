import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, textoApoio } from '@/lib/estilos'

export function TelaEntregaSucesso() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
      <CheckCircle2 size={80} className="text-sabia-verde" aria-hidden="true" />
      <div className="space-y-2">
        <h1 className={cn(fredoka.className, 'text-3xl font-bold text-tinta')}>
          Atividade entregue com sucesso!
        </h1>
        <p className={cn(textoApoio, 'text-base')}>
          Sua submissão foi enviada ao professor para avaliação.
        </p>
      </div>
      <Link href="/aluno/atividades" className={cn(botaoPrincipal, fredoka.className)}>
        Voltar para Atividades
      </Link>
    </div>
  )
}
