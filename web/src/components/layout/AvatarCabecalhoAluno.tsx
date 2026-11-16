import { AvatarSabia } from '@/components/aluno/primeiro-acesso/AvatarSabia'
import { buscarAvatar } from '@/lib/avatares'
import { cn } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'

interface Props {
  nome: string | undefined
  /** Id do catálogo (lib/avatares.ts) escolhido no primeiro acesso ou no perfil. */
  avatar: string | undefined
}

/** Avatar do aluno no cabeçalho; sem avatar válido (ou enquanto carrega), a inicial do nome. */
export function AvatarCabecalhoAluno({ nome, avatar }: Props) {
  if (avatar && buscarAvatar(avatar)) {
    return <AvatarSabia id={avatar} tamanho={40} className="rounded-full border-2 border-tinta" />
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        fredoka.className,
        'flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-sabia-amarelo text-base font-bold text-tinta',
      )}
    >
      {nome?.charAt(0).toUpperCase() ?? '?'}
    </div>
  )
}
