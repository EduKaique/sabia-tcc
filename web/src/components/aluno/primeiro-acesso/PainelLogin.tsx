'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, botaoPrincipal, botaoSecundario, campo, linkDiscreto } from '@/lib/estilos'
import { loginSchema, type LoginFormData } from '@/lib/schemas/loginSchema'
import { CampoFormulario } from './CampoFormulario'
import { CampoSenha } from './CampoSenha'

interface PainelLoginProps {
  /** Turma do convite: depois do login, o aluno sem turma entra nela. */
  turmaNome?: string
  enviando: boolean
  erro: string | null
  onEntrar: (dados: LoginFormData) => void
  onVoltar: () => void
  onLimparErro: () => void
}

/** Login de todos os perfis dentro do card da home: matrícula (aluno) ou e-mail. */
export function PainelLogin({ turmaNome, enviando, erro, onEntrar, onVoltar, onLimparErro }: PainelLoginProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', senha: '' },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((dados) => {
        if (!enviando) onEntrar(dados)
      })}
      onChange={onLimparErro}
      className="flex flex-col gap-5 text-left"
    >
      {turmaNome && (
        <div className="flex items-center gap-3 rounded-2xl bg-sabia-azul-claro px-4 py-3">
          <Users size={22} className="shrink-0 text-sabia-azul-escuro" aria-hidden="true" />
          <p className="text-base font-semibold text-tinta">
            Depois de entrar, você vai para a turma <strong className="font-extrabold">{turmaNome}</strong>
          </p>
        </div>
      )}

      <h2
        id="pa-titulo-entrar"
        tabIndex={-1}
        className={cn(fredoka.className, 'text-center text-2xl font-bold text-tinta outline-none sm:text-[1.75rem]')}
      >
        Entrar no Sabiá
      </h2>

      <CampoFormulario
        id="pa-login"
        label="Matrícula ou e-mail"
        dica="Aluno entra com a matrícula. Professor e administrador, com o e-mail."
        erro={errors.login?.message}
      >
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={campo}
            {...register('login')}
          />
        )}
      </CampoFormulario>

      <CampoFormulario id="pa-senha-login" label="Senha" erro={errors.senha?.message}>
        {(a11y) => <CampoSenha {...a11y} autoComplete="current-password" {...register('senha')} />}
      </CampoFormulario>

      {/* Região de alerta montada antes de qualquer erro, para ser anunciada. */}
      <div role="alert" id="pa-erro-login" tabIndex={-1} className="outline-none">
        {erro && <div className={alertaErro}>{erro}</div>}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onVoltar} disabled={enviando} className={botaoSecundario}>
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar
        </button>
        <button
          type="submit"
          disabled={enviando}
          aria-busy={enviando}
          className={cn(botaoPrincipal, fredoka.className, 'sm:min-w-44')}
        >
          {enviando ? (
            <>
              <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Entrando…
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </div>

      <Link href="/recuperar-senha" className={cn(linkDiscreto, 'self-center')}>
        Esqueci minha senha
      </Link>
    </form>
  )
}
