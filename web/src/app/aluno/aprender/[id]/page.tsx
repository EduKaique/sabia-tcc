'use client'

import { use, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { ArrowLeft, ArrowRight, Puzzle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { sanitizarHtml } from '@/lib/sanitizarHtml'
import { temConteudo, temPaginaTexto } from '@/lib/conteudoLicao'
import { alertaErro, botaoPrincipal, botaoSecundario, cartao, linkDiscreto, textoApoio } from '@/lib/estilos'
import { useLicao, useMutacoesLicao } from '@/hooks/useLicoes'
import { VideoLicao } from '@/components/aluno/licoes/VideoLicao'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pagina?: string | string[] }>
}

type Pagina = 'texto' | 'video'

/**
 * Estilo do HTML do `conteudo`. O plugin de tipografia (classes `prose`) não está instalado, e o
 * preflight do Tailwind zera títulos e listas, por isso cada elemento é estilizado aqui.
 */
const estiloTexto = [
  'space-y-4 text-lg leading-relaxed text-tinta sm:text-xl',
  '[&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2:first-child]:pt-0',
  '[&_h3]:pt-2 [&_h3]:text-xl [&_h3]:font-bold',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-7 [&_ol]:pl-7 [&_li]:my-1',
  '[&_strong]:font-bold [&_em]:italic [&_a]:font-bold [&_a]:text-sabia-azul-escuro [&_a]:underline',
  '[&_hr]:my-6 [&_hr]:border-t-2 [&_hr]:border-tinta/15',
].join(' ')

/** Etapa 1 da lição: uma página com o texto e, se houver vídeo, outra com o vídeo. */
export default function ConteudoLicaoPage({ params, searchParams }: Props) {
  const { id } = use(params)
  const { pagina } = use(searchParams)
  const router = useRouter()
  const licaoId = Number(id)
  const hrefAtividade = `/aluno/aprender/${id}/editor`

  const { data: licao, isLoading, error } = useLicao(licaoId)
  const { videoVisto } = useMutacoesLicao(licaoId)
  const semConteudo = !!licao && !temConteudo(licao)
  const valor = Array.isArray(pagina) ? pagina[0] : pagina

  // Troca de página (?pagina=...) volta ao topo.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [valor])

  // Sem texto e sem vídeo não há o que mostrar: vai direto para a atividade (replace, para o
  // "voltar" do navegador não cair de novo aqui).
  useEffect(() => {
    if (semConteudo) router.replace(hrefAtividade)
  }, [semConteudo, router, hrefAtividade])

  if (isLoading || semConteudo) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-4 w-36" />
        <div className={cn(cartao, 'space-y-3 p-6')}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-14 w-full rounded-full" />
      </div>
    )
  }

  if (error || !licao) {
    const naoEncontrada = isAxiosError(error) && error.response?.status === 404
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <p className={alertaErro}>
          {naoEncontrada ? 'Lição não encontrada ou indisponível.' : 'Não foi possível carregar a lição. Tente novamente.'}
        </p>
        <Link href="/aluno/aprender" className={linkDiscreto}>
          Voltar às lições
        </Link>
      </div>
    )
  }

  const paginas: Pagina[] = [
    ...(temPaginaTexto(licao) ? (['texto'] as const) : []),
    ...(licao.videoId ? (['video'] as const) : []),
  ]

  const numero = Number(valor)
  const indice =
    valor === 'video' && licao.videoId
      ? paginas.length - 1
      : Number.isInteger(numero) && numero >= 1 && numero <= paginas.length
        ? numero - 1
        : 0
  const atual = paginas[indice]
  const ultima = indice === paginas.length - 1
  const hrefPagina = (i: number) =>
    `/aluno/aprender/${id}?pagina=${paginas[i] === 'video' ? 'video' : i + 1}`
  const temProgresso = licao.progresso.videoVisto || licao.progresso.atividadeConcluida

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/aluno/aprender" className={cn(linkDiscreto, 'gap-1.5 px-0 no-underline text-tinta-apoio')}>
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar às lições
        </Link>
        {temProgresso && (
          <Link href={hrefAtividade} className={cn(linkDiscreto, 'gap-1.5')}>
            Ir direto para a atividade
            <Puzzle size={16} aria-hidden="true" />
          </Link>
        )}
      </div>

      <article className={cn(cartao, 'space-y-5 p-6 sm:p-8')}>
        {indice === 0 && (
          <header className="space-y-1">
            <p className={textoApoio}>{licao.conceito}</p>
            <h1 className={cn(fredoka.className, 'text-3xl font-bold text-tinta')}>{licao.titulo}</h1>
            {licao.resumo && <p className="text-lg text-tinta-apoio">{licao.resumo}</p>}
          </header>
        )}

        {atual === 'texto' ? (
          licao.conteudo && (
            <div className={estiloTexto} dangerouslySetInnerHTML={{ __html: sanitizarHtml(licao.conteudo) }} />
          )
        ) : (
          <>
            {indice !== 0 && (
              <h2 className={cn(fredoka.className, 'text-2xl font-bold text-tinta')}>Vídeo</h2>
            )}
            <VideoLicao
              videoId={licao.videoId!}
              titulo={licao.videoTitulo}
              canal={licao.videoCanal}
              visto={licao.progresso.videoVisto}
              marcando={videoVisto.isPending}
              onMarcarVisto={() => videoVisto.mutate()}
            />
            {videoVisto.isError && (
              <p role="alert" className={alertaErro}>Não foi possível marcar o vídeo. Tente novamente.</p>
            )}
          </>
        )}
      </article>

      <nav aria-label="Páginas do conteúdo" className="mt-5 flex items-center justify-between gap-3">
        {indice > 0 ? (
          <Link href={hrefPagina(indice - 1)} className={botaoSecundario}>
            <ArrowLeft size={16} aria-hidden="true" />
            Anterior
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}

        {paginas.length > 1 && (
          <p className={textoApoio} aria-live="polite">
            Página {indice + 1} de {paginas.length}
          </p>
        )}

        {ultima ? (
          <Link href={hrefAtividade} className={cn(botaoPrincipal, fredoka.className, 'min-h-12 px-5 py-2 text-base')}>
            Ir para a atividade
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <Link href={hrefPagina(indice + 1)} className={cn(botaoPrincipal, fredoka.className, 'min-h-12 px-5 py-2 text-base')}>
            Próximo
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </nav>
    </div>
  )
}
