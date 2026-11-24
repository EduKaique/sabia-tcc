'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCenarios } from '@/hooks/useCenarios'
import { PREFIXO_CENARIO_SALVO, PRESETS_CENARIO, lerCenario, opcaoDoCenario } from '@/lib/cenariosRobo'
import {
  OPCAO_ATUAL,
  lerLimite,
  montarCenarioJson,
  opcaoInicial,
  resolverOpcao,
} from '@/lib/licoes/seletorCenario'
import { PalcoRobo } from '@/components/aluno/editor/PalcoRobo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  /** cenarioJson atual (snapshot gravado). */
  valor: string | null
  onChange: (cenarioJson: string | null) => void
  /** Prefixo dos ids dos campos, para mais de um seletor na mesma página. */
  idBase?: string
  erro?: string | null
}

/**
 * Escolha do cenário do Jogo do Robô: prontos, cenários salvos do professor ou o snapshot atual. Produz o
 * cenarioJson com o "Limite de blocos" aplicado. Inicializa a partir de `valor` na montagem: use `key` para
 * reinicializar depois de carregar outro valor do servidor.
 */
export function SeletorCenario({ valor, onChange, idBase = 'cenario', erro }: Props) {
  const { data: salvos = [] } = useCenarios()
  const [atual] = useState(() => lerCenario(valor))
  const [opcao, setOpcao] = useState<string | undefined>(() => opcaoInicial(valor, []))
  const [limiteTexto, setLimiteTexto] = useState(() => (atual?.maxBlocos ? String(atual.maxBlocos) : ''))
  // Os cenários salvos chegam depois: se o snapshot bate com um deles, a opção "atual" passa a ser esse salvo.
  const correspondente = atual ? opcaoDoCenario(atual, salvos) : null
  const opcaoEfetiva = opcao === OPCAO_ATUAL && correspondente ? correspondente : opcao
  const mostrarAtual = !!atual && correspondente === null
  const escolhido = resolverOpcao(opcaoEfetiva, atual, salvos)
  const limite = lerLimite(limiteTexto)

  const emitir = (novaOpcao: string | undefined, novoLimite: number | undefined | null) => {
    const base = resolverOpcao(novaOpcao, atual, salvos)
    if (!base || novoLimite === null) return
    onChange(montarCenarioJson(base, novoLimite))
  }

  const escolher = (novaOpcao: string) => {
    setOpcao(novaOpcao)
    // O limite do cenário escolhido preenche o campo; sem limite próprio, vale o que já estava no campo.
    const doCenario = resolverOpcao(novaOpcao, atual, salvos)?.maxBlocos
    const texto = doCenario ? String(doCenario) : limiteTexto
    setLimiteTexto(texto)
    emitir(novaOpcao, lerLimite(texto))
  }

  const mudarLimite = (texto: string) => {
    setLimiteTexto(texto)
    emitir(opcaoEfetiva, lerLimite(texto))
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`${idBase}-opcao`}>
              Cenário <span className="text-destructive">*</span>
            </Label>
            <Link
              href="/professor/cenarios"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Gerenciar cenários
            </Link>
          </div>
          <Select value={opcaoEfetiva} onValueChange={escolher}>
            <SelectTrigger id={`${idBase}-opcao`} className="w-full" aria-invalid={!!erro}>
              <SelectValue placeholder="Escolha um cenário" />
            </SelectTrigger>
            <SelectContent>
              {mostrarAtual && <SelectItem value={OPCAO_ATUAL}>Cenário personalizado (atual)</SelectItem>}
              <SelectGroup>
                <SelectLabel>Prontos</SelectLabel>
                {PRESETS_CENARIO.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectGroup>
              {salvos.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Meus cenários</SelectLabel>
                  {salvos.map((c) => (
                    <SelectItem key={c.id} value={`${PREFIXO_CENARIO_SALVO}${c.id}`}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          {opcaoEfetiva === OPCAO_ATUAL && (
            <p className="text-xs text-muted-foreground">
              Este é o cenário atual da lição e não corresponde a nenhuma opção da lista.
            </p>
          )}
          {erro && <p className="text-xs text-destructive">{erro}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idBase}-limite`}>Limite de blocos (opcional)</Label>
          <Input
            id={`${idBase}-limite`}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className="w-40"
            value={limiteTexto}
            onChange={(e) => mudarLimite(e.target.value)}
            aria-invalid={limite === null}
          />
          {limite === null && (
            <p className="text-xs text-destructive">Use um número inteiro a partir de 1, ou deixe vazio.</p>
          )}
        </div>
      </div>

      {escolhido && (
        <div className="size-40 rounded-md border border-border p-1.5" aria-label="Pré-visualização do cenário">
          <PalcoRobo cenario={escolhido} posicao={escolhido.inicio} erro={false} />
        </div>
      )}
    </div>
  )
}
