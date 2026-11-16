"use client";

import { lerCenario } from "@/lib/cenariosRobo";
import { useAtualizarCenario, useCriarCenario, mensagemErroCenario } from "@/hooks/useCenarios";
import type { CenarioSalvo, CenarioSalvoPayload } from "@/types/cenario";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditorCenario } from "./EditorCenario";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cenário a editar; sem ele, cria um novo. */
  cenario?: CenarioSalvo | null;
}

export function CenarioFormDialog({ open, onOpenChange, cenario }: Props) {
  const isEditing = !!cenario;
  const criar = useCriarCenario();
  const atualizar = useAtualizarCenario();
  const mutation = isEditing ? atualizar : criar;
  const cenarioLido = cenario ? lerCenario(cenario.cenarioJson) : null;

  function salvar(payload: CenarioSalvoPayload) {
    const fechar = { onSuccess: () => onOpenChange(false) };
    if (cenario) {
      atualizar.mutate({ id: cenario.id, payload }, fechar);
    } else {
      criar.mutate(payload, fechar);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cenário" : "Novo cenário"}</DialogTitle>
          <DialogDescription>
            Escolha uma ferramenta e clique nas casas para posicionar o início, o destino e os
            obstáculos.
          </DialogDescription>
        </DialogHeader>
        <EditorCenario
          valorInicial={cenario && cenarioLido ? { nome: cenario.nome, cenario: cenarioLido } : undefined}
          onSalvar={salvar}
          onCancelar={() => onOpenChange(false)}
          salvando={mutation.isPending}
          erro={mutation.isError ? mensagemErroCenario(mutation.error) : null}
        />
      </DialogContent>
    </Dialog>
  );
}
