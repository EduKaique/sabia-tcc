"use client";

import { useState, useCallback } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
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
import { PalcoRobo } from "@/components/aluno/editor/PalcoRobo";
import { PRESETS_CENARIO, cenarioSemLimite, presetDoCenario } from "@/lib/cenariosRobo";
import type {
  AtividadeAvaliativa,
  CenarioRobo,
  ErroApi,
  StatusAtividade,
  TipoAtividade,
} from "@/types";
import type { GerarAtividadeIaRequest } from "@/services/ia";
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

const ID_PERSONALIZADO = "personalizado";

/** Cenário salvo na atividade (já validado pelo backend); null se não houver. */
function lerCenarioSalvo(cenarioJson: string | null | undefined): CenarioRobo | null {
  if (!cenarioJson) return null;
  try {
    return JSON.parse(cenarioJson) as CenarioRobo;
  } catch {
    return null;
  }
}

export function AtividadeForm({ atividade, tipoAtividade }: Props) {
  const router = useRouter();
  const isEditing = !!atividade;
  const { data: turmas = [] } = useTurmas();
  const [painelIaAberto, setPainelIaAberto] = useState(false);
  const [gabaritoIa, setGabaritoIa] = useState<string | null>(null);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const cenarioSalvo = lerCenarioSalvo(atividade?.cenarioJson);

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
          modo: atividade.modo ?? "BLOCOS",
          presetCenario: cenarioSalvo
            ? (presetDoCenario(cenarioSalvo) ?? ID_PERSONALIZADO)
            : undefined,
          maxBlocos: cenarioSalvo?.maxBlocos ?? "",
        }
      : {
          titulo: "",
          pontuacaoMaxima: 10,
          descricao: "",
          gabaritoEstadoJson: "",
          modo: "BLOCOS",
          maxBlocos: "",
        },
  });

  const modoJogo = useWatch({ control, name: "modo" }) === "JOGO_ROBO";
  const presetCenario = useWatch({ control, name: "presetCenario" });
  const cenarioPersonalizado = presetCenario === ID_PERSONALIZADO;
  const cenarioEscolhido = cenarioPersonalizado
    ? cenarioSalvo
    : (PRESETS_CENARIO.find((p) => p.id === presetCenario)?.cenario ?? null);

  const criar = useCriarAtividade();
  const atualizar = useAtualizarAtividade(atividade?.id ?? "");
  const publicar = usePublicarAtividade();

  const handleBlocklyStateChange = useCallback(
    (state: string) => {
      setValue("gabaritoEstadoJson", state, { shouldDirty: true });
    },
    [setValue]
  );

  /** cenarioJson enviado: o preset (ou o cenário personalizado salvo) com o limite de blocos, se houver. */
  function montarCenarioJson(data: AtividadeFormData): string | undefined {
    if (data.modo !== "JOGO_ROBO") return undefined;
    const base =
      data.presetCenario === ID_PERSONALIZADO
        ? cenarioSalvo
        : PRESETS_CENARIO.find((p) => p.id === data.presetCenario)?.cenario;
    if (!base) return undefined;
    const semLimite = cenarioSemLimite(base);
    return JSON.stringify(data.maxBlocos ? { ...semLimite, maxBlocos: data.maxBlocos } : semLimite);
  }

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
      // Atividades BLOCOS que continuam BLOCOS mandam o mesmo payload de antes.
      ...(data.modo === "JOGO_ROBO" || atividade?.modo === "JOGO_ROBO"
        ? { modo: data.modo ?? "BLOCOS", cenarioJson: montarCenarioJson(data) }
        : {}),
    };

    setErroServidor(null);
    try {
      if (isEditing) {
        await atualizar.mutateAsync(payload);
      } else {
        await criar.mutateAsync(payload);
      }
    } catch (err) {
      // 409: o backend recusou trocar modo/cenário de uma atividade com submissões.
      const resposta = (err as { response?: { status?: number; data?: ErroApi } }).response;
      if (resposta?.status === 409) {
        setErroServidor(resposta.data?.erro ?? "Não foi possível salvar a atividade.");
        return;
      }
      throw err;
    }
    router.push("/professor/atividades");
  }

  function handleAbrirPainelIa() {
    setPainelIaAberto(true);
  }

  function handleAceitarSugestao(sugestao: GerarAtividadeIaRequest, turmaId: number) {
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
              <Button
                type="button"
                variant="outline"
                onClick={handleAbrirPainelIa}
                disabled={modoJogo}
                aria-describedby={modoJogo ? "ia-indisponivel-jogo" : undefined}
              >
                <Sparkles size={16} />
                Assistente de IA
              </Button>
            </div>
            {modoJogo && (
              <p id="ia-indisponivel-jogo" className="mt-2 text-sm text-muted-foreground">
                O assistente de IA ainda não está disponível para o Jogo do Robô.
              </p>
            )}
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

        <div className="space-y-1.5">
          <Label htmlFor="modo">Modo</Label>
          <Controller
            control={control}
            name="modo"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? "BLOCOS"}>
                <SelectTrigger id="modo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLOCOS">Blocos livres</SelectItem>
                  <SelectItem value="JOGO_ROBO">Jogo do Robô</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {modoJogo && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="presetCenario">
                  Cenário <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="presetCenario"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={cenarioPersonalizado}
                    >
                      <SelectTrigger id="presetCenario" className="w-full">
                        <SelectValue placeholder="Escolha um cenário" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRESETS_CENARIO.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome}
                          </SelectItem>
                        ))}
                        {cenarioPersonalizado && (
                          <SelectItem value={ID_PERSONALIZADO}>Cenário personalizado</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {cenarioPersonalizado && (
                  <p className="text-xs text-muted-foreground">
                    Este cenário não corresponde a nenhum modelo e não pode ser trocado aqui.
                  </p>
                )}
                {errors.presetCenario && (
                  <p className="text-xs text-destructive">{errors.presetCenario.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maxBlocos">Limite de blocos (opcional)</Label>
                <Input
                  id="maxBlocos"
                  {...register("maxBlocos")}
                  type="number"
                  min={1}
                  step={1}
                  className="w-40"
                />
                {errors.maxBlocos && (
                  <p className="text-xs text-destructive">{errors.maxBlocos.message}</p>
                )}
              </div>
            </div>

            {cenarioEscolhido && (
              <div className="size-40 rounded-md border border-border p-1.5">
                <PalcoRobo cenario={cenarioEscolhido} posicao={cenarioEscolhido.inicio} erro={false} />
              </div>
            )}
          </div>
        )}

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

        {!modoJogo && (
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
        )}

        {erroServidor && (
          <p role="alert" className="text-sm text-destructive">
            {erroServidor}
          </p>
        )}

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
