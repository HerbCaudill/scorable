import { useState, useCallback, useRef } from "react"

type TilePosition = { row: number; col: number }

export const useHighlightedTiles = (duration = 1500) => {
  const [highlightedTiles, setHighlightedTiles] = useState<TilePosition[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const highlightTiles = useCallback(
    (tiles: TilePosition[]) => {
      // Clear any existing timeout to prevent stale clears
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }

      setHighlightedTiles(tiles)
      timeoutRef.current = setTimeout(() => {
        setHighlightedTiles([])
        timeoutRef.current = null
      }, duration)
    },
    [duration],
  )

  return { highlightedTiles, highlightTiles }
}
