"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
        <DialogTitle>Nova Variável</DialogTitle>
      </DialogHeader>

      <div className="space-y-2 py-2">
        <Label htmlFor="var-name">{message}</Label>
        <Input
          id="var-name"
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nome da variável"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={!value.trim()}>
          Criar
        </Button>
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
      <DialogContent className="sm:max-w-sm">
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
