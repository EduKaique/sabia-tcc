'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cartao, rotulo } from '@/lib/estilos'
import { turmasDasLicoes } from '@/lib/licoes/aluno'
import type { LicaoResumo } from '@/types/licao'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LicaoCard } from './LicaoCard'

const TODAS = 'todas'

/** Lista plana, na ordem do servidor. O filtro por turma só aparece quando há duas ou mais turmas. */
export function ListaLicoes({ licoes }: { licoes: LicaoResumo[] }) {
  const turmas = turmasDasLicoes(licoes)
  const [turma, setTurma] = useState(TODAS)
  const visiveis = turma === TODAS ? licoes : licoes.filter((l) => l.turmas.some((t) => String(t.id) === turma))

  if (licoes.length === 0) {
    return (
      <div className={cn(cartao, 'flex flex-col items-center justify-center px-6 py-12 text-center')}>
        <BookOpen size={40} className="mb-3 text-sabia-azul" aria-hidden="true" />
        <p className="text-base font-semibold text-tinta-apoio">Seu professor ainda não publicou lições para a sua turma.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {turmas.length >= 2 && (
        <div className="flex flex-wrap items-center gap-2">
          <span id="rotulo-filtro-turma" className={rotulo}>
            Turma
          </span>
          <Select value={turma} onValueChange={setTurma}>
            <SelectTrigger aria-labelledby="rotulo-filtro-turma" className="min-w-48 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas as turmas</SelectItem>
              {turmas.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <ol className="space-y-4">
        {visiveis.map((licao) => (
          <li key={licao.id}>
            <LicaoCard licao={licao} />
          </li>
        ))}
      </ol>
    </div>
  )
}
