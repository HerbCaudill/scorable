import { useGameStore } from '@/lib/gameStore'
import { getRemainingTiles, getRemainingTileCount, getSortedTileEntries, TILE_DISTRIBUTION, TOTAL_TILES } from '@/lib/tileBag'
import { tileValues } from '@/lib/tileValues'
import { Button } from '@/components/ui/button'
import { IconArrowLeft } from '@tabler/icons-react'

type Props = {
  onBack: () => void
}

export const UnplayedTilesScreen = ({ onBack }: Props) => {
  const { currentGame } = useGameStore()

  if (!currentGame) return null

  const remainingTiles = getRemainingTiles(currentGame)
  const remainingCount = getRemainingTileCount(currentGame)
  const playedCount = TOTAL_TILES - remainingCount

  const sortedTiles = getSortedTileEntries(TILE_DISTRIBUTION)

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Unplayed Tiles</h1>
          <p className="text-sm text-neutral-500">
            {remainingCount} tiles remaining · {playedCount} played
          </p>
        </div>
      </div>

      {/* Tile grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-7 gap-2">
          {sortedTiles.map(([letter, total]) => {
            const remaining = remainingTiles[letter] || 0
            const played = total - remaining
            const isEmpty = remaining === 0

            return (
              <div
                key={letter}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-md border-2 ${
                  isEmpty ? 'border-neutral-200 bg-neutral-100 text-neutral-400' : 'border-amber-300 bg-amber-50'
                }`}
              >
                {/* Letter */}
                <span className={`text-xl font-bold ${isEmpty ? 'text-neutral-400' : 'text-neutral-800'}`}>
                  {letter === ' ' ? '?' : letter}
                </span>

                {/* Point value */}
                <span className={`absolute right-1 top-1 text-[10px] ${isEmpty ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {tileValues[letter]}
                </span>

                {/* Count remaining / total */}
                <span className={`text-xs ${isEmpty ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {remaining}/{total}
                </span>

                {/* Visual indicator of how many played */}
                {played > 0 && (
                  <div className="absolute bottom-1 left-1 flex gap-0.5">
                    {Array.from({ length: Math.min(played, 5) }).map((_, i) => (
                      <div key={i} className="size-1 rounded-full bg-neutral-400" />
                    ))}
                    {played > 5 && <span className="text-[8px] text-neutral-400">+{played - 5}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
