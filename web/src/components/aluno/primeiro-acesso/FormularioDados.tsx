'use client'

import { ArrowLeft, Loader2, RotateCcw, Users } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { limitesDataNascimento, type PrimeiroAcessoFormData } from '@/lib/schemas/primeiroAcessoSchema'
import { CampoFormulario } from './CampoFormulario'
import { CampoSenha } from './CampoSenha'
import { SeletorAvatar } from './SeletorAvatar'
import { alertaErro, botaoPrincipal, botaoSecundario, campo, linkDiscreto } from '@/lib/estilos'

interface FormularioDadosProps {
  turmaNome: string
  passo: 1 | 2
  enviando: boolean
  erroGeral: string | null
  /** Campos com 409 (matrícula já cadastrada): oferecem "Já tenho conta? Entrar". */
  conflitos: ReadonlySet<string>
  onJaTenhoConta: () => void
  onAvancar: () => void
  onVoltar: () => void
  onEnviar: () => void
}

export function FormularioDados({
  turmaNome,
  passo,
  enviando,
  erroGeral,
  conflitos,
  onJaTenhoConta,
  onAvancar,
  onVoltar,
  onEnviar,
}: FormularioDadosProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<PrimeiroAcessoFormData>()
  const avatar = watch('avatar')
  const { min, max } = limitesDataNascimento()

  const linkJaTenhoConta =
    conflitos.has('matricula') && errors.matricula ? (
      <button type="button" onClick={onJaTenhoConta} className={cn(linkDiscreto, 'self-start px-0')}>
        Já tenho conta? Entrar
      </button>
    ) : null

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        // Enter no passo 1 avança; no passo 2 envia.
        if (passo === 1) onAvancar()
        else if (!enviando) onEnviar()
      }}
      className="flex flex-col gap-5 text-left"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[#eef3ff] px-4 py-3">
        <Users size={22} className="shrink-0 text-[#2f55c0]" aria-hidden="true" />
        <p className="text-base font-semibold text-[#1e2546]">
          Você vai entrar na turma <strong className="font-extrabold">{turmaNome}</strong>
        </p>
      </div>

      <div>
        <p className="flex items-center gap-3 text-sm font-bold text-[#3a4266]">
          Passo {passo} de 2
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-8 rounded-full bg-[#426cda]" />
            <span className={cn('h-2 w-8 rounded-full', passo === 2 ? 'bg-[#426cda]' : 'bg-[#1e2546]/15')} />
          </span>
        </p>
        <h2
          id="pa-titulo-passo"
          tabIndex={-1}
          className={cn(fredoka.className, 'mt-1 text-2xl font-bold text-[#1e2546] outline-none sm:text-[1.75rem]')}
        >
          {passo === 1 ? 'Conte sobre você' : 'Crie seu acesso'}
        </h2>
      </div>

      {/* Os dois passos ficam montados: Voltar/Continuar nunca perdem o que foi digitado. */}
      <div className={cn('flex flex-col gap-5', passo !== 1 && 'hidden')}>
        <CampoFormulario id="pa-nomeCompleto" label="Nome completo" erro={errors.nomeCompleto?.message}>
          {(a11y) => (
            <input
              {...a11y}
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              className={campo}
              {...register('nomeCompleto')}
            />
          )}
        </CampoFormulario>

        <CampoFormulario
          id="pa-matricula"
          label="Matrícula"
          dica="Você vai usar sua matrícula para entrar. Se não souber, pergunte ao professor."
          erro={errors.matricula?.message}
          extra={linkJaTenhoConta}
        >
          {(a11y) => (
            <input
              {...a11y}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={campo}
              {...register('matricula')}
            />
          )}
        </CampoFormulario>

        <CampoFormulario id="pa-dataNascimento" label="Data de nascimento" erro={errors.dataNascimento?.message}>
          {(a11y) => (
            <input
              {...a11y}
              type="date"
              min={min}
              max={max}
              autoComplete="bday"
              className={cn(campo, 'appearance-none')}
              {...register('dataNascimento')}
            />
          )}
        </CampoFormulario>

        <SeletorAvatar registro={register('avatar')} valor={avatar} erro={errors.avatar?.message} />
      </div>

      <div className={cn('flex flex-col gap-5', passo !== 2 && 'hidden')}>
        <CampoFormulario
          id="pa-senha"
          label="Senha"
          dica="Use pelo menos 8 caracteres."
          erro={errors.senha?.message}
        >
          {(a11y) => <CampoSenha {...a11y} {...register('senha')} />}
        </CampoFormulario>

        <CampoFormulario id="pa-confirmarSenha" label="Confirmar senha" erro={errors.confirmarSenha?.message}>
          {(a11y) => <CampoSenha {...a11y} {...register('confirmarSenha')} />}
        </CampoFormulario>

        {/* Região de alerta montada antes de qualquer erro, para ser anunciada. */}
        <div role="alert" id="pa-erro-geral" tabIndex={-1} className="outline-none">
          {erroGeral && (
            <div className={cn(alertaErro, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
              <span>{erroGeral}</span>
              <button
                type="submit"
                disabled={enviando}
                className={cn(botaoSecundario, 'min-h-12 shrink-0 border-[#8c1d18] text-[#8c1d18]')}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Tentar de novo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onVoltar} disabled={enviando} className={botaoSecundario}>
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar
        </button>
        <button
          type="submit"
          disabled={enviando}
          aria-busy={enviando}
          className={cn(botaoPrincipal, fredoka.className, 'sm:min-w-52')}
        >
          {passo === 1 ? (
            'Continuar'
          ) : enviando ? (
            <>
              <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Entrando…
            </>
          ) : (
            'Entrar na turma'
          )}
        </button>
      </div>
    </form>
  )
}
