'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Eye, EyeOff, Loader2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { trocarSenha } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { mensagemErroTurma } from '@/hooks/useTurmas'
import { encerrarSessao, redirecionarPorPerfil, salvarToken } from '@/lib/auth-helpers'
import { trocarSenhaSchema, type TrocarSenhaFormData } from '@/lib/schemas/trocarSenhaSchema'

const inputBase =
  'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30'

const subscribeNoop = () => () => {}

const CAMPOS: { id: keyof TrocarSenhaFormData; rotulo: string; autoComplete: string }[] = [
  { id: 'senhaAtual', rotulo: 'Senha atual', autoComplete: 'current-password' },
  { id: 'novaSenha', rotulo: 'Nova senha', autoComplete: 'new-password' },
  { id: 'confirmarSenha', rotulo: 'Confirmar nova senha', autoComplete: 'new-password' },
]

/**
 * Troca da própria senha. Obrigatória (claim mustChangePassword no token): sem saída além de
 * "Sair". Voluntária (pelo menu): com "Voltar". Ao concluir, guarda o token novo e vai para a home.
 */
export function TrocarSenhaForm() {
  const router = useRouter()
  const { user, token } = useAuth()
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const obrigatoria = !!user?.mustChangePassword

  useEffect(() => {
    if (hydrated && !token) router.replace('/')
  }, [hydrated, token, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrocarSenhaFormData>({ resolver: zodResolver(trocarSenhaSchema) })

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: trocarSenha,
    onSuccess: (resposta) => {
      salvarToken(resposta.token)
      redirecionarPorPerfil(resposta, router)
    },
  })

  const sair = () => {
    encerrarSessao()
    window.location.href = '/'
  }

  if (!hydrated || !token) return null

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))} noValidate>
      <p className="mb-6 text-sm text-muted-foreground">
        {obrigatoria
          ? 'Sua senha foi redefinida. Para continuar, crie uma senha nova que só você saiba.'
          : 'Digite sua senha atual e escolha uma senha nova.'}
      </p>

      {CAMPOS.map(({ id, rotulo, autoComplete }, i) => (
        <div key={id} className={`flex flex-col gap-1.5 ${i > 0 ? 'mt-4' : ''}`}>
          <label htmlFor={id} className="font-heading text-sm font-medium text-foreground">
            {rotulo}
          </label>
          <div className="relative">
            <input
              id={id}
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete={autoComplete}
              {...register(id)}
              className={`${inputBase} ${i === 0 ? 'pr-10' : ''} ${errors[id] ? 'border-destructive' : 'border-border'}`}
            />
            {i === 0 && (
              <button
                type="button"
                aria-label={mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'}
                aria-pressed={mostrarSenha}
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
          {errors[id] && <p className="text-sm text-destructive">{errors[id]?.message}</p>}
        </div>
      ))}

      {isError && (
        <div role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {mensagemErroTurma(error)}
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
          'Trocar senha'
        )}
      </button>

      {obrigatoria ? (
        <button
          type="button"
          onClick={sair}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <LogOut size={16} />
          Sair
        </button>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      )}
    </form>
  )
}
