'use client'

import { useState, type Dispatch } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Plus,
  Trash2,
  Video,
} from 'lucide-react'
import {
  MAX_PAGINAS,
  ROTULO_TIPO,
  paginaEditavel,
  type AcaoEditor,
  type PaginaEditor,
  type TipoEditavel,
} from '@/lib/licoes/editorLicao'
import type { ConteudoQuestionarioEditor } from '@/lib/licoes/questionario'
import type { ConteudoVideoEditor } from '@/lib/licoes/youtube'
import type { ConteudoImagemTexto, ConteudoTexto } from '@/types/licaoProfessor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FormPaginaImagem } from './FormPaginaImagem'
import { FormPaginaQuestionario } from './FormPaginaQuestionario'
import { FormPaginaTexto } from './FormPaginaTexto'
import { FormPaginaVideo } from './FormPaginaVideo'
import { ResumoPaginaSomenteLeitura } from './ResumoPaginaSomenteLeitura'

interface Props {
  paginas: PaginaEditor[]
  dispatch: Dispatch<AcaoEditor>
  /** Erros por chave da página (validação do cliente ou "paginas[i].campo" do servidor). */
  erros: Record<string, Record<string, string>>
  desabilitado?: boolean
}

const BOTOES_ADICIONAR: { tipo: TipoEditavel; rotulo: string; Icone: typeof FileText }[] = [
  { tipo: 'TEXTO', rotulo: 'Texto', Icone: FileText },
  { tipo: 'IMAGEM_TEXTO', rotulo: 'Imagem e texto', Icone: ImageIcon },
  { tipo: 'VIDEO_YOUTUBE', rotulo: 'Vídeo (YouTube)', Icone: Video },
  { tipo: 'QUESTIONARIO', rotulo: 'Questionário', Icone: ListChecks },
]

/** Lista ordenada de páginas: adicionar, recolher, mover, remover e editar texto, imagem, vídeo e questionário. */
export function ConstrutorPaginas({ paginas, dispatch, erros, desabilitado = false }: Props) {
  // Páginas do servidor começam recolhidas; as novas e as com erro, abertas. O conjunto guarda as que o
  // professor inverteu em relação a esse padrão.
  const [invertidas, setInvertidas] = useState<Set<string>>(() => new Set())
  const [paraRemover, setParaRemover] = useState<{ chave: string; numero: number } | null>(null)
  const noLimite = paginas.length >= MAX_PAGINAS

  const alternar = (chave: string) =>
    setInvertidas((atual) => {
      const novo = new Set(atual)
      if (novo.has(chave)) novo.delete(chave)
      else novo.add(chave)
      return novo
    })

  const adicionar = (tipoPagina: TipoEditavel) => dispatch({ tipo: 'adicionarPagina', tipoPagina })

  return (
    <div className="space-y-3">
      {paginas.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Nenhuma página ainda. Adicione o conteúdo que os alunos vão ler antes da prática.
        </p>
      )}

      <ol className="space-y-3">
        {paginas.map((p, i) => {
          const numero = i + 1
          const editavel = paginaEditavel(p.tipo)
          const errosPagina = erros[p.chave] ?? {}
          const temErro = Object.keys(errosPagina).length > 0
          const aberta = editavel && invertidas.has(p.chave) !== (p.id == null || temErro)
          const idBase = `pagina-${p.chave}`
          return (
            <li
              key={p.chave}
              className={`rounded-xl border bg-card ${temErro ? 'border-destructive' : 'border-border'}`}
              aria-label={`Página ${numero}`}
            >
              <div className="flex flex-wrap items-center gap-2 p-3">
                {editavel ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => alternar(p.chave)}
                    aria-expanded={aberta}
                    aria-controls={`${idBase}-corpo`}
                    aria-label={aberta ? `Recolher página ${numero}` : `Abrir página ${numero}`}
                  >
                    {aberta ? <ChevronDown /> : <ChevronRight />}
                  </Button>
                ) : (
                  <span className="w-8" aria-hidden />
                )}
                <span className="text-sm font-semibold text-foreground">Página {numero}</span>
                <Badge variant="outline">{ROTULO_TIPO[p.tipo]}</Badge>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {p.titulo.trim() || 'Sem título'}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => dispatch({ tipo: 'moverPagina', chave: p.chave, direcao: -1 })}
                    disabled={desabilitado || i === 0}
                    aria-label={`Mover página ${numero} para cima`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => dispatch({ tipo: 'moverPagina', chave: p.chave, direcao: 1 })}
                    disabled={desabilitado || i === paginas.length - 1}
                    aria-label={`Mover página ${numero} para baixo`}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setParaRemover({ chave: p.chave, numero })}
                    disabled={desabilitado}
                    aria-label={`Remover página ${numero}`}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>

              {!editavel && (
                <div className="border-t border-border px-4 py-3">
                  <ResumoPaginaSomenteLeitura tipo={p.tipo} />
                </div>
              )}

              {editavel && aberta && (
                <div id={`${idBase}-corpo`} className="space-y-4 border-t border-border px-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${idBase}-titulo`}>Título da página (opcional)</Label>
                    <Input
                      id={`${idBase}-titulo`}
                      value={p.titulo}
                      onChange={(e) => dispatch({ tipo: 'atualizarPagina', chave: p.chave, titulo: e.target.value })}
                      aria-invalid={!!errosPagina.titulo}
                      disabled={desabilitado}
                    />
                    {errosPagina.titulo && <p className="text-xs text-destructive">{errosPagina.titulo}</p>}
                  </div>
                  {p.tipo === 'TEXTO' && (
                    <FormPaginaTexto
                      idBase={idBase}
                      html={(p.conteudo as ConteudoTexto).html ?? ''}
                      onChange={(html) => dispatch({ tipo: 'atualizarPagina', chave: p.chave, conteudo: { html } })}
                      erro={errosPagina.html}
                    />
                  )}
                  {p.tipo === 'IMAGEM_TEXTO' && (
                    <FormPaginaImagem
                      idBase={idBase}
                      conteudo={p.conteudo as ConteudoImagemTexto}
                      onChange={(conteudo) => dispatch({ tipo: 'atualizarPagina', chave: p.chave, conteudo })}
                      erros={errosPagina}
                    />
                  )}
                  {p.tipo === 'VIDEO_YOUTUBE' && (
                    <FormPaginaVideo
                      idBase={idBase}
                      conteudo={p.conteudo as ConteudoVideoEditor}
                      sugerirDados={p.id == null}
                      onChange={(conteudo) => dispatch({ tipo: 'atualizarPagina', chave: p.chave, conteudo })}
                      erros={errosPagina}
                    />
                  )}
                  {p.tipo === 'QUESTIONARIO' && (
                    <FormPaginaQuestionario
                      idBase={idBase}
                      conteudo={p.conteudo as ConteudoQuestionarioEditor}
                      onChange={(conteudo) => dispatch({ tipo: 'atualizarPagina', chave: p.chave, conteudo })}
                      erros={errosPagina}
                    />
                  )}
                  {errosPagina.conteudo && <p className="text-xs text-destructive">{errosPagina.conteudo}</p>}
                </div>
              )}

              {!aberta && temErro && (
                <p className="px-4 pb-3 text-xs text-destructive">{Object.values(errosPagina)[0]}</p>
              )}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Adicionar página">
        <span className="text-sm text-muted-foreground">
          <Plus size={14} className="mr-1 inline" aria-hidden />
          Adicionar página:
        </span>
        {BOTOES_ADICIONAR.map(({ tipo, rotulo, Icone }) => (
          <Button
            key={tipo}
            type="button"
            variant="outline"
            onClick={() => adicionar(tipo)}
            disabled={desabilitado || noLimite}
          >
            <Icone size={16} />
            {rotulo}
          </Button>
        ))}
        {noLimite && (
          <span className="text-xs text-muted-foreground">Limite de {MAX_PAGINAS} páginas atingido.</span>
        )}
      </div>

      <AlertDialog open={!!paraRemover} onOpenChange={(open) => !open && setParaRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover a página {paraRemover?.numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              A página sai da lição quando você salvar. O progresso dos alunos nela também é apagado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (paraRemover) dispatch({ tipo: 'removerPagina', chave: paraRemover.chave })
                setParaRemover(null)
              }}
            >
              Remover
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
