'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, Pencil, Puzzle, Trash2 } from 'lucide-react'
import { cn, formatarDataHora, parseDataUtc } from '@/lib/utils'
import { fredoka } from '@/lib/fontesHome'
import { botaoPrincipal, botaoSecundario, cartao, textoApoio, textoErro } from '@/lib/estilos'
import { extrairErroSandbox } from '@/lib/sandbox/errosSandbox'
import { useAtualizarProjetoSandbox } from '@/hooks/useProjetosSandbox'
import type { ProjetoSandboxResumo } from '@/types/projetoSandbox'
import { NomeProjetoEditavel } from './NomeProjetoEditavel'

export const ROTULO_MODO = {
  BLOCOS_LIVRES: 'Blocos livres',
  ROBO: 'Jogo do Robô',
} as const

interface Props {
  projeto: ProjetoSandboxResumo
  onExcluir: (projeto: ProjetoSandboxResumo) => void
}

export function ProjetoCard({ projeto, onExcluir }: Props) {
  const [renomeando, setRenomeando] = useState(false)
  const atualizar = useAtualizarProjetoSandbox(projeto.id)
  const Icone = projeto.modo === 'ROBO' ? Bot : Puzzle
  const erro = atualizar.isError ? extrairErroSandbox(atualizar.error).mensagem : null

  return (
    <li className={cn(cartao, 'flex flex-col gap-3 p-5')}>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-tinta/15 bg-sabia-azul-claro px-3 py-1 text-sm font-bold text-tinta">
        <Icone size={16} aria-hidden="true" />
        {ROTULO_MODO[projeto.modo]}
      </span>

      {renomeando ? (
        <NomeProjetoEditavel
          valor={projeto.nome}
          rotulo="Novo nome do projeto"
          onSalvar={(nome) => atualizar.mutate({ nome })}
          onFechar={() => setRenomeando(false)}
        />
      ) : (
        <h2 className={cn(fredoka.className, 'break-words text-xl font-bold text-tinta')}>{projeto.nome}</h2>
      )}

      <p className={textoApoio}>Editado em {formatarDataHora(parseDataUtc(projeto.atualizadoEm))}</p>
      {erro && (
        <p role="alert" className={textoErro}>
          {erro}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Link
          href={`/aluno/projetos/${projeto.id}/editor`}
          className={cn(botaoPrincipal, fredoka.className, 'min-h-12 py-2 text-base')}
        >
          Abrir
        </Link>
        <button
          type="button"
          onClick={() => {
            atualizar.reset()
            setRenomeando(true)
          }}
          disabled={renomeando}
          className={botaoSecundario}
        >
          <Pencil size={16} aria-hidden="true" />
          Renomear
        </button>
        <button
          type="button"
          onClick={() => onExcluir(projeto)}
          aria-label={`Excluir ${projeto.nome}`}
          className={cn(botaoSecundario, 'text-sabia-erro')}
        >
          <Trash2 size={16} aria-hidden="true" />
          Excluir
        </button>
      </div>
    </li>
  )
}
