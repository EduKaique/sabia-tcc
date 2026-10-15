'use client'

import { Check } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { AVATARES } from '@/lib/avatares'
import { cn } from '@/lib/utils'
import { AvatarSabia } from './AvatarSabia'
import { rotulo, textoErro } from './estilos'

interface SeletorAvatarProps {
  registro: UseFormRegisterReturn<'avatar'>
  valor: string
  erro?: string
}

export const idOpcaoAvatar = (id: string) => `pa-avatar-${id}`

/**
 * Radiogroup com <input type="radio"> nativos (visualmente ocultos): Tab entra no grupo,
 * setas trocam a opção, Espaço seleciona. Selecionado = borda grossa + selo de check
 * (não depende só de cor).
 */
export function SeletorAvatar({ registro, valor, erro }: SeletorAvatarProps) {
  const idErro = erro ? 'pa-avatar-erro' : undefined

  return (
    <fieldset
      role="radiogroup"
      aria-labelledby="pa-avatar-legenda"
      aria-describedby={idErro}
      aria-invalid={!!erro}
      className="flex flex-col gap-2 text-left"
    >
      <legend id="pa-avatar-legenda" className={cn(rotulo, 'mb-2')}>
        Escolha seu avatar
      </legend>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {AVATARES.map((avatar) => {
          const selecionado = valor === avatar.id
          return (
            <label
              key={avatar.id}
              htmlFor={idOpcaoAvatar(avatar.id)}
              className={cn(
                'relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-[3px] bg-white p-1 transition-[border-color,transform] duration-150',
                'has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-[#426cda] has-[input:focus-visible]:ring-offset-2',
                selecionado
                  ? 'scale-[1.04] border-[#1e2546] shadow-[0_4px_0_#1e2546]'
                  : 'border-transparent hover:border-[#1e2546]/30',
              )}
            >
              <input
                type="radio"
                id={idOpcaoAvatar(avatar.id)}
                value={avatar.id}
                className="sr-only"
                {...registro}
              />
              <span className="sr-only">{avatar.rotulo}</span>
              <AvatarSabia id={avatar.id} className="h-auto w-full max-w-16" />
              {selecionado && (
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#1e2546] text-white"
                >
                  <Check size={14} strokeWidth={3.5} />
                </span>
              )}
            </label>
          )
        })}
      </div>

      {erro && (
        <p id={idErro} className={textoErro}>
          {erro}
        </p>
      )}
    </fieldset>
  )
}
