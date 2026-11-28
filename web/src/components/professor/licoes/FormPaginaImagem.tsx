'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { urlHttps, urlDataImagem } from '@/lib/schemas/licaoSchema'
import type { ConteudoImagemTexto } from '@/types/licaoProfessor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormPaginaTexto } from './FormPaginaTexto'

interface Props {
  idBase: string
  conteudo: ConteudoImagemTexto
  onChange: (parcial: Partial<ConteudoImagemTexto>) => void
  erros: Record<string, string>
}

/** Página IMAGEM_TEXTO: endereço https (ou data URI) da imagem, texto alternativo, legenda e texto opcional. */
export function FormPaginaImagem({ idBase, conteudo, onChange, erros }: Props) {
  const url = (conteudo.imagemUrl ?? '').trim()
  // Guarda a URL que falhou: trocar a URL volta a tentar carregar.
  const [urlComFalha, setUrlComFalha] = useState<string | null>(null)
  const podeMostrar = urlHttps(url) || urlDataImagem(url)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_12rem]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${idBase}-url`}>
              Endereço da imagem <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idBase}-url`}
              type="url"
              inputMode="url"
              placeholder="https://..."
              value={conteudo.imagemUrl ?? ''}
              onChange={(e) => onChange({ imagemUrl: e.target.value })}
              aria-invalid={!!erros.imagemUrl}
            />
            {erros.imagemUrl && <p className="text-xs text-destructive">{erros.imagemUrl}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idBase}-alt`}>
              Descrição da imagem (texto alternativo) <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idBase}-alt`}
              value={conteudo.alt ?? ''}
              onChange={(e) => onChange({ alt: e.target.value })}
              aria-invalid={!!erros.alt}
            />
            <p className="text-xs text-muted-foreground">Lida por leitores de tela para quem não vê a imagem.</p>
            {erros.alt && <p className="text-xs text-destructive">{erros.alt}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idBase}-legenda`}>Legenda (opcional)</Label>
            <Input
              id={`${idBase}-legenda`}
              value={conteudo.legenda ?? ''}
              onChange={(e) => onChange({ legenda: e.target.value })}
              aria-invalid={!!erros.legenda}
            />
            {erros.legenda && <p className="text-xs text-destructive">{erros.legenda}</p>}
          </div>
        </div>

        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 md:w-48">
          {podeMostrar && urlComFalha !== url ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem externa informada pelo professor
            <img
              src={url}
              alt={conteudo.alt ?? ''}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="h-full w-full object-contain"
              onError={() => setUrlComFalha(url)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 p-3 text-center text-xs text-muted-foreground">
              <ImageOff size={20} aria-hidden />
              {url && urlComFalha === url
                ? 'Não foi possível carregar a imagem. Confira o endereço.'
                : 'A pré-visualização aparece aqui.'}
            </div>
          )}
        </div>
      </div>

      <FormPaginaTexto
        idBase={idBase}
        html={conteudo.html ?? ''}
        onChange={(html) => onChange({ html })}
        erro={erros.html}
        obrigatorio={false}
      />
    </div>
  )
}
