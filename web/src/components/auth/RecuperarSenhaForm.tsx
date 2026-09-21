'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { esqueciSenha } from '@/services/recuperacaoSenha'

const recuperarSenhaSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório')
    .email('Informe um e-mail válido'),
})

type RecuperarSenhaFormData = z.infer<typeof recuperarSenhaSchema>

const inputBase =
  'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30'

export function RecuperarSenhaForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarSenhaFormData>({ resolver: zodResolver(recuperarSenhaSchema) })

  const { mutate, isPending, isSuccess, data, isError } = useMutation({
    mutationFn: esqueciSenha,
  })

  if (isSuccess) {
    return (
      <div className="rounded-md bg-primary/10 p-3 text-sm text-foreground">
        {data.mensagem}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))} noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-heading text-sm font-medium text-foreground">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          {...register('email')}
          className={`${inputBase} ${errors.email ? 'border-destructive' : 'border-border'}`}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {isError && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Não foi possível enviar o e-mail agora. Tente novamente.
        </div>
      )}

      <div className="mt-3 text-right">
        <Link href="/login" className="text-sm text-primary hover:underline">
          Voltar para o login
        </Link>
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="mt-6 w-full rounded-lg bg-primary py-2.5 font-heading font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Enviando...
          </span>
        ) : (
          'Enviar link de recuperação'
        )}
      </button>
    </form>
  )
}
