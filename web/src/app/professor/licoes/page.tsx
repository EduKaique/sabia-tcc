'use client'

import { useState } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import { useLicoesProfessor } from '@/hooks/useLicoesProfessor'
import { useTurmas } from '@/hooks/useTurmas'
import { extrairErro } from '@/lib/licoes/errosLicao'
import type { LicaoProfessorResumo } from '@/types/licaoProfessor'
import { LicaoCard } from '@/components/professor/licoes/LicaoCard'
import { NovaLicaoDialog } from '@/components/professor/licoes/NovaLicaoDialog'
import { ArquivarLicaoDialog } from '@/components/professor/licoes/ArquivarLicaoDialog'
import { LoadingSkeleton } from '@/components/professor/atividades/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TODAS = 'todas'

export default function LicoesPage() {
  const [filtro, setFiltro] = useState(TODAS)
  const turmaId = filtro === TODAS ? undefined : Number(filtro)
  const { data: licoes = [], isLoading, error } = useLicoesProfessor(turmaId)
  const { data: turmas = [] } = useTurmas()
  const [novaAberta, setNovaAberta] = useState(false)
  const [novaKey, setNovaKey] = useState(0)
  const [paraArquivar, setParaArquivar] = useState<LicaoProfessorResumo | null>(null)

  const abrirNova = () => {
    setNovaKey((k) => k + 1)
    setNovaAberta(true)
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lições</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conteúdo para as suas turmas estudarem, com uma prática no final.
          </p>
        </div>
        <Button onClick={abrirNova} size="lg">
          <Plus size={16} />
          Nova lição
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Label htmlFor="filtro-turma">Turma</Label>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger id="filtro-turma" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as lições</SelectItem>
            {turmas.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <p className="text-sm text-destructive">{extrairErro(error).mensagem}</p>
      ) : licoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <GraduationCap size={32} className="text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            {turmaId ? 'Nenhuma lição nesta turma' : 'Nenhuma lição criada'}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {turmaId
              ? 'Vincule uma lição a esta turma no editor, ou escolha outra turma.'
              : 'Crie uma lição com páginas de conteúdo e uma prática para os alunos.'}
          </p>
          {!turmaId && <Button onClick={abrirNova}>Nova lição</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {licoes.map((l) => (
            <LicaoCard key={l.id} licao={l} onArquivar={setParaArquivar} />
          ))}
        </div>
      )}

      <NovaLicaoDialog key={novaKey} open={novaAberta} onOpenChange={setNovaAberta} />
      <ArquivarLicaoDialog licao={paraArquivar} onOpenChange={(open) => !open && setParaArquivar(null)} />
    </div>
  )
}
