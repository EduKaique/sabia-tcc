'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BlocklyEditor from '@/components/BlocklyEditor'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtividadeAluno, useProjetoAluno } from '@/hooks/useAtividadesAluno'
import { cn, formatarDataHora, parseDataUtc } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, linkDiscreto, textoApoio } from '@/lib/estilos'

interface Props {
  params: Promise<{ id: string }>
}

/** Projeto entregue pelo aluno, somente leitura: sem edição, execução nem salvamento. */
export default function ProjetoEntreguePage({ params }: Props) {
  const { id } = use(params)
  const atividadeId = Number(id)
  const { data: atividade } = useAtividadeAluno(atividadeId)
  const { data: projeto, isLoading, error } = useProjetoAluno(atividadeId)

  const status = (error as { response?: { status?: number } } | null)?.response?.status

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href={`/aluno/atividades/${id}`} className={cn(linkDiscreto, 'mb-4 gap-1.5 px-0')}>
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar para a atividade
      </Link>

      <h1 className={cn(fredoka.className, 'mb-1 text-3xl font-bold text-tinta')}>
        {atividade?.titulo ?? 'Projeto entregue'}
      </h1>
      {projeto && (
        <p className={cn(textoApoio, 'mb-4')}>
          Projeto entregue em {formatarDataHora(parseDataUtc(projeto.dataEnvio))}. Somente
          visualização.
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-120 w-full rounded-xl" />
      ) : error || !projeto ? (
        <p className={alertaErro}>
          {status === 404
            ? 'Você ainda não entregou esta atividade.'
            : 'Não foi possível carregar o projeto.'}
        </p>
      ) : projeto.estadoJson ? (
        <div className="h-120 overflow-hidden rounded-2xl border-2 border-tinta">
          <BlocklyEditor workspaceOnly readOnly tema="scratch" initialState={projeto.estadoJson} />
        </div>
      ) : (
        <p className={textoApoio}>Projeto indisponível.</p>
      )}
    </div>
  )
}
