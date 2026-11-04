'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Loader2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { trocarSenha } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { mensagemErroTurma } from '@/hooks/useTurmas'
import { encerrarSessao, redirecionarPorPerfil, salvarToken } from '@/lib/auth-helpers'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, botaoPrincipal, botaoSecundario, textoApoio } from '@/lib/estilos'
import { trocarSenhaSchema, type TrocarSenhaFormData } from '@/lib/schemas/trocarSenhaSchema'
import { CampoFormulario } from '@/components/aluno/primeiro-acesso/CampoFormulario'
import { CampoSenha } from '@/components/aluno/primeiro-acesso/CampoSenha'

const subscribeNoop = () => () => {}

/**
 * Troca da própria senha, no visual do login da home. Obrigatória (claim mustChangePassword no
 * token): sem saída além de "Sair". Voluntária (pelo menu): com "Voltar". Ao concluir, guarda o
 * token novo e vai para a home do perfil.
 */
export function TrocarSenhaForm() {
  const router = useRouter()
  const { user, token } = useAuth()
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false)
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
    <form
      noValidate
      onSubmit={handleSubmit((dados) => {
        if (!isPending) mutate(dados)
      })}
      className="flex flex-col gap-5 text-left"
    >
      <div className="flex flex-col gap-2 text-center">
        <h2 className={cn(fredoka.className, 'text-2xl font-bold text-tinta sm:text-[1.75rem]')}>
          {obrigatoria ? 'Crie uma senha nova' : 'Trocar sua senha'}
        </h2>
        <p className={textoApoio}>
          {obrigatoria
            ? 'Sua senha foi redefinida. Para continuar, crie uma senha nova que só você saiba.'
            : 'Digite sua senha atual e escolha uma senha nova.'}
        </p>
      </div>

      <CampoFormulario id="ts-senha-atual" label="Senha atual" erro={errors.senhaAtual?.message}>
        {(a11y) => <CampoSenha {...a11y} autoComplete="current-password" {...register('senhaAtual')} />}
      </CampoFormulario>

      <CampoFormulario
        id="ts-nova-senha"
        label="Nova senha"
        dica="Pelo menos 8 caracteres."
        erro={errors.novaSenha?.message}
      >
        {(a11y) => <CampoSenha {...a11y} autoComplete="new-password" {...register('novaSenha')} />}
      </CampoFormulario>

      <CampoFormulario id="ts-confirmar-senha" label="Confirmar nova senha" erro={errors.confirmarSenha?.message}>
        {(a11y) => <CampoSenha {...a11y} autoComplete="new-password" {...register('confirmarSenha')} />}
      </CampoFormulario>

      {/* Região de alerta montada antes de qualquer erro, para ser anunciada. */}
      <div role="alert" className="outline-none">
        {isError && <div className={alertaErro}>{mensagemErroTurma(error)}</div>}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {obrigatoria ? (
          <button type="button" onClick={sair} disabled={isPending} className={botaoSecundario}>
            <LogOut size={18} aria-hidden="true" />
            Sair
          </button>
        ) : (
          <button type="button" onClick={() => router.back()} disabled={isPending} className={botaoSecundario}>
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className={cn(botaoPrincipal, fredoka.className, 'sm:min-w-44')}
        >
          {isPending ? (
            <>
              <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Salvando…
            </>
          ) : (
            'Trocar senha'
          )}
        </button>
      </div>
    </form>
  )
}
