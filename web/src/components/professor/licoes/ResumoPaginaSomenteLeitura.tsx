import type { TipoPagina } from '@/types/licaoProfessor'

/**
 * Resumo de uma página que não pode ser editada aqui (hoje só o vídeo enviado). Ela é mantida exatamente como
 * está ao salvar; só pode mudar de posição ou ser removida.
 */
export function ResumoPaginaSomenteLeitura({ tipo }: { tipo: TipoPagina }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-foreground">
        {tipo === 'VIDEO_UPLOAD' ? 'Upload de vídeo ainda não está disponível.' : 'Página não editável aqui.'}
      </p>
      <p className="text-xs text-muted-foreground">
        Esta página não pode ser editada aqui. Ela será mantida como está ao salvar; você pode mudar a posição ou
        removê-la.
      </p>
    </div>
  )
}
