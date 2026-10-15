'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, campo, linkDiscreto, rotulo, textoApoio, textoErro } from './estilos'

export const TAMANHO_CODIGO = 6

/** Aceita colar com espaços, hífen ou minúsculas: fica só A-Z e 0-9, em maiúsculas. */
export function limparCodigo(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, TAMANHO_CODIGO)
}

export interface MensagemCodigo {
  tipo: 'ajuda' | 'erro'
  texto: string
}

interface PainelCodigoProps {
  codigo: string
  onCodigoChange: (codigo: string) => void
  mensagem: MensagemCodigo | null
  validando: boolean
  onEnviar: () => void
}

export function PainelCodigo({ codigo, onCodigoChange, mensagem, validando, onEnviar }: PainelCodigoProps) {
  const invalido = mensagem?.tipo === 'erro'

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!validando) onEnviar()
      }}
      className="flex flex-col gap-5"
    >
      <div className="text-center">
        <h2
          id="pa-titulo-codigo"
          tabIndex={-1}
          className={cn(fredoka.className, 'text-2xl font-bold text-[#1e2546] outline-none sm:text-[1.75rem]')}
        >
          Qual é o código da sua turma?
        </h2>
        <p id="pa-codigo-dica" className={cn(textoApoio, 'mt-1 text-base')}>
          Pergunte ao seu professor.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="pa-codigo" className={cn(rotulo, 'text-center')}>
          Código da turma
        </label>
        <input
          id="pa-codigo"
          name="codigo"
          value={codigo}
          onChange={(e) => onCodigoChange(limparCodigo(e.target.value))}
          onPaste={(e) => {
            // maxLength cortaria " SABIA1 " antes da limpeza: normaliza o texto colado inteiro.
            e.preventDefault()
            onCodigoChange(limparCodigo(e.clipboardData.getData('text')))
          }}
          maxLength={TAMANHO_CODIGO}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="ABC123"
          aria-invalid={invalido}
          aria-describedby="pa-codigo-dica pa-codigo-msg"
          className={cn(
            campo,
            fredoka.className,
            'min-h-16 text-center text-3xl tracking-[0.3em] uppercase placeholder:tracking-[0.3em] placeholder:text-[#9aa0b8]',
            // compensa o letter-spacing do último caractere para centralizar de verdade
            'pl-[calc(1rem+0.3em)]',
          )}
        />
        <p
          id="pa-codigo-msg"
          className={cn('min-h-5 text-center', mensagem?.tipo === 'erro' ? textoErro : textoApoio)}
        >
          {mensagem?.texto}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="submit"
          disabled={validando}
          aria-busy={validando}
          className={cn(botaoPrincipal, fredoka.className, 'w-full')}
        >
          {validando ? (
            <>
              <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Verificando…
            </>
          ) : (
            'Entrar na turma'
          )}
        </button>
        <Link href="/login" className={linkDiscreto}>
          Já tenho conta
        </Link>
      </div>
    </form>
  )
}
