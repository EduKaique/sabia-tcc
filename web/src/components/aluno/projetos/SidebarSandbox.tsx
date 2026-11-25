import { Bot, Puzzle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { textoApoio } from '@/lib/estilos'
import type { ProjetoSandboxDetalhe } from '@/types/projetoSandbox'
import { ROTULO_MODO } from './ProjetoCard'

interface Props {
  projeto: Pick<ProjetoSandboxDetalhe, 'modo' | 'origemAtividadeId'>
}

/** Painel lateral do editor do Sandbox (no lugar das instruções da atividade). */
export function SidebarSandbox({ projeto }: Props) {
  const robo = projeto.modo === 'ROBO'
  const Icone = robo ? Bot : Puzzle

  return (
    <aside className="w-80 h-full flex flex-col border-r-2 border-tinta/15 bg-white overflow-y-auto shrink-0">
      <div className="p-4 border-b-2 border-tinta/10">
        <p className={cn(textoApoio, 'flex items-center gap-1.5')}>
          <Icone size={16} aria-hidden="true" />
          {ROTULO_MODO[projeto.modo]}
        </p>
        <h2 className={cn(fredoka.className, 'text-xl font-bold text-tinta leading-snug')}>Projeto livre</h2>
        <p className="mt-1 text-base text-tinta-apoio">
          {robo
            ? 'Monte os blocos e clique em Executar para levar o robô até a estrela.'
            : 'Monte seu programa com blocos e clique em Rodar Código.'}
        </p>
      </div>

      <div className="flex-1 space-y-3 p-4 text-base text-tinta-apoio">
        <p>Este projeto é só seu: ninguém mais vê, ele não vale nota e não é entregue.</p>
        <p>Suas alterações são salvas automaticamente.</p>
        {projeto.origemAtividadeId && <p>Este projeto começou como uma cópia de uma atividade corrigida.</p>}
      </div>
    </aside>
  )
}
