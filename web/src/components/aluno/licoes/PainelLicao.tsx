import Link from 'next/link'
import { CheckCircle2, Circle, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizarHtml } from '@/lib/sanitizarHtml'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, botaoPrincipal, botaoSecundario, rotulo, textoApoio } from '@/lib/estilos'
import type { LicaoDetalhe } from '@/types/licao'
import { VideoLicao } from './VideoLicao'

interface Props {
  licao: LicaoDetalhe
  /** Id da próxima lição por ordem; undefined na última. */
  proximaId?: number
  marcandoVideo: boolean
  onMarcarVideo: () => void
  erro: string | null
}

function ItemChecklist({ feito, children }: { feito: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-base text-tinta">
      {feito ? (
        <CheckCircle2 size={18} className="shrink-0 text-sabia-verde" aria-hidden="true" />
      ) : (
        <Circle size={18} className="shrink-0 text-tinta/40" aria-hidden="true" />
      )}
      <span className={cn(feito && 'line-through decoration-2 text-tinta-apoio')}>{children}</span>
      <span className="sr-only">{feito ? '(feito)' : '(falta)'}</span>
    </li>
  )
}

/** Painel lateral da lição: conteúdo, vídeo opcional, o que falta e a conclusão. */
export function PainelLicao({ licao, proximaId, marcandoVideo, onMarcarVideo, erro }: Props) {
  const { progresso } = licao

  return (
    <aside className="w-80 h-full flex flex-col border-r-2 border-tinta/15 bg-white overflow-y-auto shrink-0">
      <div className="p-4 border-b-2 border-tinta/10">
        <p className={textoApoio}>{licao.conceito}</p>
        <h2 className={cn(fredoka.className, 'text-xl font-bold text-tinta leading-snug')}>{licao.titulo}</h2>
        {licao.resumo && <p className="mt-1 text-base text-tinta-apoio">{licao.resumo}</p>}
      </div>

      <div className="flex-1 p-4 space-y-5 text-base">
        {progresso.concluida && (
          <div role="status" className="space-y-3 rounded-2xl border-2 border-sabia-verde bg-sabia-verde/15 p-4">
            <p className={cn(fredoka.className, 'flex items-center gap-2 text-lg font-bold text-tinta')}>
              <PartyPopper size={20} aria-hidden="true" />
              Lição concluída!
            </p>
            <div className="flex flex-col gap-2">
              {proximaId !== undefined && (
                <Link
                  href={`/aluno/aprender/${proximaId}/editor`}
                  className={cn(botaoPrincipal, fredoka.className, 'min-h-12 py-2 text-base')}
                >
                  Próxima lição
                </Link>
              )}
              <Link href="/aluno/aprender" className={botaoSecundario}>
                Voltar às lições
              </Link>
            </div>
          </div>
        )}

        {progresso.atividadeConcluida && !progresso.concluida && (
          <p role="status" className="rounded-2xl border-2 border-sabia-amarelo bg-sabia-amarelo/20 px-4 py-3 text-sm font-bold text-tinta">
            Atividade concluída. Falta marcar o vídeo como assistido.
          </p>
        )}

        {erro && <p role="alert" className={alertaErro}>{erro}</p>}

        {licao.conteudo && (
          <div
            className="prose prose-sm max-w-none text-tinta"
            dangerouslySetInnerHTML={{ __html: sanitizarHtml(licao.conteudo) }}
          />
        )}

        {licao.videoId && (
          <VideoLicao
            videoId={licao.videoId}
            titulo={licao.videoTitulo}
            canal={licao.videoCanal}
            visto={progresso.videoVisto}
            marcando={marcandoVideo}
            onMarcarVisto={onMarcarVideo}
          />
        )}

        <div className="pt-3 border-t-2 border-tinta/10 space-y-2">
          <p className={rotulo}>Para concluir</p>
          <ul className="space-y-1.5">
            {licao.videoId && <ItemChecklist feito={progresso.videoVisto}>Assistir ao vídeo</ItemChecklist>}
            <ItemChecklist feito={progresso.atividadeConcluida}>
              {licao.modo === 'JOGO_ROBO' ? 'Levar o robô até o destino' : 'Rodar um programa com blocos'}
            </ItemChecklist>
          </ul>
        </div>
      </div>
    </aside>
  )
}
