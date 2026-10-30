'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { AVATARES } from '@/lib/avatares'
import { redirecionarPorPerfil, salvarToken } from '@/lib/auth-helpers'
import { ErroRequisicao } from '@/lib/erroRequisicao'
import { botaoPrincipal } from '@/lib/estilos'
import type { LoginFormData } from '@/lib/schemas/loginSchema'
import {
  CAMPOS_PASSO_1,
  CAMPOS_PASSO_2,
  VALORES_INICIAIS,
  primeiroAcessoSchema,
  type CampoPrimeiroAcesso,
  type PrimeiroAcessoFormData,
} from '@/lib/schemas/primeiroAcessoSchema'
import { MENSAGEM_CODIGO_INVALIDO, type ConviteValido } from '@/services/convites'
import type { LoginResponse } from '@/services/auth'
import { useValidarConvite } from '@/hooks/useValidarConvite'
import { usePrimeiroAcesso } from '@/hooks/usePrimeiroAcesso'
import { useLogin } from '@/hooks/useLogin'
import { useEntrarNaTurma } from '@/hooks/useTurmasAluno'
import styles from '@/styles/home.module.css'
import { PainelCodigo, TAMANHO_CODIGO, limparCodigo, type MensagemCodigo } from './PainelCodigo'
import { FormularioDados } from './FormularioDados'
import { PainelEscolha } from './PainelEscolha'
import { PainelLogin } from './PainelLogin'
import { TelaBoasVindas } from './TelaBoasVindas'
import { idOpcaoAvatar } from './SeletorAvatar'

/**
 * Estados: inicial → codigo → (validando) → escolha → dados[passo 1 → passo 2] → sucesso
 *                                                   ↘ entrar → (vinculando) → sucesso | aviso
 * "Sou professor ou administrador" e "Já tenho conta" (sem código) levam direto a "entrar".
 * "/convite/[codigo]" começa em "validando" com o código do link.
 */
type Etapa = 'inicial' | 'codigo' | 'validando' | 'escolha' | 'dados' | 'entrar' | 'vinculando' | 'sucesso' | 'aviso'

const MSG_AJUDA_CODIGO = 'O código tem 6 letras e números.'
const MSG_FALHA_VALIDACAO = 'Não foi possível verificar agora. Tente novamente.'
const MSG_FALHA_ENVIO = 'Não foi possível concluir agora. Tente de novo.'
const MSG_MUITAS_TENTATIVAS = 'Muitas tentativas. Aguarde alguns minutos.'
const MSG_DADOS_INCORRETOS = 'Dados de acesso incorretos.'
const MSG_FALHA_LOGIN = 'Não foi possível entrar agora. Tente de novo.'
const MSG_CONTA_INATIVA = 'Conta inativa. Entre em contato com um administrador.'
const MSG_FALHA_VINCULO = 'Você entrou, mas não foi possível entrar na turma agora. Tente pelo painel da sua conta.'

const ORDEM_CAMPOS: readonly CampoPrimeiroAcesso[] = [...CAMPOS_PASSO_1, ...CAMPOS_PASSO_2]

const passoDoCampo = (campo: CampoPrimeiroAcesso): 1 | 2 =>
  (CAMPOS_PASSO_1 as readonly string[]).includes(campo) ? 1 : 2

interface Sucesso {
  resposta: LoginResponse
  turmaNome: string
  avatar?: string
}

/** Login feito, mas o vínculo com a turma do convite não aconteceu (409/404/falha). */
interface Aviso {
  resposta: LoginResponse
  texto: string
}

export function EntradaAluno({ codigoInicial }: { codigoInicial?: string }) {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>(codigoInicial !== undefined ? 'validando' : 'inicial')
  const [codigo, setCodigo] = useState(() => (codigoInicial ? limparCodigo(codigoInicial) : ''))
  const [mensagemCodigo, setMensagemCodigo] = useState<MensagemCodigo | null>(null)
  const [turma, setTurma] = useState<ConviteValido | null>(null)
  const [passo, setPasso] = useState<1 | 2>(1)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [conflitos, setConflitos] = useState<ReadonlySet<string>>(new Set())
  const [sucesso, setSucesso] = useState<Sucesso | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [erroLogin, setErroLogin] = useState<string | null>(null)
  const [voltarDoLogin, setVoltarDoLogin] = useState<Etapa>('inicial')
  const [anuncio, setAnuncio] = useState('')

  const validacao = useValidarConvite()
  const envio = usePrimeiroAcesso()
  const login = useLogin()
  const entradaTurma = useEntrarNaTurma()

  // Dados do formulário ficam só em memória (nada em localStorage/sessionStorage).
  const form = useForm<PrimeiroAcessoFormData>({
    resolver: zodResolver(primeiroAcessoSchema),
    defaultValues: VALORES_INICIAIS,
    mode: 'onTouched',
  })

  // ---------- Foco: a cada troca de estado/passo, o foco vai para o título ou campo ----------
  // Objeto novo a cada pedido: focar o mesmo id duas vezes também dispara o efeito.
  const [pedidoFoco, setPedidoFoco] = useState<{ id: string } | null>(null)
  const focar = (id: string) => setPedidoFoco({ id })
  useEffect(() => {
    if (pedidoFoco) document.getElementById(pedidoFoco.id)?.focus()
  }, [pedidoFoco])

  /** Região aria-live sempre montada; limpar antes garante reanúncio da mesma frase. */
  const anunciar = (texto: string) => {
    setAnuncio('')
    window.setTimeout(() => setAnuncio(texto), 60)
  }

  // ---------- Código ----------
  const mostrarErroCodigo = (texto: string, limparCampo: boolean) => {
    if (limparCampo) setCodigo('')
    setMensagemCodigo({ tipo: 'erro', texto })
    setEtapa('codigo')
    anunciar(texto)
    focar('pa-codigo')
  }

  const validarCodigo = (valor: string, limparSeInvalido: boolean) => {
    validacao.mutate(valor, {
      onSuccess: (convite) => {
        setTurma(convite)
        setMensagemCodigo(null)
        setEtapa('escolha')
        focar('pa-titulo-escolha')
      },
      onError: (erro) => {
        const invalido = erro instanceof ErroRequisicao && erro.status === 404
        mostrarErroCodigo(invalido ? MENSAGEM_CODIGO_INVALIDO : MSG_FALHA_VALIDACAO, invalido && limparSeInvalido)
      },
    })
  }

  const enviarCodigo = () => {
    if (codigo.length < TAMANHO_CODIGO) {
      setMensagemCodigo({ tipo: 'ajuda', texto: MSG_AJUDA_CODIGO })
      anunciar(MSG_AJUDA_CODIGO)
      focar('pa-codigo')
      return
    }
    validarCodigo(codigo, false)
  }

  // Link de convite: valida uma única vez ao montar (StrictMode monta duas vezes em dev).
  const validouLink = useRef(false)
  useEffect(() => {
    if (codigoInicial === undefined || validouLink.current) return
    validouLink.current = true
    validarCodigo(codigoInicial, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- executa só na montagem
  }, [])

  const alternarPainel = () => {
    if (etapa === 'inicial') {
      setEtapa('codigo')
      focar('pa-codigo')
    } else {
      setEtapa('inicial')
    }
  }

  // ---------- Escolha ----------
  const irParaPrimeiroAcesso = () => {
    setPasso(1)
    setEtapa('dados')
    focar('pa-titulo-passo')
  }

  const trocarCodigo = () => {
    setCodigo(turma?.codigo ?? codigo)
    setMensagemCodigo(null)
    setEtapa('codigo')
    focar('pa-codigo')
  }

  // ---------- Login ----------
  /** `origem` é para onde o Voltar do login leva; sem turma (código) não há vínculo pós-login. */
  const irParaLogin = (origem: Etapa) => {
    if (origem !== 'escolha') setTurma(null)
    setErroLogin(null)
    setVoltarDoLogin(origem)
    setEtapa('entrar')
    focar('pa-titulo-entrar')
  }

  const voltarLogin = () => {
    setEtapa(voltarDoLogin)
    if (voltarDoLogin === 'codigo') focar('pa-codigo')
    if (voltarDoLogin === 'escolha') focar('pa-titulo-escolha')
  }

  const vincularAposLogin = (resposta: LoginResponse, convite: ConviteValido) => {
    setEtapa('vinculando')
    entradaTurma.mutate(convite.codigo, {
      onSuccess: (turmaVinculada) => {
        setSucesso({ resposta, turmaNome: turmaVinculada.nome })
        setEtapa('sucesso')
        focar('pa-titulo-sucesso')
      },
      onError: (erro) => {
        const e = erro instanceof ErroRequisicao ? erro : null
        const texto =
          e?.status === 409 ? e.message : e?.status === 404 ? MENSAGEM_CODIGO_INVALIDO : MSG_FALHA_VINCULO
        setAviso({ resposta, texto })
        setEtapa('aviso')
        focar('pa-titulo-aviso')
      },
    })
  }

  const entrar = (dados: LoginFormData) => {
    setErroLogin(null)
    login.mutate(
      { login: dados.login.trim(), senha: dados.senha },
      {
        onSuccess: (resposta) => {
          salvarToken(resposta.token)
          if (resposta.role === 'ALUNO' && turma) {
            vincularAposLogin(resposta, turma)
          } else {
            redirecionarPorPerfil(resposta, router)
          }
        },
        onError: (erro) => {
          const status = erro instanceof ErroRequisicao ? erro.status : 0
          setErroLogin(
            status === 401
              ? MSG_DADOS_INCORRETOS
              : status === 403
                ? MSG_CONTA_INATIVA
                : status === 429
                  ? MSG_MUITAS_TENTATIVAS
                  : MSG_FALHA_LOGIN,
          )
          focar('pa-erro-login')
        },
      },
    )
  }

  // ---------- Dados ----------
  const focarCampo = (campo: CampoPrimeiroAcesso) => {
    if (campo === 'avatar') {
      const atual = form.getValues('avatar')
      focar(idOpcaoAvatar(atual || AVATARES[0].id))
    } else {
      focar(`pa-${campo}`)
    }
  }

  const irParaPrimeiroErro = (erros: FieldErrors<PrimeiroAcessoFormData>) => {
    const primeiro = ORDEM_CAMPOS.find((c) => erros[c])
    if (!primeiro) return
    setPasso(passoDoCampo(primeiro))
    focarCampo(primeiro)
  }

  const avancar = async () => {
    const ok = await form.trigger([...CAMPOS_PASSO_1], { shouldFocus: false })
    if (ok) {
      setPasso(2)
      focar('pa-titulo-passo')
    } else {
      irParaPrimeiroErro(form.formState.errors)
    }
  }

  const voltar = () => {
    if (passo === 2) {
      setPasso(1)
      focar('pa-titulo-passo')
      return
    }
    // Passo 1 → escolha (o formulário continua em memória).
    setEtapa('escolha')
    focar('pa-titulo-escolha')
  }

  const tratarErroEnvio = (erro: unknown) => {
    const e = erro instanceof ErroRequisicao ? erro : new ErroRequisicao(0, 'NETWORK_ERROR')

    if (e.status === 404 || e.campos?.codigoTurma) {
      setTurma(null)
      mostrarErroCodigo(MENSAGEM_CODIGO_INVALIDO, true)
      return
    }
    if (e.status === 422) {
      form.setError('confirmarSenha', { type: 'server', message: e.message })
      setPasso(2)
      focarCampo('confirmarSenha')
      return
    }
    if ((e.status === 400 || e.status === 409) && e.campos) {
      const campos = Object.entries(e.campos).filter(([c]) => (ORDEM_CAMPOS as readonly string[]).includes(c))
      if (campos.length > 0) {
        campos.forEach(([c, mensagem]) =>
          form.setError(c as CampoPrimeiroAcesso, { type: 'server', message: mensagem }),
        )
        if (e.status === 409) setConflitos(new Set(campos.map(([c]) => c)))
        const primeiro = ORDEM_CAMPOS.find((c) => e.campos?.[c])!
        setPasso(passoDoCampo(primeiro))
        focarCampo(primeiro)
        return
      }
    }
    // 503, rede, 429 ou resposta inesperada: mensagem no topo do passo, dados preservados.
    setErroGeral(e.status === 429 ? MSG_MUITAS_TENTATIVAS : MSG_FALHA_ENVIO)
    setPasso(2)
    focar('pa-erro-geral')
  }

  const enviar = form.handleSubmit((dados) => {
    if (!turma || envio.isPending) return
    setErroGeral(null)
    setConflitos(new Set())
    envio.mutate(
      { ...dados, codigoTurma: turma.codigo },
      {
        onSuccess: (resposta) => {
          salvarToken(resposta.token)
          setSucesso({ resposta, turmaNome: resposta.turma.nome, avatar: dados.avatar })
          form.reset(VALORES_INICIAIS) // senhas não ficam na memória do formulário
          setEtapa('sucesso')
          focar('pa-titulo-sucesso')
        },
        onError: tratarErroEnvio,
      },
    )
  }, irParaPrimeiroErro)

  // ---------- Render ----------
  const painelAberto = etapa !== 'inicial'
  const mostrarEscolha = etapa === 'inicial' || etapa === 'codigo'

  return (
    <div className="flex w-full flex-col items-center">
      {mostrarEscolha && (
        <div
          className={cn(
            'flex w-full items-center justify-center gap-3',
            painelAberto ? 'flex-row' : 'flex-col gap-4 sm:flex-row',
          )}
        >
          <div className={etapa === 'inicial' ? styles.pulse : undefined}>
            <button
              type="button"
              aria-expanded={painelAberto}
              aria-controls="pa-painel"
              onClick={alternarPainel}
              className={cn(
                buttonVariants({ size: 'lg' }),
                fredoka.className,
                'h-auto rounded-full border-2 border-tinta bg-sabia-amarelo font-bold text-tinta',
                'transition-[transform,box-shadow,background-color] duration-150',
                'hover:-translate-y-0.5 hover:bg-sabia-amarelo-hover',
                'focus-visible:border-tinta focus-visible:ring-4 focus-visible:ring-sabia-azul focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f9ff]',
                painelAberto
                  ? 'min-h-12 px-5 py-2 text-base shadow-[0_3px_0_#1e2546] hover:shadow-[0_4px_0_#1e2546] active:translate-y-0.5 active:shadow-[0_1px_0_#1e2546]'
                  : 'min-h-14 min-w-56 px-9 py-3 text-xl shadow-[0_6px_0_#1e2546] hover:shadow-[0_8px_0_#1e2546] active:translate-y-1 active:shadow-[0_2px_0_#1e2546]',
              )}
            >
              Sou aluno
            </button>
          </div>
          <button
            type="button"
            onClick={() => irParaLogin(etapa)}
            className={cn(
              fredoka.className,
              'inline-flex min-h-12 items-center justify-center rounded-full border-2 border-tinta bg-white/80 text-center font-bold text-tinta',
              'transition-colors duration-150 hover:bg-white',
              'outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f9ff]',
              painelAberto ? 'px-4 py-1.5 text-base leading-tight' : 'min-w-56 px-7 py-2.5 text-lg',
            )}
          >
            Sou professor ou administrador
          </button>
        </div>
      )}

      {/* Sempre montado: alvo do aria-controls; [data-painel-aberto] ajusta o hero via CSS. */}
      <div
        id="pa-painel"
        data-painel-aberto={painelAberto ? '' : undefined}
        className={cn('w-full', painelAberto && 'mt-6')}
      >
        {painelAberto && (
          <section
            key={etapa === 'sucesso' ? 'sucesso' : 'fluxo'}
            aria-label="Acesso ao Sabiá"
            className={cn(
              styles.rise,
              'mx-auto w-full max-w-md rounded-[2rem] border-2 border-tinta bg-white p-5 text-left shadow-[0_6px_0_#1e2546] sm:max-w-lg sm:p-7',
            )}
          >
            {etapa === 'codigo' && (
              <PainelCodigo
                codigo={codigo}
                onCodigoChange={(valor) => {
                  setCodigo(valor)
                  setMensagemCodigo(null)
                }}
                mensagem={mensagemCodigo}
                validando={validacao.isPending}
                onEnviar={enviarCodigo}
                onJaTenhoConta={() => irParaLogin('codigo')}
              />
            )}

            {etapa === 'validando' && <Carregando texto="Verificando o convite…" />}

            {etapa === 'escolha' && turma && (
              <PainelEscolha
                turmaNome={turma.turmaNome}
                onPrimeiroAcesso={irParaPrimeiroAcesso}
                onJaTenhoConta={() => irParaLogin('escolha')}
                onVoltar={trocarCodigo}
              />
            )}

            {etapa === 'entrar' && (
              <PainelLogin
                turmaNome={turma?.turmaNome}
                enviando={login.isPending}
                erro={erroLogin}
                onEntrar={entrar}
                onVoltar={voltarLogin}
                onLimparErro={() => setErroLogin(null)}
              />
            )}

            {etapa === 'vinculando' && <Carregando texto="Entrando na turma…" />}

            {etapa === 'aviso' && aviso && (
              <TelaAviso texto={aviso.texto} onContinuar={() => redirecionarPorPerfil(aviso.resposta, router)} />
            )}

            {etapa === 'dados' && turma && (
              <FormProvider {...form}>
                <FormularioDados
                  turmaNome={turma.turmaNome}
                  passo={passo}
                  enviando={envio.isPending}
                  erroGeral={erroGeral}
                  conflitos={conflitos}
                  onJaTenhoConta={() => irParaLogin('escolha')}
                  onAvancar={avancar}
                  onVoltar={voltar}
                  onEnviar={enviar}
                />
              </FormProvider>
            )}

            {etapa === 'sucesso' && sucesso && (
              <TelaBoasVindas
                nome={sucesso.resposta.nome}
                turmaNome={sucesso.turmaNome}
                avatar={sucesso.avatar}
                onContinuar={() => redirecionarPorPerfil(sucesso.resposta, router)}
              />
            )}
          </section>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </p>
    </div>
  )
}

function Carregando({ texto }: { texto: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-2 text-center">
      <Loader2 size={32} className="animate-spin text-sabia-azul motion-reduce:animate-none" aria-hidden="true" />
      <p className="text-lg font-bold text-tinta">{texto}</p>
      <div className="flex w-full flex-col gap-3" aria-hidden="true">
        <div className="h-12 w-full animate-pulse rounded-2xl bg-tinta/10 motion-reduce:animate-none" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-tinta/10 motion-reduce:animate-none" />
        <div className="mx-auto h-14 w-2/3 animate-pulse rounded-full bg-tinta/10 motion-reduce:animate-none" />
      </div>
    </div>
  )
}

function TelaAviso({ texto, onContinuar }: { texto: string; onContinuar: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2
        id="pa-titulo-aviso"
        tabIndex={-1}
        className={cn(fredoka.className, 'text-2xl font-bold text-tinta outline-none')}
      >
        Você entrou no Sabiá
      </h2>
      <p role="status" className="text-lg font-semibold text-tinta">
        {texto}
      </p>
      <button type="button" onClick={onContinuar} className={cn(botaoPrincipal, fredoka.className, 'w-full')}>
        Continuar
      </button>
    </div>
  )
}
