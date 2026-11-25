import { useCallback, useEffect, useRef, useState } from 'react'
import { PEDAGOGICO_API_URL } from '@/lib/apiBase'
import { hasBlocks } from '@/lib/workspaceBlockly'
import { CODIGO_PROJETO_GRANDE, extrairErroSandbox } from '@/lib/sandbox/errosSandbox'
import { BASE_PROJETOS_SANDBOX } from '@/services/projetosSandbox'
import { useAtualizarProjetoSandbox } from '@/hooks/useProjetosSandbox'

/** Espera depois da última alteração do workspace antes do auto-save. */
const AUTOSAVE_MS = 2000
/** Corpo máximo de um fetch com keepalive (o navegador recusa acima de 64 KB). */
const LIMITE_KEEPALIVE_BYTES = 60 * 1024

export type StatusSalvamento = 'salvo' | 'pendente' | 'salvando' | 'erro' | 'grande'

/**
 * Auto-save do estado do workspace de um projeto do Sandbox.
 * - Debounce de 2 s depois de cada alteração real (eventos de UI e o carregamento não contam).
 * - Um salvamento por vez: alterações feitas durante um envio são salvas logo depois que ele termina.
 * - `salvarAgora` força o envio (botão Salvar). Ao desmontar, salva o que estiver pendente; ao fechar a aba,
 *   tenta um fetch com keepalive (projetos pequenos) ou pede confirmação de saída.
 * - Erro de tamanho (SANDBOX_PROJETO_GRANDE) não é retentado até o aluno alterar o projeto de novo.
 */
export function useAutoSaveSandbox(projetoId: number, estadoSalvo: string | null) {
  const atualizar = useAtualizarProjetoSandbox(projetoId)
  const mutateAsyncRef = useRef(atualizar.mutateAsync)
  useEffect(() => {
    mutateAsyncRef.current = atualizar.mutateAsync
  })

  const [status, setStatus] = useState<StatusSalvamento>('salvo')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)

  /** Último estado do workspace. */
  const estadoRef = useRef<string | null>(estadoSalvo)
  /** Último estado confirmado pelo servidor (ou o que veio dele); null = nada salvo ainda. */
  const ultimoSalvoRef = useRef<string | null>(estadoSalvo)
  /** Estado recusado por tamanho: não é reenviado. */
  const estadoGrandeRef = useRef<string | null>(null)
  const emAndamentoRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const montadoRef = useRef(true)
  /** Referência estável para o envio chamar o próximo salvamento ao terminar. */
  const salvarRef = useRef<() => void>(() => {})

  const temPendencia = () => {
    const estado = estadoRef.current
    return !!estado && estado !== ultimoSalvoRef.current && estado !== estadoGrandeRef.current
  }

  const definirStatus = (s: StatusSalvamento, mensagem: string | null = null) => {
    if (!montadoRef.current) return
    setStatus(s)
    setMensagemErro(mensagem)
  }

  const salvar = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = undefined
    // O envio em curso chama salvar de novo ao terminar, se ainda houver alteração.
    if (emAndamentoRef.current) return
    if (!temPendencia()) return
    const estado = estadoRef.current as string
    emAndamentoRef.current = true
    definirStatus('salvando')
    mutateAsyncRef
      .current({ estadoJson: estado })
      .then(() => {
        ultimoSalvoRef.current = estado
        definirStatus('salvo')
      })
      .catch((err: unknown) => {
        const erro = extrairErroSandbox(err)
        if (erro.codigo === CODIGO_PROJETO_GRANDE) {
          estadoGrandeRef.current = estado
          definirStatus('grande', erro.mensagem)
        } else {
          definirStatus('erro', erro.mensagem)
        }
        // Sem retentativa automática: a próxima alteração ou o botão tenta de novo.
        return Promise.reject(err)
      })
      .then(
        () => {
          emAndamentoRef.current = false
          if (temPendencia()) salvarRef.current()
        },
        () => {
          emAndamentoRef.current = false
        },
      )
  }, [])
  useEffect(() => {
    salvarRef.current = salvar
  }, [salvar])

  const notificarAlteracao = useCallback(
    (estado: string) => {
      estadoRef.current = estado
      // O listener do Blockly também dispara em eventos de UI e no carregamento: só agenda alteração real.
      if (estado === ultimoSalvoRef.current || estado === estadoGrandeRef.current) return
      if (ultimoSalvoRef.current === null && !hasBlocks(estado)) return
      if (!emAndamentoRef.current) definirStatus('pendente')
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(salvar, AUTOSAVE_MS)
    },
    [salvar],
  )

  // Ao sair da rota: não perde a alteração ainda em debounce.
  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      if (temPendencia()) salvar()
    }
  }, [salvar])

  // Ao fechar a aba: keepalive para projetos pequenos; acima disso, o aviso de saída do navegador.
  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => {
      if (!temPendencia()) return
      const corpo = JSON.stringify({ estadoJson: estadoRef.current })
      const token = localStorage.getItem('token')
      if (token && new Blob([corpo]).size < LIMITE_KEEPALIVE_BYTES) {
        clearTimeout(timerRef.current)
        void fetch(`${PEDAGOGICO_API_URL}${BASE_PROJETOS_SANDBOX}/${projetoId}`, {
          method: 'PUT',
          keepalive: true,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: corpo,
        }).catch(() => {})
        return
      }
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', antesDeSair)
    return () => window.removeEventListener('beforeunload', antesDeSair)
  }, [projetoId])

  return { status, mensagemErro, notificarAlteracao, salvarAgora: salvar }
}
