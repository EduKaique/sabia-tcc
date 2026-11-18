"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import Link from "next/link";
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
import { mensagemErroCenario, useCenarios, useCriarCenario } from "@/hooks/useCenarios";
import { RichTextEditor } from "./RichTextEditor";
import { GerarAtividadeIaPanel, type SugestaoAtividadeIa } from "./GerarAtividadeIaPanel";
import { EditorCenario } from "@/components/professor/cenarios/EditorCenario";
import { valorInicialEditor } from "@/lib/assistenteRoboIa";
import BlocklyEditor from "@/components/BlocklyEditor";
import { PalcoRobo } from "@/components/aluno/editor/PalcoRobo";
import {
  PREFIXO_CENARIO_SALVO,
  PRESETS_CENARIO,
  cenarioSemLimite,
  lerCenario,
  opcaoDoCenario,
  presetDoCenario,
} from "@/lib/cenariosRobo";
import type {
  AtividadeAvaliativa,
  CenarioRobo,
  ErroApi,
  StatusAtividade,
  TipoAtividade,
} from "@/types";
import type { CenarioSalvoPayload } from "@/types/cenario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  // Cenário sugerido pela IA, aberto no editor até o professor salvar ou cancelar.
  const [cenarioSugerido, setCenarioSugerido] = useState<{ nome: string; cenario: CenarioRobo } | null>(null);
  const [avisoIa, setAvisoIa] = useState<string | null>(null);
  const criarCenario = useCriarCenario();
  const cenarioSalvo = lerCenarioSalvo(atividade?.cenarioJson);
  const { data: cenariosDoProfessor = [] } = useCenarios();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
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

  /** Cenário de uma opção do seletor: preset, cenário salvo do professor ou o snapshot atual da atividade. */
  function resolverCenario(opcao: string | undefined): CenarioRobo | null {
    if (opcao === ID_PERSONALIZADO) return cenarioSalvo;
    if (opcao?.startsWith(PREFIXO_CENARIO_SALVO)) {
      const id = Number(opcao.slice(PREFIXO_CENARIO_SALVO.length));
      return lerCenario(cenariosDoProfessor.find((c) => c.id === id)?.cenarioJson);
    }
    return PRESETS_CENARIO.find((p) => p.id === opcao)?.cenario ?? null;
  }
  const cenarioEscolhido = resolverCenario(presetCenario);

  // Para o assistente de IA: o cenário escolhido com o limite de blocos do formulário.
  const maxBlocosForm = Number(useWatch({ control, name: "maxBlocos" }));
  const cenarioParaIa: CenarioRobo | null = cenarioEscolhido
    ? Number.isInteger(maxBlocosForm) && maxBlocosForm >= 1
      ? { ...cenarioSemLimite(cenarioEscolhido), maxBlocos: maxBlocosForm }
      : cenarioSemLimite(cenarioEscolhido)
    : null;
  const tituloForm = useWatch({ control, name: "titulo" }) ?? "";
  const descricaoForm = useWatch({ control, name: "descricao" }) ?? "";
  const camposPreenchidos =
    tituloForm.trim().length > 0 || descricaoForm.replace(/<[^>]*>/g, "").trim().length > 0;
  // O snapshot só aparece como "personalizado" quando não bate com nenhuma opção da lista.
  const mostrarPersonalizado =
    !!cenarioSalvo &&
    (cenarioPersonalizado || opcaoDoCenario(cenarioSalvo, cenariosDoProfessor) === null);

  // Os cenários salvos chegam depois do form: se o snapshot bater com um deles, seleciona-o (uma vez,
  // e só se o professor ainda não trocou a opção).
  const opcaoAjustada = useRef(false);
  const cenarioJsonAtividade = atividade?.cenarioJson;
  useEffect(() => {
    if (opcaoAjustada.current || cenariosDoProfessor.length === 0) return;
    opcaoAjustada.current = true;
    const snapshot = lerCenarioSalvo(cenarioJsonAtividade);
    if (!snapshot || getValues("presetCenario") !== ID_PERSONALIZADO) return;
    const opcao = opcaoDoCenario(snapshot, cenariosDoProfessor);
    if (opcao) setValue("presetCenario", opcao);
  }, [cenariosDoProfessor, cenarioJsonAtividade, getValues, setValue]);

  const criar = useCriarAtividade();
  const atualizar = useAtualizarAtividade(atividade?.id ?? "");
  const publicar = usePublicarAtividade();

  const handleBlocklyStateChange = useCallback(
    (state: string) => {
      setValue("gabaritoEstadoJson", state, { shouldDirty: true });
    },
    [setValue]
  );

  /** cenarioJson enviado (snapshot): a opção escolhida com o limite de blocos, se houver. */
  function montarCenarioJson(data: AtividadeFormData): string | undefined {
    if (data.modo !== "JOGO_ROBO") return undefined;
    const base = resolverCenario(data.presetCenario);
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
      // 409: o backend recusou trocar modo/cenário de uma atividade com submissões
      // ou a pontuação máxima de uma atividade com notas publicadas.
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

  function handleAceitarSugestao(sugestao: SugestaoAtividadeIa, turmaId: number) {
    setValue("titulo", sugestao.titulo, { shouldDirty: true, shouldValidate: true });
    setValue("descricao", sugestao.descricao, { shouldDirty: true, shouldValidate: true });
    setValue("turmaId", turmaId, { shouldDirty: true, shouldValidate: true });
    if (sugestao.gabaritoEstadoJson) {
      setGabaritoIa(sugestao.gabaritoEstadoJson);
    }
    setAvisoIa(null);
    if (modoJogo && sugestao.cenario !== undefined) {
      // O cenário sugerido só vira real quando o professor o salva no editor.
      const valor = valorInicialEditor(sugestao);
      if (valor) {
        criarCenario.reset();
        setCenarioSugerido(valor);
      } else {
        setAvisoIa(
          "O cenário sugerido pela IA veio inválido. O título e a descrição foram preenchidos; escolha ou crie um cenário."
        );
      }
    }
    setPainelIaAberto(false);
  }

  /** Salva o cenário sugerido na biblioteca (o servidor valida forma e caminho) e o seleciona. */
  function salvarCenarioSugerido(payload: CenarioSalvoPayload) {
    criarCenario.mutate(payload, {
      onSuccess: (criado) => {
        setValue("presetCenario", `${PREFIXO_CENARIO_SALVO}${criado.id}`, {
          shouldDirty: true,
          shouldValidate: true,
        });
        // Igual à troca manual no seletor: o limite do cenário preenche o campo.
        const limite = lerCenario(criado.cenarioJson)?.maxBlocos;
        if (limite) setValue("maxBlocos", limite);
        setCenarioSugerido(null);
      },
    });
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
            {avisoIa && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {avisoIa}
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
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="presetCenario">
                    Cenário <span className="text-destructive">*</span>
                  </Label>
                  <Link
                    href="/professor/cenarios"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Gerenciar cenários
                  </Link>
                </div>
                <Controller
                  control={control}
                  name="presetCenario"
                  render={({ field }) => (
                    <Select
                      onValueChange={(opcao) => {
                        field.onChange(opcao);
                        // O limite do cenário escolhido preenche o campo; "Limite de blocos" continua valendo.
                        const limite = resolverCenario(opcao)?.maxBlocos;
                        if (limite) setValue("maxBlocos", limite);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger id="presetCenario" className="w-full">
                        <SelectValue placeholder="Escolha um cenário" />
                      </SelectTrigger>
                      <SelectContent>
                        {mostrarPersonalizado && (
                          <SelectItem value={ID_PERSONALIZADO}>
                            Cenário personalizado (atual)
                          </SelectItem>
                        )}
                        <SelectGroup>
                          <SelectLabel>Prontos</SelectLabel>
                          {PRESETS_CENARIO.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {cenariosDoProfessor.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>Meus cenários</SelectLabel>
                            {cenariosDoProfessor.map((c) => (
                              <SelectItem key={c.id} value={`${PREFIXO_CENARIO_SALVO}${c.id}`}>
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {cenarioPersonalizado && (
                  <p className="text-xs text-muted-foreground">
                    Este é o cenário atual da atividade e não corresponde a nenhuma opção da lista.
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
              disabled={atividade?.possuiNotas}
            />
            {atividade?.possuiNotas && (
              <p className="text-xs text-muted-foreground">
                Não é possível alterar: a atividade já tem notas publicadas.
              </p>
            )}
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
          modoJogo={modoJogo}
          cenarioAtual={cenarioParaIa}
          camposPreenchidos={camposPreenchidos}
          onAccept={handleAceitarSugestao}
          onClose={() => setPainelIaAberto(false)}
        />
      )}

      <Dialog
        open={!!cenarioSugerido}
        onOpenChange={(aberto) => {
          if (!aberto) setCenarioSugerido(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cenário sugerido pela IA</DialogTitle>
            <DialogDescription>
              Revise o cenário e salve para usá-lo nesta atividade. Ele também fica em Meus
              cenários.
            </DialogDescription>
          </DialogHeader>
          {cenarioSugerido && (
            <EditorCenario
              valorInicial={cenarioSugerido}
              onSalvar={salvarCenarioSugerido}
              onCancelar={() => setCenarioSugerido(null)}
              salvando={criarCenario.isPending}
              erro={criarCenario.isError ? mensagemErroCenario(criarCenario.error) : null}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
