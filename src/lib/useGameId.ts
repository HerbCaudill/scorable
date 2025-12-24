import { useState, useEffect, useCallback } from 'react'
import type { DocumentId } from '@automerge/automerge-repo'

/** Convert a string to a DocumentId */
export const toDocumentId = (input: string): DocumentId | null => {
  const trimmed = input.trim()
  if (!trimmed) return null
  return trimmed as DocumentId
}

const getIdFromHash = (): DocumentId | null => {
  const hash = window.location.hash.slice(1)
  return hash ? (hash as DocumentId) : null
}

export const useGameId = (): [DocumentId | null, (id: DocumentId | null) => void] => {
  const [gameId, setGameIdState] = useState<DocumentId | null>(getIdFromHash)

  useEffect(() => {
    const handleHashChange = () => {
      setGameIdState(getIdFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const setGameId = useCallback((id: DocumentId | null) => {
    if (id) {
      window.location.hash = id
    } else {
      // Remove hash without triggering navigation
      history.pushState('', document.title, window.location.pathname + window.location.search)
    }
    setGameIdState(id)
  }, [])

  return [gameId, setGameId]
}
