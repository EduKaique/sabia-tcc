'use client'

import { useState } from 'react'
import { MapIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCenarios } from '@/hooks/useCenarios'
import { lerCenario } from '@/lib/cenariosRobo'
import type { CenarioSalvo } from '@/types/cenario'
import { CenarioFormDialog } from '@/components/professor/cenarios/CenarioFormDialog'
import { ExcluirCenarioDialog } from '@/components/professor/cenarios/ExcluirCenarioDialog'
import { PalcoRobo } from '@/components/aluno/editor/PalcoRobo'
import { LoadingSkeleton } from '@/components/professor/atividades/LoadingSkeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const formatarData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

export default function CenariosPage() {
  const { data: cenarios = [], isLoading } = useCenarios()
  const [formAberto, setFormAberto] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [emEdicao, setEmEdicao] = useState<CenarioSalvo | null>(null)
  const [paraExcluir, setParaExcluir] = useState<CenarioSalvo | null>(null)

  const abrir = (cenario: CenarioSalvo | null) => {
    setEmEdicao(cenario)
    setFormKey((k) => k + 1)
    setFormAberto(true)
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cenários do robô</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monte cenários do Jogo do Robô para usar nas suas atividades.
          </p>
        </div>
        <Button onClick={() => abrir(null)}>
          <Plus size={16} />
          Novo cenário
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : cenarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <MapIcon size={32} className="text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Nenhum cenário criado</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Crie um cenário para escolher no formulário das atividades do Jogo do Robô.
          </p>
          <Button onClick={() => abrir(null)}>Novo cenário</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cenarios.map((c) => {
            const cenario = lerCenario(c.cenarioJson)
            return (
              <Card key={c.id} className="rounded-xl border border-border bg-card shadow-sm">
                <CardContent className="flex gap-4 p-5">
                  {cenario && (
                    <div className="size-20 shrink-0 rounded-md border border-border p-1">
                      <PalcoRobo cenario={cenario} posicao={cenario.inicio} erro={false} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-foreground">{c.nome}</h3>
                    {cenario && (
                      <p className="text-sm text-muted-foreground">
                        {cenario.linhas} × {cenario.colunas}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Atualizado em {formatarData(c.atualizadoEm)}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => abrir(c)}>
                        <Pencil size={14} />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setParaExcluir(c)}
                        aria-label={`Excluir ${c.nome}`}
                      >
                        <Trash2 size={14} />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CenarioFormDialog key={formKey} open={formAberto} onOpenChange={setFormAberto} cenario={emEdicao} />
      <ExcluirCenarioDialog cenario={paraExcluir} onOpenChange={(open) => !open && setParaExcluir(null)} />
    </div>
  )
}
