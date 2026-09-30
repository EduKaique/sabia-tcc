'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAtividade } from '@/hooks/useAtividades'
import { useCorrigirSubmissao, mensagemErroSubmissao } from '@/hooks/useSubmissaoProfessor'
import { correcaoSchema, type CorrecaoFormData, type CorrecaoFormInput } from '@/lib/schemas/correcaoSchema'
import type { ErroApi } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  submissaoId: string
  atividadeId: number
}

export function FormCorrecao({ submissaoId, atividadeId }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const corrigir = useCorrigirSubmissao()
  const { data: atividade } = useAtividade(String(atividadeId))
  const [dadosConfirmar, setDadosConfirmar] = useState<CorrecaoFormData | null>(null)
  const [erroServidor, setErroServidor] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CorrecaoFormInput, unknown, CorrecaoFormData>({
    resolver: zodResolver(correcaoSchema),
    defaultValues: { nota: '', feedbackProfessor: '' },
  })

  const publicar = () => {
    if (!dadosConfirmar) return
    setErroServidor(null)
    corrigir.mutate(
      { id: submissaoId, payload: dadosConfirmar },
      {
        onSuccess: () => router.push(`/professor/atividades/${atividadeId}`),
        onError: (err) => {
          setDadosConfirmar(null)
          const resposta = (err as { response?: { status?: number; data?: ErroApi } }).response
          if (resposta?.status === 400 && resposta.data?.campos) {
            for (const [campo, msg] of Object.entries(resposta.data.campos)) {
              if (campo === 'nota' || campo === 'feedbackProfessor') setError(campo, { message: msg })
            }
            return
          }
          setErroServidor(mensagemErroSubmissao(err))
          if (resposta?.status === 422) {
            queryClient.invalidateQueries({ queryKey: ['submissao-professor', submissaoId] })
          }
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliação Final</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(setDadosConfirmar)} className="grid gap-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nota">Nota Definitiva (0 a 100)</Label>
            <Input
              id="nota"
              type="number"
              step="0.01"
              min={0}
              max={100}
              className="w-40"
              {...register('nota')}
            />
            {atividade && (
              <p className="text-xs text-muted-foreground">
                Pontuação máxima da atividade: {atividade.pontuacaoMaxima}
              </p>
            )}
            {errors.nota && <p className="text-xs text-destructive">{errors.nota.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedbackProfessor">Comentário / Feedback Final</Label>
            <Textarea id="feedbackProfessor" rows={5} {...register('feedbackProfessor')} />
            {errors.feedbackProfessor && (
              <p className="text-xs text-destructive">{errors.feedbackProfessor.message}</p>
            )}
          </div>

          {erroServidor && <p className="text-sm text-destructive">{erroServidor}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={corrigir.isPending}>
              Publicar Nota
            </Button>
          </div>
        </form>
      </CardContent>

      <AlertDialog
        open={!!dadosConfirmar}
        onOpenChange={(open) => !open && !corrigir.isPending && setDadosConfirmar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar nota {dadosConfirmar?.nota}?</AlertDialogTitle>
            <AlertDialogDescription>
              Depois de publicada, a nota não poderá ser alterada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={corrigir.isPending}>Cancelar</AlertDialogCancel>
            <Button onClick={publicar} disabled={corrigir.isPending}>
              {corrigir.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
