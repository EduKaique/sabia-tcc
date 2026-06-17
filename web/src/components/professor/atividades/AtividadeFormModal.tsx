'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { atividadeSchema, type AtividadeFormData } from '@/lib/schemas/atividadeSchema'
import {
  useCriarAtividade,
  useAtualizarAtividade,
  usePublicarAtividade,
} from '@/hooks/useAtividades'
import { useTurmas } from '@/hooks/useTurmas'
import { RichTextEditor } from './RichTextEditor'
import type { AtividadeAvaliativa } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  atividade?: AtividadeAvaliativa
}

export function AtividadeForm({ atividade }: Props) {
  const router = useRouter()
  const isEditing = !!atividade
  const { data: turmas = [] } = useTurmas()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AtividadeFormData>({
    resolver: zodResolver(atividadeSchema),
    defaultValues: atividade
      ? {
          titulo: atividade.titulo,
          descricao: atividade.descricao ?? '',
          turmaId: atividade.turmaId,
          pontuacaoMaxima: atividade.pontuacaoMaxima,
          dataEntrega: atividade.dataEntrega ?? undefined,
        }
      : { pontuacaoMaxima: 10, descricao: '' },
  })

  const criar = useCriarAtividade()
  const atualizar = useAtualizarAtividade(atividade?.id ?? '')
  const publicar = usePublicarAtividade()

  async function onSubmit(data: AtividadeFormData, publish: boolean) {
    if (isEditing) {
      const payload = { ...data, dataEntrega: data.dataEntrega ?? null }
      const updated = await atualizar.mutateAsync(payload)
      if (publish && updated.status !== 'PUBLICADA') {
        await publicar.mutateAsync(updated.id)
      }
    } else {
      const payload = { ...data, dataEntrega: data.dataEntrega ?? null }
      const created = await criar.mutateAsync(payload)
      if (publish) {
        await publicar.mutateAsync(created.id)
      }
    }
    router.push('/professor/atividades')
  }

  const pending = isSubmitting || criar.isPending || atualizar.isPending || publicar.isPending
  const alreadyPublished = isEditing && atividade.status === 'PUBLICADA'

  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d, false))} noValidate className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="titulo">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="titulo"
          {...register('titulo')}
          placeholder="Ex: Lista de exercícios — Capítulo 3"
        />
        {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>
          Descrição <span className="text-destructive">*</span>
        </Label>
        <Controller
          control={control}
          name="descricao"
          render={({ field }) => (
            <RichTextEditor value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
        {errors.descricao && (
          <p className="text-xs text-destructive">{errors.descricao.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="turmaId">
            Turma <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="turmaId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="turmaId">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={t.nome}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.turmaId && <p className="text-xs text-destructive">{errors.turmaId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pontuacaoMaxima">
            Pontuação máxima <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pontuacaoMaxima"
            {...register('pontuacaoMaxima')}
            type="number"
            min={1}
            max={100}
          />
          {errors.pontuacaoMaxima && (
            <p className="text-xs text-destructive">{errors.pontuacaoMaxima.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dataEntrega">Data de entrega</Label>
        <Input id="dataEntrega" {...register('dataEntrega')} type="date" />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
        <Button type="submit" variant="outline" disabled={pending}>
          Salvar rascunho
        </Button>
        {!alreadyPublished && (
          <Button
            type="button"
            disabled={pending}
            onClick={handleSubmit((d) => onSubmit(d, true))}
          >
            Publicar
          </Button>
        )}
        {alreadyPublished && (
          <Button
            type="button"
            disabled={pending}
            onClick={handleSubmit((d) => onSubmit(d, false))}
          >
            Salvar alterações
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="ml-auto"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
