import { useEffect, useRef } from 'react'

/**
 * Chama `aoAbrir` uma única vez por montagem, e só se a página ainda não está concluída. A ref de guarda evita
 * chamada duplicada (re-render ou efeito repetido do StrictMode) enquanto a página está aberta.
 */
export function useAoAbrir(concluida: boolean, aoAbrir: () => void) {
  const chamado = useRef(false)
  const aoAbrirRef = useRef(aoAbrir)
  useEffect(() => {
    aoAbrirRef.current = aoAbrir
  })
  useEffect(() => {
    if (concluida || chamado.current) return
    chamado.current = true
    aoAbrirRef.current()
  }, [concluida])
}
