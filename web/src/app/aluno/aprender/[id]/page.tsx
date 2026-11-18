'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { isAxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, cartao, linkDiscreto, textoApoio } from '@/lib/estilos'
import { paginaInicial } from '@/lib/licoes/aluno'
import { useLicao } from '@/hooks/useLicoes'
import type { LicaoDetalhe } from '@/types/licao'
import { BlocoAtividade } from '@/components/aluno/licoes/BlocoAtividade'
import { NavegadorPaginas } from '@/components/aluno/licoes/NavegadorPaginas'
import { PaginaLicao } from '@/components/aluno/licoes/PaginaLicao'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aviso?: string | string[] }>
}

/** A lição: páginas em sequência (navegação livre) e, abaixo, a atividade. */
export default function LicaoAlunoPage({ params, searchParams }: Props) {
  const { id } = use(params)
  const { aviso } = use(searchParams)
  const { data: licao, isLoading, error } = useLicao(Number(id))

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-4 w-36" />
        <div className={cn(cartao, 'space-y-3 p-6')}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (error || !licao) {
    const naoEncontrada = isAxiosError(error) && error.response?.status === 404
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <p className={alertaErro}>
          {naoEncontrada
            ? 'Esta lição não está disponível para você. Confira a lista de lições da sua turma.'
            : 'Não foi possível carregar a lição. Tente novamente.'}
        </p>
        <Link href="/aluno/aprender" className={linkDiscreto}>
          Voltar às lições
        </Link>
      </div>
    )
  }

  // key: a página inicial é calculada uma vez por lição.
  return <ConteudoLicao key={licao.id} licao={licao} avisoPratica={aviso === 'pratica'} />
}

function ConteudoLicao({ licao, avisoPratica }: { licao: LicaoDetalhe; avisoPratica: boolean }) {
  const [indice, setIndice] = useState(() => paginaInicial(licao.paginas))
  const pagina = licao.paginas[indice]

  const irPara = (i: number) => {
    if (i < 0 || i >= licao.paginas.length) return
    setIndice(i)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/aluno/aprender" className={cn(linkDiscreto, 'gap-1.5 px-0 no-underline text-tinta-apoio')}>
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar às lições
      </Link>

      <header className="space-y-1">
        <p className={textoApoio}>{licao.conceito}</p>
        <h1 className={cn(fredoka.className, 'text-3xl font-bold text-tinta')}>{licao.titulo}</h1>
        {licao.resumo && <p className="text-lg text-tinta-apoio">{licao.resumo}</p>}
      </header>

      {avisoPratica && !licao.praticaLiberada && (
        <p role="status" className="rounded-2xl border-2 border-sabia-amarelo bg-sabia-amarelo/20 px-4 py-3 text-base font-bold text-tinta">
          Conclua as páginas da lição antes de ir para a atividade.
        </p>
      )}

      {pagina ? (
        <>
          <article className={cn(cartao, 'space-y-5 p-6 sm:p-8')} aria-label={`Página ${indice + 1} de ${licao.paginas.length}`}>
            {pagina.titulo && <h2 className={cn(fredoka.className, 'text-2xl font-bold text-tinta')}>{pagina.titulo}</h2>}
            <PaginaLicao key={pagina.id} licaoId={licao.id} pagina={pagina} />
          </article>
          <NavegadorPaginas paginas={licao.paginas} indice={indice} onIr={irPara} />
        </>
      ) : (
        <p className={cn(cartao, 'p-6 text-lg text-tinta')}>Esta lição não tem conteúdo; siga para a atividade.</p>
      )}

      <BlocoAtividade licao={licao} onIrPagina={irPara} />
    </div>
  )
}
