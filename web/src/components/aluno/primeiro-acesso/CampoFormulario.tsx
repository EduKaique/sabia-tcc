import { cn } from '@/lib/utils'
import { rotulo, textoApoio, textoErro } from '@/lib/estilos'

export interface PropsAcessibilidadeCampo {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

interface CampoFormularioProps {
  id: string
  label: string
  dica?: string
  erro?: string
  /** Conteúdo extra abaixo do erro (ex.: link "Já tenho conta? Entrar"). */
  extra?: React.ReactNode
  className?: string
  children: (props: PropsAcessibilidadeCampo) => React.ReactNode
}

/** Label visível + dica + erro ligados ao campo por aria-describedby / aria-invalid. */
export function CampoFormulario({ id, label, dica, erro, extra, className, children }: CampoFormularioProps) {
  const idDica = dica ? `${id}-dica` : undefined
  const idErro = erro ? `${id}-erro` : undefined
  const descricao = [idErro, idDica].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5 text-left', className)}>
      <label htmlFor={id} className={rotulo}>
        {label}
      </label>
      {dica && (
        <p id={idDica} className={textoApoio}>
          {dica}
        </p>
      )}
      {children({ id, 'aria-invalid': !!erro, 'aria-describedby': descricao })}
      {erro && (
        <p id={idErro} className={textoErro}>
          {erro}
        </p>
      )}
      {extra}
    </div>
  )
}
