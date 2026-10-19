'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cartao } from '@/lib/estilos'
import { ErroRequisicao } from '@/lib/erroRequisicao'
import { MENSAGEM_CODIGO_INVALIDO } from '@/services/convites'
import { useEntrarNaTurma } from '@/hooks/useTurmasAluno'
import {
  PainelCodigo,
  TAMANHO_CODIGO,
  type MensagemCodigo,
} from '@/components/aluno/primeiro-acesso/PainelCodigo'

const MSG_AJUDA_CODIGO = 'O código tem 6 letras e números.'
const MSG_FALHA = 'Não foi possível verificar agora. Tente novamente.'

/** Aluno logado sem turma: digita o código e entra. Ao vincular, a lista de atividades recarrega. */
export function PainelEntrarTurma() {
  const [codigo, setCodigo] = useState('')
  const [mensagem, setMensagem] = useState<MensagemCodigo | null>(null)
  const entrar = useEntrarNaTurma()

  const enviar = () => {
    if (codigo.length < TAMANHO_CODIGO) {
      setMensagem({ tipo: 'ajuda', texto: MSG_AJUDA_CODIGO })
      return
    }
    entrar.mutate(codigo, {
      onError: (erro) => {
        const e = erro instanceof ErroRequisicao ? erro : null
        const texto = e?.status === 404 ? MENSAGEM_CODIGO_INVALIDO : e?.status === 409 ? e.message : MSG_FALHA
        setMensagem({ tipo: 'erro', texto })
      },
    })
  }

  return (
    <section aria-label="Entre na sua turma" className={cn(cartao, 'mx-auto w-full max-w-md p-5 sm:p-7')}>
      <p className="mb-5 flex items-center justify-center gap-2 rounded-2xl bg-sabia-azul-claro px-4 py-3 text-base font-bold text-tinta">
        <Users size={20} className="shrink-0 text-sabia-azul-escuro" aria-hidden="true" />
        Entre na sua turma para ver as atividades.
      </p>
      <PainelCodigo
        codigo={codigo}
        onCodigoChange={(valor) => {
          setCodigo(valor)
          setMensagem(null)
        }}
        mensagem={mensagem}
        validando={entrar.isPending}
        onEnviar={enviar}
      />
    </section>
  )
}
