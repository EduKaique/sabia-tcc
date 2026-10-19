'use client'

import { ArrowLeft, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, botaoSecundario, linkDiscreto } from '@/lib/estilos'

interface PainelEscolhaProps {
  turmaNome: string
  onPrimeiroAcesso: () => void
  onJaTenhoConta: () => void
  onVoltar: () => void
}

/** Código válido: o aluno diz se é o primeiro acesso ou se já tem conta. */
export function PainelEscolha({ turmaNome, onPrimeiroAcesso, onJaTenhoConta, onVoltar }: PainelEscolhaProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-2xl bg-sabia-azul-claro px-4 py-3">
        <Users size={22} className="shrink-0 text-sabia-azul-escuro" aria-hidden="true" />
        <p className="text-base font-semibold text-tinta">
          Turma <strong className="font-extrabold">{turmaNome}</strong>
        </p>
      </div>

      <h2
        id="pa-titulo-escolha"
        tabIndex={-1}
        className={cn(fredoka.className, 'text-center text-2xl font-bold text-tinta outline-none sm:text-[1.75rem]')}
      >
        É a sua primeira vez no Sabiá?
      </h2>

      <div className="flex flex-col gap-3">
        <button type="button" onClick={onPrimeiroAcesso} className={cn(botaoPrincipal, fredoka.className, 'w-full')}>
          Primeiro acesso
        </button>
        <button type="button" onClick={onJaTenhoConta} className={cn(botaoSecundario, fredoka.className, 'w-full')}>
          Já tenho conta
        </button>
      </div>

      <button type="button" onClick={onVoltar} className={cn(linkDiscreto, 'self-center')}>
        <ArrowLeft size={18} aria-hidden="true" className="mr-1" />
        Trocar o código
      </button>
    </div>
  )
}
