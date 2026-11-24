'use client'

import { useState } from 'react'
import { Check, CheckCircle2, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, botaoPrincipal, botaoSecundario, cartao, textoApoio } from '@/lib/estilos'
import { montarRespostas, todasRespondidas } from '@/lib/licoes/aluno'
import type { ConteudoQuestionarioAluno, CorrecaoQuestionario, ProgressoPagina } from '@/types/licao'

interface Props {
  conteudo: ConteudoQuestionarioAluno
  progresso: ProgressoPagina
  /** Envia uma tentativa (um índice por pergunta) e devolve a correção do servidor. */
  enviar: (respostas: number[]) => Promise<CorrecaoQuestionario>
}

/** Questionário de escolha única. O servidor só diz SE cada resposta está certa, nunca qual é a certa. */
export function QuestionarioAluno({ conteudo, progresso, enviar }: Props) {
  const total = conteudo.perguntas.length
  const [escolhas, setEscolhas] = useState<(number | null)[]>(() => conteudo.perguntas.map(() => null))
  const [correcao, setCorrecao] = useState<CorrecaoQuestionario | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const aprovadoAntes = progresso.questionario?.aprovado ?? false
  const aprovadoNaPagina = correcao?.aprovadoNaPagina ?? aprovadoAntes
  const melhor = correcao?.melhorPercentual ?? progresso.questionario?.melhorPercentual ?? null
  const tentativas = correcao?.tentativas ?? progresso.questionario?.tentativas ?? 0
  const prontas = todasRespondidas(escolhas, total)

  const escolher = (pergunta: number, alternativa: number) => {
    if (correcao) return
    setEscolhas((atual) => atual.map((e, i) => (i === pergunta ? alternativa : e)))
  }

  const aoEnviar = async () => {
    const respostas = montarRespostas(escolhas, total)
    if (!respostas || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      setCorrecao(await enviar(respostas))
    } catch {
      setErro('Não foi possível enviar suas respostas. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  const tentarDeNovo = () => {
    setCorrecao(null)
    setEscolhas(conteudo.perguntas.map(() => null))
  }

  return (
    <div className="space-y-5">
      <p className={textoApoio}>
        Responda às perguntas. Para passar, acerte pelo menos {conteudo.percentualMinimo}%. Você pode tentar quantas
        vezes quiser.
      </p>

      {aprovadoNaPagina && (
        <p className="inline-flex items-center gap-2 rounded-full border-2 border-sabia-verde bg-sabia-verde/15 px-3 py-1 text-base font-bold text-tinta">
          <CheckCircle2 size={18} className="text-sabia-verde" aria-hidden="true" />
          Página concluída
        </p>
      )}

      <ol className="space-y-4">
        {conteudo.perguntas.map((p, i) => {
          const certa = correcao?.perguntas[i]?.certa
          return (
            <li key={i} className={cn(cartao, 'p-5 shadow-none')}>
              <fieldset className="space-y-3" disabled={!!correcao}>
                <legend className="mb-3 flex w-full items-start gap-2 text-lg font-bold text-tinta">
                  <span className="flex-1">
                    {i + 1}. {p.enunciado}
                  </span>
                  {certa === true && (
                    <span className="inline-flex items-center gap-1 text-base text-sabia-verde">
                      <Check size={20} aria-hidden="true" />
                      <span className="sr-only">Resposta certa</span>
                    </span>
                  )}
                  {certa === false && (
                    <span className="inline-flex items-center gap-1 text-base text-sabia-erro">
                      <X size={20} aria-hidden="true" />
                      <span className="sr-only">Resposta errada</span>
                    </span>
                  )}
                </legend>
                {p.alternativas.map((alt, k) => (
                  <label
                    key={k}
                    className={cn(
                      'flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2 text-base text-tinta',
                      escolhas[i] === k ? 'border-sabia-azul bg-sabia-azul-claro' : 'border-tinta/20 bg-white',
                      'has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sabia-azul',
                      correcao && 'cursor-default'
                    )}
                  >
                    <input
                      type="radio"
                      name={`pergunta-${i}`}
                      className="size-5 shrink-0 accent-sabia-azul"
                      checked={escolhas[i] === k}
                      onChange={() => escolher(i, k)}
                    />
                    {alt}
                  </label>
                ))}
              </fieldset>
            </li>
          )
        })}
      </ol>

      {erro && <p role="alert" className={alertaErro}>{erro}</p>}

      {correcao ? (
        <div role="status" className="space-y-3">
          <p className={cn(fredoka.className, 'text-xl font-bold text-tinta')}>
            {correcao.aprovado
              ? `Você passou! Acertou ${correcao.acertos} de ${correcao.total} (${correcao.percentual}%).`
              : `Você acertou ${correcao.acertos} de ${correcao.total} (${correcao.percentual}%). Para passar são necessários ${conteudo.percentualMinimo}%. Tente de novo.`}
          </p>
          <button type="button" onClick={tentarDeNovo} className={botaoSecundario}>
            <RotateCcw size={16} aria-hidden="true" />
            Tentar de novo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={aoEnviar}
          disabled={!prontas || enviando}
          className={cn(botaoPrincipal, fredoka.className, 'disabled:cursor-not-allowed disabled:opacity-60')}
        >
          {enviando ? 'Enviando…' : 'Enviar respostas'}
        </button>
      )}

      {tentativas > 0 && (
        <p className={textoApoio}>
          Melhor resultado: {melhor ?? 0}% · Tentativas: {tentativas}
        </p>
      )}
    </div>
  )
}
