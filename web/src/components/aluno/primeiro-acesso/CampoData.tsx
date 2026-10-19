'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { ptBR } from 'react-day-picker/locale'
import { cn } from '@/lib/utils'
import { campo } from '@/lib/estilos'
import { dataISOLocal } from '@/lib/schemas/primeiroAcessoSchema'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { PropsAcessibilidadeCampo } from './CampoFormulario'

interface CampoDataProps extends PropsAcessibilidadeCampo {
  /** Data no formato yyyy-MM-dd ('' quando vazia). */
  valor: string
  onChange: (valor: string) => void
  onBlur: () => void
  min: string
  max: string
}

/** yyyy-MM-dd → Date local (new Date('yyyy-MM-dd') seria UTC e poderia voltar um dia). */
function paraData(valor: string): Date | undefined {
  if (!valor) return undefined
  const [ano, mes, dia] = valor.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function CampoData({ valor, onChange, onBlur, min, max, ...a11y }: CampoDataProps) {
  const [aberto, setAberto] = useState(false)
  const selecionada = paraData(valor)
  const inicio = paraData(min)!
  const fim = paraData(max)!

  return (
    <Popover
      open={aberto}
      onOpenChange={(abrir) => {
        setAberto(abrir)
        if (!abrir) onBlur()
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          {...a11y}
          className={cn(campo, 'flex items-center justify-between gap-3 text-left')}
        >
          <span className={cn(!selecionada && 'font-medium text-[#6b7290]')}>
            {selecionada ? selecionada.toLocaleDateString('pt-BR') : 'Escolha a data'}
          </span>
          <CalendarDays size={20} className="shrink-0 text-tinta-apoio" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          locale={ptBR}
          selected={selecionada}
          defaultMonth={selecionada ?? fim}
          startMonth={inicio}
          endMonth={fim}
          disabled={[{ before: inicio }, { after: fim }]}
          onSelect={(data) => {
            onChange(data ? dataISOLocal(data) : '')
            setAberto(false)
            onBlur()
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
