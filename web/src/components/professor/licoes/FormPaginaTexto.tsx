'use client'

import { useState } from 'react'
import { RichTextEditor } from '@/components/professor/atividades/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PreviaHtml } from './PreviaHtml'

interface Props {
  idBase: string
  html: string
  onChange: (html: string) => void
  erro?: string
  rotulo?: string
  obrigatorio?: boolean
}

/** Editor do texto de uma página (TEXTO, e o texto opcional de IMAGEM_TEXTO), com pré-visualização. */
export function FormPaginaTexto({ idBase, html, onChange, erro, rotulo = 'Texto', obrigatorio = true }: Props) {
  const [previa, setPrevia] = useState(false)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label id={`${idBase}-texto-rotulo`}>
          {rotulo} {obrigatorio ? <span className="text-destructive">*</span> : '(opcional)'}
        </Label>
        <Button type="button" variant="ghost" size="xs" onClick={() => setPrevia((v) => !v)} aria-pressed={previa}>
          {previa ? 'Voltar a editar' : 'Ver como o aluno vê'}
        </Button>
      </div>
      {previa ? (
        <div className="rounded-lg border border-border p-3">
          <PreviaHtml html={html} />
        </div>
      ) : (
        <div role="group" aria-labelledby={`${idBase}-texto-rotulo`}>
          <RichTextEditor value={html} onChange={onChange} titulos />
        </div>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}
