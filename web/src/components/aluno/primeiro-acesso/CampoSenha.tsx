'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { campo } from '@/lib/estilos'

type CampoSenhaProps = Omit<React.ComponentProps<'input'>, 'type'> & { id: string }

/**
 * Senha com botão mostrar/ocultar (ícone Eye/EyeOff).
 * O botão entra na ordem de Tab e tem área de toque de 48px.
 */
export function CampoSenha({ id, className, ...props }: CampoSenhaProps) {
  const [mostrar, setMostrar] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={mostrar ? 'text' : 'password'}
        autoComplete="new-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn(campo, 'pr-14', className)}
        {...props}
      />
      <button
        type="button"
        aria-controls={id}
        aria-pressed={mostrar}
        aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={() => setMostrar((v) => !v)}
        className="absolute top-1/2 right-0.5 flex size-12 -translate-y-1/2 items-center justify-center rounded-full text-[#3a4266] outline-none hover:text-[#1e2546] focus-visible:ring-4 focus-visible:ring-[#426cda]"
      >
        {mostrar ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  )
}
