'use client'

import { useRef } from 'react'
import { MENSAGEM_VIDEO_INVALIDO } from '@/lib/schemas/licaoSchema'
import {
  MAX_TITULO_VIDEO,
  PERCENTUAL_MINIMO_VIDEO,
  extrairIdYoutube,
  formatarDuracao,
  lerDuracao,
  segundosNecessarios,
  type ConteudoVideoEditor,
} from '@/lib/licoes/youtube'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContadorCaracteres } from './ContadorCaracteres'
import { TITULO_PLAYER, usePlayerYoutube, type OrigemDuracao } from './usePlayerYoutube'

interface Props {
  idBase: string
  conteudo: ConteudoVideoEditor
  onChange: (parcial: Partial<ConteudoVideoEditor>) => void
  erros: Record<string, string>
}

const vazio = (v: unknown) => v == null || String(v).trim() === ''

/** Página VIDEO_YOUTUBE: link ou código, pré-visualização com leitura da duração, título e canal opcionais. */
export function FormPaginaVideo({ idBase, conteudo, onChange, erros }: Props) {
  const entrada = conteudo.videoId ?? ''
  const videoId = extrairIdYoutube(entrada)
  const erroVideo = erros.videoId ?? (entrada.trim() !== '' && !videoId ? MENSAGEM_VIDEO_INVALIDO : undefined)
  const duracao = lerDuracao(conteudo.duracaoSegundos)
  const textoDuracao = conteudo.duracaoSegundos == null ? '' : String(conteudo.duracaoSegundos)

  const aoLerDuracao = (segundos: number, origem: OrigemDuracao) => {
    // Automática só preenche o campo vazio; o botão "Ler duração do vídeo" substitui.
    if (origem === 'manual' || vazio(conteudo.duracaoSegundos)) onChange({ duracaoSegundos: segundos })
  }
  const aoLerDados = ({ titulo, canal }: { titulo?: string; canal?: string }) => {
    const sugestao: Partial<ConteudoVideoEditor> = {}
    if (titulo && vazio(conteudo.titulo)) sugestao.titulo = titulo.slice(0, MAX_TITULO_VIDEO)
    if (canal && vazio(conteudo.canal)) sugestao.canal = canal.slice(0, MAX_TITULO_VIDEO)
    if (Object.keys(sugestao).length > 0) onChange(sugestao)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idBase}-video`}>
          Link ou código do vídeo <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idBase}-video`}
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={entrada}
          onChange={(e) => onChange({ videoId: e.target.value })}
          aria-invalid={!!erroVideo}
        />
        <p className="text-xs text-muted-foreground">
          Cole o link do YouTube (watch, youtu.be, shorts, embed ou live) ou só o código de 11 caracteres.
        </p>
        {erroVideo && <p className="text-xs text-destructive">{erroVideo}</p>}
      </div>

      {videoId && <PreviaYoutube key={videoId} videoId={videoId} aoLerDuracao={aoLerDuracao} aoLerDados={aoLerDados} />}

      <div className="space-y-1.5">
        <Label htmlFor={`${idBase}-duracao`}>Duração do vídeo (em segundos)</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={`${idBase}-duracao`}
            inputMode="numeric"
            className="w-32"
            value={textoDuracao}
            onChange={(e) => onChange({ duracaoSegundos: e.target.value })}
            aria-invalid={!!erros.duracaoSegundos}
            aria-describedby={`${idBase}-duracao-dica`}
          />
          {typeof duracao === 'number' && (
            <span className="text-sm text-muted-foreground">= {formatarDuracao(duracao)}</span>
          )}
        </div>
        <p id={`${idBase}-duracao-dica`} className="text-xs text-muted-foreground">
          {typeof duracao === 'number'
            ? `O aluno precisará assistir pelo menos ${formatarDuracao(segundosNecessarios(duracao))} (${PERCENTUAL_MINIMO_VIDEO}%).`
            : 'Obrigatória para publicar. É lida do vídeo quando possível.'}
        </p>
        {erros.duracaoSegundos && <p className="text-xs text-destructive">{erros.duracaoSegundos}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`${idBase}-titulo-video`}>Título do vídeo (opcional)</Label>
            <ContadorCaracteres texto={conteudo.titulo ?? ''} maximo={MAX_TITULO_VIDEO} />
          </div>
          <Input
            id={`${idBase}-titulo-video`}
            value={conteudo.titulo ?? ''}
            onChange={(e) => onChange({ titulo: e.target.value })}
            aria-invalid={!!erros.tituloVideo}
          />
          {erros.tituloVideo && <p className="text-xs text-destructive">{erros.tituloVideo}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`${idBase}-canal`}>Canal (opcional)</Label>
            <ContadorCaracteres texto={conteudo.canal ?? ''} maximo={MAX_TITULO_VIDEO} />
          </div>
          <Input
            id={`${idBase}-canal`}
            value={conteudo.canal ?? ''}
            onChange={(e) => onChange({ canal: e.target.value })}
            aria-invalid={!!erros.canal}
          />
          {erros.canal && <p className="text-xs text-destructive">{erros.canal}</p>}
        </div>
      </div>
    </div>
  )
}

interface PropsPrevia {
  videoId: string
  aoLerDuracao: (segundos: number, origem: OrigemDuracao) => void
  aoLerDados: (dados: { titulo?: string; canal?: string }) => void
}

/** Player de um vídeo; o pai remonta (key) ao trocar de vídeo, e o player anterior é destruído. */
function PreviaYoutube({ videoId, aoLerDuracao, aoLerDados }: PropsPrevia) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { situacao, mensagemErro, aguardandoPlay, lerDuracao } = usePlayerYoutube(videoId, containerRef, {
    aoLerDuracao,
    aoLerDados,
  })

  let aviso: string | null = null
  if (situacao === 'carregando') aviso = 'Carregando o player do YouTube…'
  else if (situacao === 'semApi')
    aviso = 'Não foi possível carregar o player do YouTube (sem conexão?). Informe a duração à mão.'
  else if (situacao === 'erro') aviso = mensagemErro
  else if (aguardandoPlay) aviso = 'Clique em reproduzir uma vez para a duração ser lida.'

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="region"
        aria-label={TITULO_PLAYER}
        className={`aspect-video w-full max-w-md overflow-hidden rounded-lg border border-border bg-muted/40 ${
          situacao === 'semApi' || situacao === 'erro' ? 'hidden' : ''
        } [&>iframe]:h-full [&>iframe]:w-full`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={lerDuracao} disabled={situacao !== 'pronto'}>
          Ler duração do vídeo
        </Button>
        <p
          aria-live="polite"
          className={`text-xs ${situacao === 'erro' ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {aviso}
        </p>
      </div>
    </div>
  )
}
