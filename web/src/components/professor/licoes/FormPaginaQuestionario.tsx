'use client'

import { ArrowDown, ArrowUp, Info, Plus, Trash2, X } from 'lucide-react'
import {
  LIMITES_QUESTIONARIO as L,
  adicionarAlternativa,
  adicionarPergunta,
  atualizarAlternativa,
  atualizarEnunciado,
  escolherCorreta,
  moverPergunta,
  removerAlternativa,
  removerPergunta,
  type ConteudoQuestionarioEditor,
  type PerguntaEditor,
} from '@/lib/licoes/questionario'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ContadorCaracteres } from './ContadorCaracteres'

interface Props {
  idBase: string
  conteudo: ConteudoQuestionarioEditor
  onChange: (parcial: Partial<ConteudoQuestionarioEditor>) => void
  /** Chaves como as do servidor: "percentualMinimo", "perguntas", "perguntas[0].alternativas[1]"... */
  erros: Record<string, string>
}

export const AVISO_QUESTIONARIO =
  'Os alunos podem tentar quantas vezes quiserem; vale a melhor nota. O questionário confere se o aluno leu ou assistiu, não é uma prova.'

function Erro({ texto }: { texto?: string }) {
  return texto ? <p className="text-xs text-destructive">{texto}</p> : null
}

/** Página QUESTIONARIO: percentual mínimo e perguntas de escolha única. */
export function FormPaginaQuestionario({ idBase, conteudo, onChange, erros }: Props) {
  const perguntas = conteudo.perguntas ?? []
  const mudar = (novas: PerguntaEditor[]) => {
    if (novas !== perguntas) onChange({ perguntas: novas })
  }

  const aoMudarPercentual = (texto: string) => {
    const t = texto.trim()
    onChange({ percentualMinimo: t === '' ? null : Number(t) })
  }

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        {AVISO_QUESTIONARIO}
      </p>

      <div className="space-y-1.5">
        <Label htmlFor={`${idBase}-percentual`}>Percentual mínimo de acertos</Label>
        <div className="flex items-center gap-2">
          <Input
            id={`${idBase}-percentual`}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            className="w-24"
            value={conteudo.percentualMinimo ?? ''}
            onChange={(e) => aoMudarPercentual(e.target.value)}
            aria-invalid={!!erros.percentualMinimo}
            aria-describedby={`${idBase}-percentual-dica`}
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <p id={`${idBase}-percentual-dica`} className="text-xs text-muted-foreground">
          Porcentagem de acertos para o aluno ser aprovado nesta página (padrão {L.percentualPadrao}%).
        </p>
        <Erro texto={erros.percentualMinimo} />
      </div>

      <ol className="space-y-3" aria-label="Perguntas">
        {perguntas.map((p, j) => {
          const idP = `${idBase}-p${j}`
          const prefixo = `perguntas[${j}]`
          return (
            <li key={j} className="space-y-3 rounded-lg border border-border p-3" aria-label={`Pergunta ${j + 1}`}>
              <div className="flex items-center gap-1">
                <span className="flex-1 text-sm font-semibold text-foreground">Pergunta {j + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => mudar(moverPergunta(perguntas, j, -1))}
                  disabled={j === 0}
                  aria-label={`Mover pergunta ${j + 1} para cima`}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => mudar(moverPergunta(perguntas, j, 1))}
                  disabled={j === perguntas.length - 1}
                  aria-label={`Mover pergunta ${j + 1} para baixo`}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => mudar(removerPergunta(perguntas, j))}
                  disabled={perguntas.length <= L.minPerguntas}
                  aria-label={`Remover pergunta ${j + 1}`}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${idP}-enunciado`}>
                    Enunciado <span className="text-destructive">*</span>
                  </Label>
                  <ContadorCaracteres texto={p.enunciado} maximo={L.enunciadoMax} />
                </div>
                <Textarea
                  id={`${idP}-enunciado`}
                  rows={2}
                  value={p.enunciado}
                  onChange={(e) => mudar(atualizarEnunciado(perguntas, j, e.target.value))}
                  aria-invalid={!!erros[`${prefixo}.enunciado`]}
                />
                <Erro texto={erros[`${prefixo}.enunciado`]} />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  Alternativas <span className="text-xs font-normal text-muted-foreground">(marque a certa)</span>
                </legend>
                {p.alternativas.map((alt, k) => {
                  const chaveAlt = `${prefixo}.alternativas[${k}]`
                  return (
                    <div key={k} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`${idP}-certa`}
                          className="size-4 shrink-0 accent-primary"
                          checked={p.correta === k}
                          onChange={() => mudar(escolherCorreta(perguntas, j, k))}
                          aria-label="Marcar como resposta certa"
                        />
                        <Input
                          value={alt}
                          onChange={(e) => mudar(atualizarAlternativa(perguntas, j, k, e.target.value))}
                          aria-label={`Alternativa ${k + 1} da pergunta ${j + 1}`}
                          aria-invalid={!!erros[chaveAlt]}
                        />
                        <ContadorCaracteres texto={alt} maximo={L.alternativaMax} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => mudar(removerAlternativa(perguntas, j, k))}
                          disabled={p.alternativas.length <= L.minAlternativas}
                          aria-label={`Remover alternativa ${k + 1} da pergunta ${j + 1}`}
                        >
                          <X />
                        </Button>
                      </div>
                      <Erro texto={erros[chaveAlt]} />
                    </div>
                  )
                })}
                <Erro texto={erros[`${prefixo}.alternativas`]} />
                <Erro texto={erros[`${prefixo}.correta`]} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => mudar(adicionarAlternativa(perguntas, j))}
                  disabled={p.alternativas.length >= L.maxAlternativas}
                >
                  <Plus size={14} />
                  Adicionar alternativa
                </Button>
              </fieldset>
            </li>
          )
        })}
      </ol>
      <Erro texto={erros.perguntas} />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => mudar(adicionarPergunta(perguntas))}
          disabled={perguntas.length >= L.maxPerguntas}
        >
          <Plus size={16} />
          Adicionar pergunta
        </Button>
        {perguntas.length >= L.maxPerguntas && (
          <span className="text-xs text-muted-foreground">Limite de {L.maxPerguntas} perguntas atingido.</span>
        )}
      </div>
    </div>
  )
}
