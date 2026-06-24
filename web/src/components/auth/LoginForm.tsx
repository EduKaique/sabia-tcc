'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLogin } from '@/hooks/useLogin'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório')
    .email('Informe um e-mail válido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

const inputBase =
  'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30'

export function LoginForm() {
  const router = useRouter()
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const { mutate, isPending, erroAutenticacao, setErroAutenticacao } = useLogin(router)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  return (
    <form
      onSubmit={handleSubmit((data) => mutate(data))}
      onChange={() => setErroAutenticacao(false)}
      noValidate
    >
      {/* E-mail */}
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

      {/* Senha */}
      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="senha" className="font-heading text-sm font-medium text-foreground">
          Senha
        </label>
        <div className="relative">
          <input
            id="senha"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('senha')}
            className={`${inputBase} pr-10 ${errors.senha ? 'border-destructive' : 'border-border'}`}
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
        {errors.senha && (
          <p className="text-sm text-destructive">{errors.senha.message}</p>
        )}
      </div>

      {/* Erro de autenticação (API 401) */}
      {erroAutenticacao && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          E-mail ou senha incorretos
        </div>
      )}

      {/* Link esqueci senha */}
      <div className="mt-3 text-right">
        <Link href="/recuperar-senha" className="text-sm text-primary hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      {/* Botão */}
      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="mt-6 w-full rounded-lg bg-primary py-2.5 font-heading font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Entrando...
          </span>
        ) : (
          'Entrar'
        )}
      </button>
    </form>
  )
}
