'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Loader2, Puzzle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { fredoka, nunito } from '@/lib/fontesHome'
import { alertaErro, botaoPrincipal, botaoSecundario, cartao, rotulo } from '@/lib/estilos'
import { PRESETS_CENARIO } from '@/lib/cenariosRobo'
import { extrairErroSandbox } from '@/lib/sandbox/errosSandbox'
import { useCriarProjetoSandbox } from '@/hooks/useProjetosSandbox'
import type { ModoPratica } from '@/types'
import { PalcoRobo } from '@/components/aluno/editor/PalcoRobo'

interface Props {
  open: boolean
  onClose: () => void
}

const opcaoBase =
  'flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left text-base font-bold text-tinta transition-colors outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul'

const TIPOS: { modo: ModoPratica; titulo: string; descricao: string; Icone: typeof Bot }[] = [
  { modo: 'BLOCOS', titulo: 'Blocos livres', descricao: 'Programe com todos os blocos e veja o resultado.', Icone: Puzzle },
  { modo: 'JOGO_ROBO', titulo: 'Jogo do Robô', descricao: 'Leve o robô até a estrela em um cenário pronto.', Icone: Bot },
]

/** Escolha do tipo do novo projeto (e do cenário pronto, no Jogo do Robô). Ao criar, abre o editor. */
export function NovoProjetoModal({ open, onClose }: Props) {
  const router = useRouter()
  const criar = useCriarProjetoSandbox()
  const [modo, setModo] = useState<ModoPratica>('BLOCOS')
  const [cenarioId, setCenarioId] = useState<string>(PRESETS_CENARIO[0].id)
  const cenario = PRESETS_CENARIO.find((p) => p.id === cenarioId)?.cenario

  const fechar = () => {
    if (criar.isPending) return
    criar.reset()
    onClose()
  }

  const confirmar = () => {
    criar.mutate(
      { modo, cenario: modo === 'JOGO_ROBO' ? cenarioId : undefined },
      { onSuccess: (projeto) => router.push(`/aluno/projetos/${projeto.id}/editor`) },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) fechar() }}>
      <AlertDialogContent className={cn(nunito.className, cartao, 'ring-0 text-tinta max-h-[90vh] overflow-y-auto')}>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(fredoka.className, 'text-2xl font-bold text-tinta')}>
            Novo Projeto
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium text-tinta-apoio">
            Escolha o tipo do projeto. Ele fica só com você e não vale nota.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <fieldset className="space-y-2">
          <legend className={cn(rotulo, 'mb-2')}>Tipo</legend>
          {TIPOS.map(({ modo: m, titulo, descricao, Icone }) => (
            <button
              key={m}
              type="button"
              aria-pressed={modo === m}
              onClick={() => setModo(m)}
              className={cn(
                opcaoBase,
                modo === m ? 'border-tinta bg-sabia-amarelo' : 'border-tinta/20 bg-white hover:bg-sabia-azul-claro',
              )}
            >
              <Icone size={22} aria-hidden="true" className="shrink-0" />
              <span>
                <span className={cn(fredoka.className, 'block text-lg')}>{titulo}</span>
                <span className="block text-sm font-medium text-tinta-apoio">{descricao}</span>
              </span>
            </button>
          ))}
        </fieldset>

        {modo === 'JOGO_ROBO' && (
          <fieldset className="space-y-2">
            <legend className={cn(rotulo, 'mb-2')}>Cenário</legend>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex flex-1 flex-col gap-2">
                {PRESETS_CENARIO.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={cenarioId === p.id}
                    onClick={() => setCenarioId(p.id)}
                    className={cn(
                      opcaoBase,
                      'p-3',
                      cenarioId === p.id ? 'border-tinta bg-sabia-azul-claro' : 'border-tinta/20 bg-white hover:bg-sabia-azul-claro',
                    )}
                  >
                    {p.nome}
                  </button>
                ))}
              </div>
              {cenario && (
                <div className="size-40 shrink-0 self-center rounded-2xl border-2 border-tinta/15 p-1.5" aria-label="Pré-visualização do cenário">
                  <PalcoRobo cenario={cenario} posicao={cenario.inicio} erro={false} />
                </div>
              )}
            </div>
          </fieldset>
        )}

        {criar.isError && (
          <p role="alert" className={alertaErro}>
            {extrairErroSandbox(criar.error).mensagem}
          </p>
        )}

        <AlertDialogFooter>
          <button type="button" disabled={criar.isPending} onClick={fechar} className={botaoSecundario}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={criar.isPending}
            className={cn(botaoPrincipal, fredoka.className, 'min-h-12 py-2 text-base')}
          >
            {criar.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {criar.isPending ? 'Criando...' : 'Criar projeto'}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
