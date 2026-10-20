"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fredoka, nunito } from "@/lib/fontesHome";
import { botaoPrincipal, botaoSecundario, campo, cartao, rotulo } from "@/lib/estilos";

interface Props {
  open: boolean;
  message: string;
  defaultValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

function ModalContent({ message, defaultValue, onConfirm, onCancel }: Omit<Props, "open">) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleConfirm = () => {
    if (value.trim()) onConfirm(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onCancel();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className={cn(fredoka.className, "text-2xl font-bold text-tinta")}>
          Nova Variável
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-2 py-2">
        <label htmlFor="var-name" className={cn(rotulo, "block")}>
          {message}
        </label>
        <input
          id="var-name"
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nome da variável"
          className={campo}
        />
      </div>

      <DialogFooter>
        <button type="button" onClick={onCancel} className={botaoSecundario}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!value.trim()}
          className={cn(
            botaoPrincipal,
            fredoka.className,
            "min-h-12 py-2 text-base disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          Criar
        </button>
      </DialogFooter>
    </>
  );
}

export function ModalNomeVariavel({ open, message, defaultValue, onConfirm, onCancel }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent className={cn(nunito.className, cartao, "ring-0 text-tinta sm:max-w-sm")}>
        <ModalContent
          key={defaultValue + String(open)}
          message={message}
          defaultValue={defaultValue}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
