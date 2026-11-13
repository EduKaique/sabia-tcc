"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useRedefinirSenhaAluno } from "@/hooks/useTurmaAlunos";
import { mensagemErroTurma } from "@/hooks/useTurmas";
import {
  redefinirSenhaAlunoSchema,
  type RedefinirSenhaAlunoFormData,
} from "@/lib/schemas/redefinirSenhaAlunoSchema";
import type { AlunoDaTurma } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PADRAO: RedefinirSenhaAlunoFormData = { modo: "ALEATORIA", senha: "", exigirTroca: true };

interface Resultado {
  senhaTemporaria?: string;
  exigirTroca: boolean;
}

interface Props {
  turmaId: number;
  aluno: AlunoDaTurma | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * A senha (gerada ou digitada) existe só neste componente: não vai para toast, URL,
 * localStorage nem para o cache do React Query. Ao fechar, tudo é limpo.
 */
export function RedefinirSenhaAlunoDialog({ turmaId, aluno, onOpenChange }: Props) {
  const redefinir = useRedefinirSenhaAluno(turmaId);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RedefinirSenhaAlunoFormData>({
    resolver: zodResolver(redefinirSenhaAlunoSchema),
    defaultValues: PADRAO,
  });
  const modo = useWatch({ control, name: "modo" });
  const exigirTroca = useWatch({ control, name: "exigirTroca" });
  const nome = aluno?.nome ?? `Aluno #${aluno?.alunoId}`;

  const fechar = (open: boolean) => {
    if (open) return;
    reset(PADRAO);
    setResultado(null);
    setMostrarSenha(false);
    setCopiado(false);
    redefinir.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: RedefinirSenhaAlunoFormData) => {
    if (!aluno) return;
    redefinir.mutate(
      {
        alunoId: aluno.alunoId,
        payload: {
          modo: data.modo,
          senha: data.modo === "DIGITADA" ? data.senha : undefined,
          exigirTroca: data.exigirTroca,
        },
      },
      {
        onSuccess: (resposta) => {
          setResultado({ senhaTemporaria: resposta.senhaTemporaria, exigirTroca: resposta.exigirTroca });
          // A senha digitada não fica no formulário depois do sucesso.
          reset(PADRAO);
          redefinir.reset();
        },
      },
    );
  };

  const copiar = async () => {
    if (!resultado?.senhaTemporaria) return;
    await navigator.clipboard.writeText(resultado.senhaTemporaria);
    setCopiado(true);
  };

  return (
    <Dialog open={!!aluno} onOpenChange={fechar}>
      <DialogContent>
        {resultado ? (
          <>
            <DialogHeader>
              <DialogTitle>Senha redefinida</DialogTitle>
              <DialogDescription>
                A senha antiga de {nome} deixou de funcionar.
              </DialogDescription>
            </DialogHeader>

            {resultado.senhaTemporaria ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/40 py-4 text-center">
                  <p className="text-xs text-muted-foreground">Nova senha</p>
                  <p className="font-mono text-3xl font-bold tracking-wider text-foreground select-all">
                    {resultado.senhaTemporaria}
                  </p>
                </div>
                <p className="text-sm font-medium text-destructive">
                  Anote agora: esta senha não será mostrada novamente.
                </p>
              </div>
            ) : (
              <p className="text-sm text-foreground">A senha que você digitou já está valendo.</p>
            )}

            <p className="text-sm text-muted-foreground">
              {resultado.exigirTroca
                ? "No próximo acesso, o aluno vai precisar criar uma senha nova."
                : "O aluno poderá continuar com esta senha e trocá-la quando quiser em Alterar senha."}
            </p>

            <DialogFooter>
              {resultado.senhaTemporaria && (
                <Button variant="outline" onClick={copiar}>
                  {copiado ? <Check size={16} /> : <Copy size={16} />}
                  {copiado ? "Copiada" : "Copiar"}
                </Button>
              )}
              <Button onClick={() => fechar(false)}>Concluir</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
            <DialogHeader>
              <DialogTitle>Redefinir senha</DialogTitle>
              <DialogDescription>Nova senha para {nome}.</DialogDescription>
            </DialogHeader>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-foreground">Como criar a senha</legend>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="radio" value="ALEATORIA" {...register("modo")} className="accent-primary" />
                Gerar senha automática
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="radio" value="DIGITADA" {...register("modo")} className="accent-primary" />
                Digitar senha
              </label>
            </fieldset>

            {modo === "DIGITADA" && (
              <div className="space-y-1.5">
                <Label htmlFor="senha-aluno">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="senha-aluno"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    aria-describedby="senha-aluno-ajuda"
                    {...register("senha")}
                  />
                  <button
                    type="button"
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={mostrarSenha}
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p id="senha-aluno-ajuda" className="text-xs text-muted-foreground">
                  De 8 a 64 caracteres, sem espaço no início ou no fim.
                </p>
                {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="exigir-troca">Exigir que o aluno troque a senha no próximo acesso</Label>
                <Controller
                  control={control}
                  name="exigirTroca"
                  render={({ field }) => (
                    <Switch id="exigir-troca" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              {!exigirTroca && (
                <p className="text-xs text-muted-foreground">
                  O aluno poderá continuar com esta senha e trocá-la quando quiser em Alterar senha.
                </p>
              )}
            </div>

            {redefinir.isError && (
              <p className="text-sm text-destructive">{mensagemErroTurma(redefinir.error)}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => fechar(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={redefinir.isPending}>
                {redefinir.isPending ? "Redefinindo..." : "Redefinir senha"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
