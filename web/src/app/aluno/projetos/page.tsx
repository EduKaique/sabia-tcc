'use client'

import { useState } from 'react'
import { FolderOpen, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, botaoPrincipal, cartao, textoApoio } from '@/lib/estilos'
import { MSG_LIMITE_PROJETOS, extrairErroSandbox } from '@/lib/sandbox/errosSandbox'
import { useProjetosSandbox } from '@/hooks/useProjetosSandbox'
import { LIMITE_PROJETOS_SANDBOX, type ProjetoSandboxResumo } from '@/types/projetoSandbox'
import { ProjetoCard } from '@/components/aluno/projetos/ProjetoCard'
import { ExcluirProjetoDialog } from '@/components/aluno/projetos/ExcluirProjetoDialog'
import { NovoProjetoModal } from '@/components/aluno/projetos/NovoProjetoModal'

export default function MeusProjetosPage() {
  const { data: projetos = [], isLoading, error } = useProjetosSandbox()
  const [novoAberto, setNovoAberto] = useState(false)
  const [excluindo, setExcluindo] = useState<ProjetoSandboxResumo | null>(null)
  const noLimite = projetos.length >= LIMITE_PROJETOS_SANDBOX

  const botaoNovo = (
    <button
      type="button"
      onClick={() => setNovoAberto(true)}
      disabled={noLimite || isLoading}
      aria-describedby={noLimite ? 'aviso-limite-projetos' : undefined}
      className={cn(botaoPrincipal, fredoka.className, 'min-h-12 py-2 text-base disabled:cursor-not-allowed disabled:opacity-60')}
    >
      <Plus size={18} aria-hidden="true" />
      Novo Projeto
    </button>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={cn(fredoka.className, 'text-3xl font-bold text-tinta')}>Meus Projetos</h1>
          <p className="mt-1 text-base text-tinta-apoio">
            Crie à vontade: seus projetos são só seus e não valem nota.
            {!isLoading && !error && (
              <span className="ml-2 font-bold text-tinta">
                {projetos.length}/{LIMITE_PROJETOS_SANDBOX} projetos
              </span>
            )}
          </p>
        </div>
        {projetos.length > 0 && botaoNovo}
      </div>

      {noLimite && (
        <p id="aviso-limite-projetos" role="status" className={cn(alertaErro, 'mb-5')}>
          {MSG_LIMITE_PROJETOS}
        </p>
      )}

      {isLoading ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className={cn(cartao, 'space-y-3 p-5')}>
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-full rounded-full" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <p role="alert" className={alertaErro}>
          {extrairErroSandbox(error).mensagem}
        </p>
      ) : projetos.length === 0 ? (
        <div className={cn(cartao, 'flex flex-col items-center gap-4 px-6 py-12 text-center')}>
          <FolderOpen size={40} className="text-sabia-azul" aria-hidden="true" />
          <p className={cn(fredoka.className, 'text-xl font-bold text-tinta')}>
            Você ainda não tem projetos. Crie seu primeiro projeto!
          </p>
          <p className={textoApoio}>Escolha entre blocos livres ou o Jogo do Robô.</p>
          {botaoNovo}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((p) => (
            <ProjetoCard key={p.id} projeto={p} onExcluir={setExcluindo} />
          ))}
        </ul>
      )}

      {novoAberto && <NovoProjetoModal open onClose={() => setNovoAberto(false)} />}
      <ExcluirProjetoDialog projeto={excluindo} onClose={() => setExcluindo(null)} />
    </div>
  )
}
