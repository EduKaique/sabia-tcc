'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { campo, textoErro } from '@/lib/estilos'
import { nomeProjetoSandboxSchema } from '@/lib/schemas/projetoSandboxSchema'

interface Props {
  valor: string
  /** Chamado com o nome já aparado e diferente do atual. */
  onSalvar: (nome: string) => void
  onFechar: () => void
  rotulo: string
  className?: string
}

/**
 * Campo de renomear: Enter ou sair do campo confirmam; Esc cancela; nome vazio é rejeitado (mostra o erro e
 * mantém o nome anterior).
 */
export function NomeProjetoEditavel({ valor, onSalvar, onFechar, rotulo, className }: Props) {
  const [texto, setTexto] = useState(valor)
  const [erro, setErro] = useState<string | null>(null)
  // Evita confirmar duas vezes (Enter seguido do blur de quando o campo some).
  const encerradoRef = useRef(false)

  const fechar = () => {
    encerradoRef.current = true
    onFechar()
  }

  const confirmar = () => {
    if (encerradoRef.current) return
    const resultado = nomeProjetoSandboxSchema.safeParse(texto)
    if (!resultado.success) {
      setErro(resultado.error.issues[0]?.message ?? 'Nome inválido.')
      return
    }
    if (resultado.data !== valor) onSalvar(resultado.data)
    fechar()
  }

  return (
    <div className={cn('min-w-0', className)}>
      <input
        autoFocus
        aria-label={rotulo}
        aria-invalid={!!erro}
        maxLength={100}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          setErro(null)
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            confirmar()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            fechar()
          }
        }}
        onBlur={() => {
          // Nome vazio ao sair do campo: descarta a edição em vez de prender o foco.
          if (encerradoRef.current) return
          if (nomeProjetoSandboxSchema.safeParse(texto).success) confirmar()
          else fechar()
        }}
        className={cn(campo, 'min-h-10 py-1.5')}
      />
      {erro && (
        <p role="alert" className={cn(textoErro, 'mt-1')}>
          {erro}
        </p>
      )}
    </div>
  )
}
