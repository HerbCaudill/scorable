import { useState, useCallback } from 'react'

type TilePosition = { row: number; col: number }

export const useHighlightedTiles = (duration = 1500) => {
  const [highlightedTiles, setHighlightedTiles] = useState<TilePosition[]>([])

  const highlightTiles = useCallback(
    (tiles: TilePosition[]) => {
      setHighlightedTiles(tiles)
      setTimeout(() => setHighlightedTiles([]), duration)
    },
    [duration]
  )

  return { highlightedTiles, highlightTiles }
}
