'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { redefinirSenha } from '@/services/recuperacaoSenha'

const redefinirSenhaSchema = z
  .object({
    novaSenha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

type RedefinirSenhaFormData = z.infer<typeof redefinirSenhaSchema>

const inputBase =
  'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30'

export function RedefinirSenhaForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [mostrarSenha, setMostrarSenha] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RedefinirSenhaFormData>({ resolver: zodResolver(redefinirSenhaSchema) })

  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: redefinirSenha,
  })

  if (!token) {
    return (
      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        Link inválido. Solicite uma nova recuperação de senha.
        <div className="mt-2">
          <Link href="/recuperar-senha" className="text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="rounded-md bg-primary/10 p-3 text-sm text-foreground">
        Senha redefinida com sucesso.
        <div className="mt-2">
          <Link href="/login" className="text-primary hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit((data) => mutate({ token, ...data }))}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="novaSenha" className="font-heading text-sm font-medium text-foreground">
          Nova senha
        </label>
        <div className="relative">
          <input
            id="novaSenha"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('novaSenha')}
            className={`${inputBase} pr-10 ${errors.novaSenha ? 'border-destructive' : 'border-border'}`}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.novaSenha && (
          <p className="text-sm text-destructive">{errors.novaSenha.message}</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="confirmarSenha" className="font-heading text-sm font-medium text-foreground">
          Confirmar nova senha
        </label>
        <input
          id="confirmarSenha"
          type={mostrarSenha ? 'text' : 'password'}
          autoComplete="new-password"
          {...register('confirmarSenha')}
          className={`${inputBase} ${errors.confirmarSenha ? 'border-destructive' : 'border-border'}`}
        />
        {errors.confirmarSenha && (
          <p className="text-sm text-destructive">{errors.confirmarSenha.message}</p>
        )}
      </div>

      {isError && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error instanceof Error && error.message !== 'SERVER_ERROR'
            ? error.message
            : 'Não foi possível redefinir a senha agora. Tente novamente.'}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="mt-6 w-full rounded-lg bg-primary py-2.5 font-heading font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Salvando...
          </span>
        ) : (
          'Redefinir senha'
        )}
      </button>
    </form>
  )
}
