'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, botaoSecundario, linkDiscreto } from '@/lib/estilos'
import { CODIGO_LIMITE_PROJETOS, extrairErroSandbox } from '@/lib/sandbox/errosSandbox'
import { useCopiarAtividadeParaSandbox } from '@/hooks/useProjetosSandbox'

interface Props {
  atividadeId: number
}

/**
 * "Continuar no Sandbox": copia o projeto entregue (e o cenário, no Jogo do Robô) para Meus Projetos e abre a
 * cópia no editor. A entrega original continua bloqueada.
 */
export function BotaoContinuarSandbox({ atividadeId }: Props) {
  const router = useRouter()
  const copiar = useCopiarAtividadeParaSandbox()
  // Depois do sucesso o botão continua desabilitado até a navegação, para não criar outra cópia.
  const ocupado = copiar.isPending || copiar.isSuccess
  const erro = copiar.isError ? extrairErroSandbox(copiar.error) : null

  return (
    <>
      <button
        type="button"
        disabled={ocupado}
        onClick={() =>
          copiar.mutate(atividadeId, {
            onSuccess: (projeto) => router.push(`/aluno/projetos/${projeto.id}/editor`),
          })
        }
        className={cn(botaoSecundario, fredoka.className, 'w-full sm:w-auto disabled:cursor-wait')}
      >
        {ocupado ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles size={16} aria-hidden="true" />
        )}
        {ocupado ? 'Copiando...' : 'Continuar no Meus Projetos'}
      </button>
      {erro && (
        <p role="alert" className={cn(alertaErro, 'mt-3 w-full')}>
          {erro.mensagem}
          {erro.codigo === CODIGO_LIMITE_PROJETOS && (
            <>
              {' '}
              <Link href="/aluno/projetos" className={cn(linkDiscreto, 'min-h-0 px-0')}>
                Ir para Meus Projetos
              </Link>
            </>
          )}
        </p>
      )}
    </>
  )
}
