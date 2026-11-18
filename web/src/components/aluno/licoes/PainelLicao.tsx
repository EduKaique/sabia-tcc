import Link from 'next/link'
import { ArrowLeft, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { alertaErro, botaoSecundario, linkDiscreto, textoApoio } from '@/lib/estilos'
import type { LicaoDetalhe } from '@/types/licao'

interface Props {
  licao: Pick<LicaoDetalhe, 'id' | 'titulo' | 'conceito' | 'modo' | 'atividadeConcluida' | 'concluidaEm'>
  erro: string | null
  /** Veredito do servidor quando a prática ainda não foi aceita (ex.: "Quase lá! O robô não chegou..."). */
  aviso?: string | null
}

/** Painel lateral da prática: o que fazer, o veredito do servidor e a conclusão. */
export function PainelLicao({ licao, erro, aviso }: Props) {
  const modoRobo = licao.modo === 'JOGO_ROBO'

  return (
    <aside className="w-80 h-full flex flex-col border-r-2 border-tinta/15 bg-white overflow-y-auto shrink-0">
      <div className="p-4 border-b-2 border-tinta/10">
        <p className={textoApoio}>{licao.conceito}</p>
        <h2 className={cn(fredoka.className, 'text-xl font-bold text-tinta leading-snug')}>{licao.titulo}</h2>
        <p className="mt-1 text-base text-tinta-apoio">
          {modoRobo
            ? 'Monte os blocos e clique em Executar para levar o robô até o destino.'
            : 'Monte seu programa com blocos e clique em Rodar Código.'}
        </p>
      </div>

      <div className="flex-1 p-4 space-y-5 text-base">
        {licao.concluidaEm && (
          <div role="status" className="space-y-3 rounded-2xl border-2 border-sabia-verde bg-sabia-verde/15 p-4">
            <p className={cn(fredoka.className, 'flex items-center gap-2 text-lg font-bold text-tinta')}>
              <PartyPopper size={20} aria-hidden="true" />
              Lição concluída!
            </p>
            <Link href="/aluno/aprender" className={botaoSecundario}>
              Voltar às lições
            </Link>
          </div>
        )}

        {aviso && !licao.atividadeConcluida && (
          <p role="status" className="rounded-2xl border-2 border-sabia-amarelo bg-sabia-amarelo/20 px-4 py-3 text-sm font-bold text-tinta">
            {aviso}
          </p>
        )}

        {erro && <p role="alert" className={alertaErro}>{erro}</p>}

        <Link href={`/aluno/aprender/${licao.id}`} className={cn(linkDiscreto, 'gap-1.5 px-0')}>
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar à lição
        </Link>
      </div>
    </aside>
  )
}
