"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  atividadeSchema,
  type AtividadeFormData,
  type AtividadeFormInput,
} from "@/lib/schemas/atividadeSchema";
import {
  useCriarAtividade,
  useAtualizarAtividade,
  usePublicarAtividade,
} from "@/hooks/useAtividades";
import { useTurmas } from "@/hooks/useTurmas";
import { RichTextEditor } from "./RichTextEditor";
import { GerarAtividadeIaPanel } from "./GerarAtividadeIaPanel";
import BlocklyEditor from "@/components/BlocklyEditor";
import type { AtividadeAvaliativa, StatusAtividade, TipoAtividade } from "@/types";
import type { SugestaoAtividadeIa } from "@/service/ia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  atividade?: AtividadeAvaliativa;
  tipoAtividade: TipoAtividade;
}

const tipoAtividadeLabels: Record<TipoAtividade, string> = {
  ATIVIDADE_AVALIATIVA: "Atividade Avaliativa",
  ATIVIDADE_TRILHA: "Atividade Trilha",
};

export function AtividadeForm({ atividade, tipoAtividade }: Props) {
  const router = useRouter();
  const isEditing = !!atividade;
  const { data: turmas = [] } = useTurmas();
  const [painelIaAberto, setPainelIaAberto] = useState(false);
  const [gabaritoIa, setGabaritoIa] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AtividadeFormInput, unknown, AtividadeFormData>({
    resolver: zodResolver(atividadeSchema),
    defaultValues: atividade
      ? {
          titulo: atividade.titulo,
          descricao: atividade.descricao ?? "",
          turmaId: atividade.turmaId,
          pontuacaoMaxima: atividade.pontuacaoMaxima,
          dataEntrega: atividade?.dataEntrega ?? undefined,
          gabaritoEstadoJson: atividade.gabaritoEstadoJson ?? "",
        }
      : { 
          titulo: "", 
          pontuacaoMaxima: 10, 
          descricao: "", 
          gabaritoEstadoJson: "" 
        },
  });

  const criar = useCriarAtividade();
  const atualizar = useAtualizarAtividade(atividade?.id ?? "");
  const publicar = usePublicarAtividade();

  const handleBlocklyStateChange = useCallback(
    (state: string) => {
      setValue("gabaritoEstadoJson", state, { shouldDirty: true });
    },
    [setValue]
  );

  async function onSubmit(data: AtividadeFormData, publish: boolean) {
    const dataEntregaFormatada = data.dataEntrega ? data.dataEntrega.toISOString() : undefined;
    const statusAtividade: StatusAtividade = publish ? "PUBLICADA" : "RASCUNHO";
    const payload = {
      titulo: data.titulo,
      descricao: data.descricao,
      turmaId: data.turmaId,
      pontuacaoMaxima: data.pontuacaoMaxima,
      dataEntrega: dataEntregaFormatada,
      status: statusAtividade,
      gabaritoEstadoJson: data.gabaritoEstadoJson,
    };

    if (isEditing) {
      await atualizar.mutateAsync(payload);
    } else {
      await criar.mutateAsync(payload);
    }
    router.push("/professor/atividades");
  }

  function handleAbrirPainelIa() {
    setPainelIaAberto(true);
  }

  function handleAceitarSugestao(sugestao: SugestaoAtividadeIa, turmaId: number) {
    setValue("titulo", sugestao.titulo, { shouldDirty: true, shouldValidate: true });
    setValue("descricao", sugestao.descricao, { shouldDirty: true, shouldValidate: true });
    setValue("turmaId", turmaId, { shouldDirty: true, shouldValidate: true });
    if (sugestao.gabaritoEstadoJson) {
      setGabaritoIa(sugestao.gabaritoEstadoJson);
    }
    setPainelIaAberto(false);
  }

  const pending = isSubmitting || criar.isPending || atualizar.isPending || publicar.isPending;
  const alreadyPublished = isEditing && atividade.status === "PUBLICADA";

  return (
    <>
      <form
        onSubmit={handleSubmit((d) => onSubmit(d, alreadyPublished))}
        noValidate
        className="space-y-6"
      >
        {!isEditing && (
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Criar com IA</h2>
                <p className="text-sm text-muted-foreground">
                  Descreva o objetivo pedagogico e receba uma sugestao de titulo e descricao.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handleAbrirPainelIa}>
                <Sparkles size={16} />
                Assistente de IA
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="titulo">
            Título <span className="text-destructive">*</span>
          </Label>
          <Input
            id="titulo"
            {...register("titulo")}
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
              <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
            )}
          />
          {errors.descricao && (
            <p className="text-xs text-destructive">{errors.descricao.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="turmaId">
            Turma <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="turmaId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <SelectTrigger id="turmaId" className="w-full">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.turmaId && <p className="text-xs text-destructive">{errors.turmaId.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pontuacaoMaxima">
              Pontuação máxima <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pontuacaoMaxima"
              {...register("pontuacaoMaxima")}
              type="number"
              min={1}
              max={100}
            />
            {errors.pontuacaoMaxima && (
              <p className="text-xs text-destructive">{errors.pontuacaoMaxima.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dataEntrega">Data de entrega</Label>
            <Input id="dataEntrega" {...register("dataEntrega")} type="date" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Gabarito da Atividade</Label>
          <div className="rounded-md overflow-hidden border border-border">
            <BlocklyEditor
              onStateChange={handleBlocklyStateChange}
              initialState={gabaritoIa ?? atividade?.gabaritoEstadoJson ?? undefined}
            />
          </div>
          {errors.gabaritoEstadoJson && (
            <p className="text-xs text-destructive">
              {errors.gabaritoEstadoJson?.message as string}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center gap-3 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>

          <div className="flex gap-3">
            {!alreadyPublished && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={handleSubmit((d) => onSubmit(d, false))}
              >
                Salvar rascunho
              </Button>
            )}

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
                onClick={handleSubmit((d) => onSubmit(d, true))}
              >
                Salvar alterações
              </Button>
            )}
          </div>
        </div>
      </form>

      {!isEditing && (
        <GerarAtividadeIaPanel
          open={painelIaAberto}
          tipoAtividade={tipoAtividade}
          tipoAtividadeLabel={tipoAtividadeLabels[tipoAtividade]}
          onAccept={handleAceitarSugestao}
          onClose={() => setPainelIaAberto(false)}
        />
      )}
    </>
  );
}
