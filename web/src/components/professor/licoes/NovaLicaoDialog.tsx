'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCriarLicao } from '@/hooks/useLicoesProfessor'
import { extrairErro } from '@/lib/licoes/errosLicao'
import { LIMITES_LICAO, novaLicaoSchema, type NovaLicaoForm } from '@/lib/schemas/licaoSchema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Cria o rascunho (POST) e leva ao editor. */
export function NovaLicaoDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const criar = useCriarLicao()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NovaLicaoForm>({
    resolver: zodResolver(novaLicaoSchema),
    defaultValues: { titulo: '', conceito: '', resumo: '' },
  })

  const enviar = handleSubmit((dados) => {
    criar.mutate(
      { titulo: dados.titulo.trim(), conceito: dados.conceito.trim(), resumo: dados.resumo?.trim() || null },
      { onSuccess: (licao) => router.push(`/professor/licoes/${licao.id}/editar`) }
    )
  })

  const erroServidor = criar.isError ? extrairErro(criar.error) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova lição</DialogTitle>
          <DialogDescription>Comece pelo nome e pelo tema. O conteúdo você monta em seguida.</DialogDescription>
        </DialogHeader>
        <form onSubmit={enviar} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nova-licao-titulo">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nova-licao-titulo"
              maxLength={LIMITES_LICAO.tituloMax}
              {...register('titulo')}
              aria-invalid={!!errors.titulo}
            />
            {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
            {erroServidor?.campos?.titulo && <p className="text-xs text-destructive">{erroServidor.campos.titulo}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nova-licao-conceito">
              Tema <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nova-licao-conceito"
              placeholder="Ex.: Repetição"
              maxLength={LIMITES_LICAO.conceitoMax}
              {...register('conceito')}
              aria-invalid={!!errors.conceito}
            />
            {errors.conceito && <p className="text-xs text-destructive">{errors.conceito.message}</p>}
            {erroServidor?.campos?.conceito && (
              <p className="text-xs text-destructive">{erroServidor.campos.conceito}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nova-licao-resumo">Descrição (opcional)</Label>
            <Textarea id="nova-licao-resumo" rows={3} {...register('resumo')} aria-invalid={!!errors.resumo} />
            {errors.resumo && <p className="text-xs text-destructive">{errors.resumo.message}</p>}
          </div>
          {erroServidor && !erroServidor.campos && <p className="text-sm text-destructive">{erroServidor.mensagem}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={criar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? 'Criando...' : 'Criar e editar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
