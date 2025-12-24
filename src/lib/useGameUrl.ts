import { useState, useEffect, useCallback } from 'react'
import type { AutomergeUrl } from '@automerge/automerge-repo'

/** Convert a string to an AutomergeUrl */
export const toAutomergeUrl = (input: string): AutomergeUrl | null => {
  const trimmed = input.trim()
  if (!trimmed) return null
  return trimmed as AutomergeUrl
}

const getUrlFromHash = (): AutomergeUrl | null => {
  const hash = window.location.hash.slice(1)
  return hash ? (hash as AutomergeUrl) : null
}

export const useGameUrl = (): [AutomergeUrl | null, (url: AutomergeUrl | null) => void] => {
  const [gameUrl, setGameUrlState] = useState<AutomergeUrl | null>(getUrlFromHash)

  useEffect(() => {
    const handleHashChange = () => {
      setGameUrlState(getUrlFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const setGameUrl = useCallback((url: AutomergeUrl | null) => {
    if (url) {
      window.location.hash = url
    } else {
      // Remove hash without triggering navigation
      history.pushState('', document.title, window.location.pathname + window.location.search)
    }
    setGameUrlState(url)
  }, [])

  return [gameUrl, setGameUrl]
}
