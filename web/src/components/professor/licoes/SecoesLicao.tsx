'use client'

import type { Dispatch, ReactNode } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import { useTurmas } from '@/hooks/useTurmas'
import type { AcaoEditor, EstadoEditor, ItemProntidao } from '@/lib/licoes/editorLicao'
import { LIMITES_LICAO } from '@/lib/schemas/licaoSchema'
import type { ModoAtividade } from '@/types'
import { SeletorCenario } from '@/components/professor/cenarios/SeletorCenario'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function Secao({ numero, titulo, descricao, children }: {
  numero: number
  titulo: string
  descricao?: string
  children: ReactNode
}) {
  const id = `secao-${numero}`
  return (
    <section aria-labelledby={id}>
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div>
            <h2 id={id} className="text-lg font-bold text-foreground">
              {numero}. {titulo}
            </h2>
            {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
          </div>
          {children}
        </CardContent>
      </Card>
    </section>
  )
}

interface PropsMetadados {
  metadados: EstadoEditor['metadados']
  dispatch: Dispatch<AcaoEditor>
  erros: Partial<Record<'titulo' | 'conceito' | 'resumo', string>>
  desabilitado?: boolean
}

export function SecaoMetadados({ metadados, dispatch, erros, desabilitado }: PropsMetadados) {
  const mudar = (campo: 'titulo' | 'conceito' | 'resumo', valor: string) =>
    dispatch({ tipo: 'atualizarMetadados', metadados: { [campo]: valor } })
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="licao-titulo">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="licao-titulo"
          value={metadados.titulo}
          maxLength={LIMITES_LICAO.tituloMax}
          onChange={(e) => mudar('titulo', e.target.value)}
          aria-invalid={!!erros.titulo}
          disabled={desabilitado}
        />
        {erros.titulo && <p className="text-xs text-destructive">{erros.titulo}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="licao-conceito">
          Tema <span className="text-destructive">*</span>
        </Label>
        <Input
          id="licao-conceito"
          value={metadados.conceito}
          maxLength={LIMITES_LICAO.conceitoMax}
          placeholder="Ex.: Repetição"
          onChange={(e) => mudar('conceito', e.target.value)}
          aria-invalid={!!erros.conceito}
          disabled={desabilitado}
        />
        {erros.conceito && <p className="text-xs text-destructive">{erros.conceito}</p>}
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="licao-resumo">Descrição (opcional)</Label>
        <Textarea
          id="licao-resumo"
          rows={3}
          value={metadados.resumo}
          onChange={(e) => mudar('resumo', e.target.value)}
          aria-invalid={!!erros.resumo}
          disabled={desabilitado}
        />
        <p className="text-xs text-muted-foreground">
          {metadados.resumo.length}/{LIMITES_LICAO.resumoMax}
        </p>
        {erros.resumo && <p className="text-xs text-destructive">{erros.resumo}</p>}
      </div>
    </div>
  )
}

interface PropsPratica {
  estado: EstadoEditor
  dispatch: Dispatch<AcaoEditor>
  erro?: string | null
  desabilitado?: boolean
}

export function SecaoPratica({ estado, dispatch, erro, desabilitado }: PropsPratica) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="licao-modo">Tipo de prática</Label>
        <Select
          value={estado.modo}
          onValueChange={(modo) => dispatch({ tipo: 'trocarModo', modo: modo as ModoAtividade })}
          disabled={desabilitado}
        >
          <SelectTrigger id="licao-modo" className="w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BLOCOS">Blocos livres</SelectItem>
            <SelectItem value="JOGO_ROBO">Jogo do Robô</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {estado.modo === 'BLOCOS'
            ? 'O aluno monta um programa com blocos; a prática é concluída quando ele usa algum comando.'
            : 'O aluno programa o robô até o destino do cenário escolhido.'}
        </p>
      </div>
      {estado.modo === 'JOGO_ROBO' ? (
        <SeletorCenario
          key={estado.versao}
          valor={estado.cenarioJson}
          onChange={(cenarioJson) => dispatch({ tipo: 'trocarCenario', cenarioJson })}
          idBase="licao-cenario"
          erro={erro}
        />
      ) : (
        erro && <p className="text-sm text-destructive">{erro}</p>
      )}
    </div>
  )
}

interface PropsTurmas {
  turmaIds: number[]
  dispatch: Dispatch<AcaoEditor>
  desabilitado?: boolean
}

export function SecaoTurmas({ turmaIds, dispatch, desabilitado }: PropsTurmas) {
  const { data: turmas = [], isLoading } = useTurmas()
  const marcar = (id: number, marcado: boolean) =>
    dispatch({ tipo: 'trocarTurmas', turmaIds: marcado ? [...turmaIds, id] : turmaIds.filter((t) => t !== id) })

  if (isLoading) return <Skeleton className="h-16 w-full" />
  if (turmas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Você ainda não tem turmas.{' '}
        <Link href="/professor/turmas" className="text-primary underline-offset-4 hover:underline">
          Criar uma turma
        </Link>
      </p>
    )
  }
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium text-foreground">Turmas que veem esta lição</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {turmas.map((t) => {
          const id = `licao-turma-${t.id}`
          return (
            <label
              key={t.id}
              htmlFor={id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
            >
              <input
                id={id}
                type="checkbox"
                className="size-4 accent-primary"
                checked={turmaIds.includes(t.id)}
                onChange={(e) => marcar(t.id, e.target.checked)}
                disabled={desabilitado}
              />
              {t.nome}
            </label>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Só os alunos dessas turmas veem a lição, e só depois de publicada.
      </p>
    </fieldset>
  )
}

export function ChecklistPublicacao({ itens }: { itens: ItemProntidao[] }) {
  return (
    <ul className="space-y-1" aria-label="O que falta para publicar">
      {itens.map((item) => (
        <li key={item.texto} className="flex items-center gap-2 text-sm">
          {item.ok ? (
            <CheckCircle2 size={16} className="text-green-600" aria-hidden />
          ) : (
            <Circle size={16} className="text-muted-foreground" aria-hidden />
          )}
          <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>
            {item.texto}
            <span className="sr-only">{item.ok ? ' (feito)' : ' (pendente)'}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
