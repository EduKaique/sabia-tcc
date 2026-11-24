'use client'

import { useEffect, useReducer, useState } from 'react'
import { AlertTriangle, Loader2, Save, Send, Undo2 } from 'lucide-react'
import { useDespublicarLicao, usePublicarLicao, useSalvarLicao } from '@/hooks/useLicoesProfessor'
import { editorReducer, estadoInicialEditor, prontidaoPublicacao } from '@/lib/licoes/editorLicao'
import { ErroTurmasLicao } from '@/lib/licoes/erroTurmasLicao'
import { erroDaPratica, extrairErro, separarErros, type ErroLicao } from '@/lib/licoes/errosLicao'
import { montarPayload } from '@/lib/licoes/payloadLicao'
import { validarLicaoEditor } from '@/lib/schemas/licaoSchema'
import type { LicaoProfessorDetalhe } from '@/types/licaoProfessor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConstrutorPaginas } from './ConstrutorPaginas'
import { ChecklistPublicacao, Secao, SecaoMetadados, SecaoPratica, SecaoTurmas } from './SecoesLicao'
import { ROTULO_ESTADO, VARIANTE_ESTADO } from './estadoLicao'

interface ErrosTela {
  gerais: string[]
  metadados: Partial<Record<'titulo' | 'conceito' | 'resumo', string>>
  paginas: Record<string, Record<string, string>>
  pratica: string | null
}

const SEM_ERROS: ErrosTela = { gerais: [], metadados: {}, paginas: {}, pratica: null }

/** Editor completo de uma lição. O estado local é um reducer puro (lib/licoes/editorLicao). */
export function EditorLicao({ detalhe }: { detalhe: LicaoProfessorDetalhe }) {
  const [estado, dispatch] = useReducer(editorReducer, detalhe, (d) =>
    editorReducer(estadoInicialEditor(), { tipo: 'carregar', detalhe: d })
  )
  const [erros, setErros] = useState<ErrosTela>(SEM_ERROS)
  const [aviso, setAviso] = useState<string | null>(null)
  const salvarMut = useSalvarLicao()
  const publicarMut = usePublicarLicao()
  const despublicarMut = useDespublicarLicao()
  const ocupado = salvarMut.isPending || publicarMut.isPending || despublicarMut.isPending
  const arquivada = estado.estadoPublicacao === 'ARQUIVADA'
  const publicada = estado.estadoPublicacao === 'PUBLICADA'
  const id = detalhe.id

  // Aviso do navegador ao sair com alterações não salvas.
  useEffect(() => {
    if (!estado.sujo) return
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [estado.sujo])

  const mostrarErro = (erro: ErroLicao, operacao: 'salvar' | 'publicar', paginasEnviadas = estado.paginas) => {
    if (erroDaPratica(erro, operacao)) {
      setErros({ ...SEM_ERROS, pratica: erro.mensagem })
      return
    }
    const separados = separarErros(erro.campos, paginasEnviadas)
    const gerais = erro.campos ? separados.gerais : [erro.mensagem]
    if (erro.campos && gerais.length === 0) gerais.push('Corrija os campos destacados.')
    setErros({ gerais, metadados: separados.metadados, paginas: separados.paginas, pratica: null })
  }

  /** PUT da lição e depois das turmas; troca o estado local pelo detalhe devolvido. */
  const salvar = async (): Promise<LicaoProfessorDetalhe | null> => {
    setAviso(null)
    const validacao = validarLicaoEditor(estado)
    if (!validacao.ok) {
      setErros({
        ...SEM_ERROS,
        gerais: ['Corrija os campos destacados antes de salvar.'],
        metadados: validacao.metadados,
        paginas: validacao.paginas,
      })
      return null
    }
    const paginasEnviadas = estado.paginas
    try {
      const salvo = await salvarMut.mutateAsync({ id, payload: montarPayload(estado), turmaIds: estado.turmaIds })
      dispatch({ tipo: 'carregar', detalhe: salvo })
      setErros(SEM_ERROS)
      return salvo
    } catch (err) {
      if (err instanceof ErroTurmasLicao) {
        // O conteúdo foi salvo (as páginas novas já têm id); só as turmas falharam e continuam marcadas.
        dispatch({ tipo: 'carregar', detalhe: err.licaoSalva, manterTurmas: true })
        setErros({ ...SEM_ERROS, gerais: [`O conteúdo foi salvo, mas as turmas não: ${extrairErro(err.causa).mensagem}`] })
        return null
      }
      mostrarErro(extrairErro(err), 'salvar', paginasEnviadas)
      return null
    }
  }

  const aoSalvar = async () => {
    const salvo = await salvar()
    if (salvo) setAviso(salvo.estado === 'PUBLICADA' ? 'Salvo. Os alunos já veem as mudanças.' : 'Rascunho salvo.')
  }

  const aoPublicar = async () => {
    const salvo = await salvar()
    if (!salvo) return
    try {
      const publicado = await publicarMut.mutateAsync(id)
      dispatch({ tipo: 'sincronizarPublicacao', estadoPublicacao: publicado.estado })
      setAviso('Lição publicada. Os alunos das turmas vinculadas já podem vê-la.')
    } catch (err) {
      mostrarErro(extrairErro(err), 'publicar')
    }
  }

  const aoDespublicar = async () => {
    setAviso(null)
    try {
      const d = await despublicarMut.mutateAsync(id)
      dispatch({ tipo: 'sincronizarPublicacao', estadoPublicacao: d.estado })
      setErros(SEM_ERROS)
      setAviso('A lição voltou a ser rascunho. Os alunos deixam de vê-la; o progresso deles é mantido.')
    } catch (err) {
      mostrarErro(extrairErro(err), 'publicar')
    }
  }

  const estadoAtual = estado.estadoPublicacao ?? 'RASCUNHO'
  const prontidao = prontidaoPublicacao(estado)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={VARIANTE_ESTADO[estadoAtual]}>{ROTULO_ESTADO[estadoAtual]}</Badge>
        {estado.sujo && <span className="text-xs text-muted-foreground">Alterações não salvas</span>}
      </div>

      {arquivada && (
        <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
          Esta lição foi arquivada e não pode mais ser editada.
        </p>
      )}
      {publicada && !arquivada && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
          Esta lição está publicada: ao salvar, os alunos passam a ver as mudanças.
        </p>
      )}
      {erros.gerais.length > 0 && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {erros.gerais.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}
      {aviso && (
        <p role="status" className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground">
          {aviso}
        </p>
      )}

      <Secao numero={1} titulo="Informações">
        <SecaoMetadados metadados={estado.metadados} dispatch={dispatch} erros={erros.metadados} desabilitado={arquivada} />
      </Secao>

      <Secao numero={2} titulo="Páginas" descricao="O conteúdo que o aluno lê antes da prática, na ordem da lista.">
        <ConstrutorPaginas paginas={estado.paginas} dispatch={dispatch} erros={erros.paginas} desabilitado={arquivada} />
      </Secao>

      <Secao numero={3} titulo="Prática" descricao="Liberada para o aluno depois que ele concluir as páginas.">
        <SecaoPratica estado={estado} dispatch={dispatch} erro={erros.pratica} desabilitado={arquivada} />
      </Secao>

      <Secao numero={4} titulo="Turmas e publicação">
        <SecaoTurmas turmaIds={estado.turmaIds} dispatch={dispatch} desabilitado={arquivada} />
        {!publicada && !arquivada && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Antes de publicar</p>
            <ChecklistPublicacao itens={prontidao} />
          </div>
        )}
      </Secao>

      {!arquivada && (
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-xl sm:border">
          {publicada && (
            <Button variant="outline" size="lg" onClick={aoDespublicar} disabled={ocupado}>
              <Undo2 />
              Despublicar
            </Button>
          )}
          <Button variant={publicada ? 'default' : 'outline'} size="lg" onClick={aoSalvar} disabled={ocupado}>
            {salvarMut.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            {publicada ? 'Salvar alterações' : 'Salvar rascunho'}
          </Button>
          {!publicada && (
            <Button size="lg" onClick={aoPublicar} disabled={ocupado}>
              {publicarMut.isPending ? <Loader2 className="animate-spin" /> : <Send />}
              Publicar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
