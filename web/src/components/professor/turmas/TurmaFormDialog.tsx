"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import {
  turmaSchema,
  etapasEnsino,
  etapaEnsinoLabels,
  turnos,
  turnoLabels,
  type TurmaFormData,
} from "@/lib/schemas/turmaSchema";
import { useCriarTurma, useAtualizarTurma, mensagemErroTurma } from "@/hooks/useTurmas";
import type { Turma } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turma?: Turma | null;
}

const VAZIO: Partial<TurmaFormData> = { nome: "", anoSerie: "" };

export function TurmaFormDialog({ open, onOpenChange, turma }: Props) {
  const isEditing = !!turma;
  const criar = useCriarTurma();
  const atualizar = useAtualizarTurma();
  const mutation = isEditing ? atualizar : criar;
  const [turmaCriada, setTurmaCriada] = useState<Turma | null>(null);
  const [copiado, setCopiado] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TurmaFormData>({
    resolver: zodResolver(turmaSchema),
    defaultValues: turma
      ? {
          nome: turma.nome,
          etapa: turma.etapa,
          anoSerie: turma.anoSerie ?? "",
          turno: turma.turno ?? undefined,
        }
      : VAZIO,
  });

  const onSubmit = (data: TurmaFormData) => {
    if (turma) {
      atualizar.mutate({ id: turma.id, payload: data }, { onSuccess: () => onOpenChange(false) });
    } else {
      criar.mutate(data, {
        onSuccess: (nova) => (nova.codigoConvite ? setTurmaCriada(nova) : onOpenChange(false)),
      });
    }
  };

  const linkConvite = turmaCriada?.codigoConvite
    ? `${window.location.origin}/convite/${turmaCriada.codigoConvite}`
    : "";

  const copiarLink = async () => {
    await navigator.clipboard.writeText(linkConvite);
    setCopiado(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {turmaCriada ? (
          <>
            <DialogHeader>
              <DialogTitle>Turma criada!</DialogTitle>
              <DialogDescription>
                Compartilhe o código de convite com os alunos de {turmaCriada.nome}.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-border bg-muted/40 py-4 text-center">
              <p className="text-xs text-muted-foreground">Código de convite</p>
              <p className="text-3xl font-bold tracking-widest text-foreground">
                {turmaCriada.codigoConvite}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={copiarLink}>
                {copiado ? <Check size={16} /> : <Copy size={16} />}
                {copiado ? "Link copiado" : "Copiar Link de Convite"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Turma" : "Criar Turma"}</DialogTitle>
              <DialogDescription>Todos os campos são obrigatórios.</DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome da Turma</Label>
              <Input id="nome" placeholder="Ex.: Programação I — 2026/2" {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="etapa">Modalidade de Ensino</Label>
              <Controller
                control={control}
                name="etapa"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger id="etapa" className="w-full">
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {etapasEnsino.map((e) => (
                        <SelectItem key={e} value={e}>
                          {etapaEnsinoLabels[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.etapa && <p className="text-xs text-destructive">{errors.etapa.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="anoSerie">Ano/Série</Label>
                <Input id="anoSerie" placeholder="Ex.: 5º ano" {...register("anoSerie")} />
                {errors.anoSerie && (
                  <p className="text-xs text-destructive">{errors.anoSerie.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="turno">Turno</Label>
                <Controller
                  control={control}
                  name="turno"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <SelectTrigger id="turno" className="w-full">
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                      <SelectContent>
                        {turnos.map((t) => (
                          <SelectItem key={t} value={t}>
                            {turnoLabels[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.turno && <p className="text-xs text-destructive">{errors.turno.message}</p>}
              </div>
            </div>

            {mutation.isError && (
              <p className="text-sm text-destructive">{mensagemErroTurma(mutation.error)}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar Turma"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
