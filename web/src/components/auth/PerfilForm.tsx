'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buscarPerfil, editarPerfil, type Perfil } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { mensagemErroTurma } from '@/hooks/useTurmas'
import { salvarToken } from '@/lib/auth-helpers'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, botaoPrincipal, botaoSecundario, campo, textoApoio } from '@/lib/estilos'
import { perfilSchema, type PerfilFormData } from '@/lib/schemas/perfilSchema'
import { CampoFormulario } from '@/components/aluno/primeiro-acesso/CampoFormulario'
import { SeletorAvatar } from '@/components/aluno/primeiro-acesso/SeletorAvatar'

const subscribeNoop = () => () => {}
const CHAVE_PERFIL = ['perfil'] as const
const CAMPOS_EDITAVEIS = ['nome', 'avatar'] as const

/**
 * Meu perfil (aluno e professor), no visual da troca de senha. Edita o nome e, para o aluno, o
 * avatar; e-mail e matrícula são só leitura. Ao salvar, guarda o token novo para o menu mostrar o
 * nome atualizado.
 */
export function PerfilForm() {
  const router = useRouter()
  const { token } = useAuth()
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false)

  useEffect(() => {
    if (hydrated && !token) router.replace('/')
  }, [hydrated, token, router])

  const { data: perfil, isError, error } = useQuery({
    queryKey: CHAVE_PERFIL,
    queryFn: buscarPerfil,
    enabled: hydrated && !!token,
  })

  if (!hydrated || !token) return null

  if (isError) {
    return (
      <div role="alert" className={alertaErro}>
        {mensagemErroTurma(error)}
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="flex justify-center py-8" aria-busy="true">
        <Loader2 size={24} className="animate-spin motion-reduce:animate-none" aria-label="Carregando perfil" />
      </div>
    )
  }

  return <FormularioPerfil perfil={perfil} />
}

function FormularioPerfil({ perfil }: { perfil: Perfil }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const ehAluno = perfil.perfil === 'ALUNO'
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nome: perfil.nome, avatar: ehAluno ? perfil.avatar : undefined },
  })

  const avatar = useWatch({ control, name: 'avatar' })

  const { mutate, isPending } = useMutation({
    mutationFn: editarPerfil,
    onSuccess: (resposta) => {
      salvarToken(resposta.token)
      reset({ nome: resposta.nome, avatar: ehAluno ? resposta.avatar : undefined })
      queryClient.setQueryData<Perfil>(CHAVE_PERFIL, { ...perfil, nome: resposta.nome, avatar: resposta.avatar })
      setSucesso(resposta.aviso ?? 'Perfil atualizado.')
    },
    onError: (err) => {
      const resposta = (err as { response?: { status?: number; data?: { campos?: Record<string, string> } } })
        .response
      const campos = resposta?.status === 400 ? resposta.data?.campos : undefined
      const noCampo = CAMPOS_EDITAVEIS.filter((c) => campos?.[c])
      if (campos && noCampo.length > 0) {
        noCampo.forEach((c) => setError(c, { message: campos[c] }))
        return
      }
      setErroGeral(mensagemErroTurma(err))
    },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((dados) => {
        if (isPending) return
        setErroGeral(null)
        setSucesso(null)
        mutate({ nome: dados.nome, ...(ehAluno && dados.avatar ? { avatar: dados.avatar } : {}) })
      })}
      className="flex flex-col gap-5 text-left"
    >
      <div className="flex flex-col gap-2 text-center">
        <h2 className={cn(fredoka.className, 'text-2xl font-bold text-tinta sm:text-[1.75rem]')}>Meu perfil</h2>
        <p className={textoApoio}>Confira seus dados e atualize seu nome{ehAluno ? ' e seu avatar' : ''}.</p>
      </div>

      <CampoFormulario id="pf-nome" label="Nome" erro={errors.nome?.message}>
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            className={campo}
            {...register('nome')}
          />
        )}
      </CampoFormulario>

      {ehAluno && (
        <SeletorAvatar registro={register('avatar')} valor={avatar ?? ''} erro={errors.avatar?.message} />
      )}

      <CampoFormulario id="pf-email" label="E-mail">
        {(a11y) => (
          <input {...a11y} type="text" readOnly value={perfil.email ?? '—'} className={cn(campo, 'bg-tinta/5')} />
        )}
      </CampoFormulario>

      {ehAluno && (
        <CampoFormulario id="pf-matricula" label="Matrícula">
          {(a11y) => (
            <input
              {...a11y}
              type="text"
              readOnly
              value={perfil.matricula ?? '—'}
              className={cn(campo, 'bg-tinta/5')}
            />
          )}
        </CampoFormulario>
      )}

      <Link href="/trocar-senha" className={cn(botaoSecundario, 'self-start')}>
        <KeyRound size={18} aria-hidden="true" />
        Alterar senha
      </Link>

      {/* Regiões de aviso montadas antes da mensagem, para serem anunciadas. */}
      <div role="status" className="outline-none">
        {sucesso && (
          <div className="rounded-2xl border-2 border-sabia-verde/50 bg-sabia-verde/10 px-4 py-3 text-left text-sm font-bold text-tinta">
            {sucesso}
          </div>
        )}
      </div>
      <div role="alert" className="outline-none">
        {erroGeral && <div className={alertaErro}>{erroGeral}</div>}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => router.back()} disabled={isPending} className={botaoSecundario}>
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar
        </button>
        <button
          type="submit"
          disabled={!isDirty || isPending}
          aria-busy={isPending}
          className={cn(botaoPrincipal, fredoka.className, 'sm:min-w-44')}
        >
          {isPending ? (
            <>
              <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Salvando…
            </>
          ) : (
            'Salvar'
          )}
        </button>
      </div>
    </form>
  )
}
