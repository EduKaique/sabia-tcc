'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import styles from '@/styles/home.module.css'
import { AvatarSabia } from './AvatarSabia'
import { botaoPrincipal, textoApoio } from './estilos'

interface TelaBoasVindasProps {
  nome: string
  turmaNome: string
  avatar: string
  onContinuar: () => void
}

/** Momento final do fluxo (pico-final): curto, festivo e com um único próximo passo. */
export function TelaBoasVindas({ nome, turmaNome, avatar, onContinuar }: TelaBoasVindasProps) {
  const [indo, setIndo] = useState(false)
  const primeiroNome = nome.trim().split(/\s+/)[0]

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative">
        <div className={styles.pop}>
          <AvatarSabia id={avatar} tamanho={112} anunciar />
        </div>
        <Estrelinhas />
      </div>

      <h2
        id="pa-titulo-sucesso"
        tabIndex={-1}
        className={cn(fredoka.className, 'text-3xl font-bold text-[#1e2546] outline-none')}
      >
        Boas-vindas, {primeiroNome}!
      </h2>
      <p className="text-lg font-semibold text-[#1e2546]">
        Você entrou na turma <strong className="font-extrabold">{turmaNome}</strong>.
      </p>
      <p className={textoApoio}>Sua conta está pronta. Bora programar?</p>

      <button
        type="button"
        disabled={indo}
        aria-busy={indo}
        onClick={() => {
          setIndo(true)
          onContinuar()
        }}
        className={cn(botaoPrincipal, fredoka.className, 'mt-2 w-full sm:w-auto')}
      >
        {indo ? (
          <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : null}
        Ir para minhas atividades
        {!indo && <ArrowRight size={20} aria-hidden="true" />}
      </button>
    </div>
  )
}

function Estrelinhas() {
  const estrela = 'M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z'
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 160 140"
      className="pointer-events-none absolute -inset-x-6 -inset-y-3 h-[calc(100%+1.5rem)] w-[calc(100%+3rem)] overflow-visible"
    >
      {/* posição no <g>: a animação CSS de transform sobrescreveria o atributo do <path> */}
      <g transform="translate(14 30)">
        <path d={estrela} fill="#f9bd15" className={styles.brilho} style={{ animationDelay: '0.35s' }} />
      </g>
      <g transform="translate(148 22) scale(0.8)">
        <path d={estrela} fill="#8d4ce6" className={styles.brilho} style={{ animationDelay: '0.5s' }} />
      </g>
      <g transform="translate(146 118) scale(0.7)">
        <path d={estrela} fill="#60bb75" className={styles.brilho} style={{ animationDelay: '0.65s' }} />
      </g>
    </svg>
  )
}
