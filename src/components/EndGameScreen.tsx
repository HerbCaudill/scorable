import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RackTileInput } from "./RackTileInput"
import { getRemainingTiles } from "@/lib/getRemainingTiles"
import { validateRackTiles } from "@/lib/validateRackTiles"
import { calculateEndGameAdjustments } from "@/lib/calculateEndGameAdjustments"
import { cx } from "@/lib/cx"
import { Header } from "./Header"
import type { Game, Adjustment } from "@/lib/types"

export const EndGameScreen = ({ game, onBack, onApply }: Props) => {
  const { players } = game

  // Memoize remaining tiles to prevent unnecessary re-renders
  const remainingTiles = useMemo(() => getRemainingTiles(game), [game])

  // Convert to sorted list for consistent ordering
  const remainingTilesList = useMemo(
    () =>
      Object.entries(remainingTiles)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([tile, count]) => Array(count).fill(tile)),
    [remainingTiles],
  )

  // Default: last player to make a move ended the game
  const lastMovePlayerIndex = game.moves.length ? game.moves[game.moves.length - 1].playerIndex : 0

  const [playerWhoEndedGame, setPlayerWhoEndedGame] = useState<number | null>(lastMovePlayerIndex)

  // Initialize racks
  // - Player who ended the game has empty rack
  // - For 2-player games, auto-populate the other player's rack with remaining tiles
  const [playerRacks, setPlayerRacks] = useState<string[][]>(() => {
    const isTwoPlayerGame = game.players.length === 2
    const initialRemainingTiles = getRemainingTiles(game)
    const initialTilesList = Object.entries(initialRemainingTiles)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([tile, count]) => Array(count).fill(tile))

    return game.players.map((_, i) => {
      if (i === lastMovePlayerIndex) {
        return [] // Player who ended has empty rack
      }
      if (isTwoPlayerGame) {
        return initialTilesList // Other player gets all remaining tiles
      }
      return [] // Empty for 3+ player games
    })
  })

  // When playerWhoEndedGame changes:
  // - Clear the rack of the player who ended the game
  // - For 2-player games, auto-populate the other player's rack with remaining tiles
  useEffect(() => {
    if (playerWhoEndedGame !== null) {
      const isTwoPlayerGame = players.length === 2

      setPlayerRacks(prev =>
        prev.map((rack, i) => {
          if (i === playerWhoEndedGame) {
            return [] // Player who ended has empty rack
          }
          if (isTwoPlayerGame) {
            return remainingTilesList // Other player gets all remaining tiles
          }
          return rack // Keep existing rack for 3+ player games
        }),
      )
    }
    // Only re-run when playerWhoEndedGame changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerWhoEndedGame])

  // Validate racks
  const validation = useMemo(
    () => validateRackTiles(playerRacks, remainingTiles),
    [playerRacks, remainingTiles],
  )

  // Calculate adjustments
  const adjustments = useMemo(() => {
    const racks = playerRacks.map((tiles, playerIndex) => ({ playerIndex, tiles }))
    return calculateEndGameAdjustments(racks, playerWhoEndedGame)
  }, [playerRacks, playerWhoEndedGame])

  // Get error message for a specific tile
  const getErrorForPlayer = (playerIndex: number): string | undefined => {
    // Find tiles in this player's rack that are over limit
    const playerTiles = playerRacks[playerIndex]
    for (const error of validation.errors) {
      if (playerTiles.some(t => t.toUpperCase() === error.tile)) {
        return `Too many ${error.tile === " " ? "blank" : error.tile} tiles (${error.entered} entered, ${error.available} available)`
      }
    }
    return undefined
  }

  const handleRackChange = (playerIndex: number, tiles: string[]) => {
    setPlayerRacks(prev => {
      const updated = [...prev]
      updated[playerIndex] = tiles
      return updated
    })
  }

  const handleApply = () => {
    const adjustmentsWithRacks = adjustments.map((adj, i) => ({
      ...adj,
      rackTiles: playerRacks[i],
    }))
    onApply(adjustmentsWithRacks)
  }

  return (
    <div className="flex h-screen flex-col">
      <Header title="End game" onBack={onBack} />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Who ended the game selection */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-neutral-600">Who ended the game?</h2>
          <div className="flex flex-wrap gap-2">
            {players.map((player, index) => (
              <button
                key={index}
                onClick={() => setPlayerWhoEndedGame(index)}
                className={cx(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  playerWhoEndedGame === index ? "text-white" : (
                    "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  ),
                )}
                style={{
                  backgroundColor: playerWhoEndedGame === index ? player.color : undefined,
                }}
              >
                {player.name}
              </button>
            ))}
            <button
              onClick={() => setPlayerWhoEndedGame(null)}
              className={cx(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                playerWhoEndedGame === null ?
                  "bg-neutral-800 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
              )}
            >
              Nobody (blocked)
            </button>
          </div>
        </div>

        {/* Per-player rack entry */}
        <div className="space-y-4">
          {players.map((player, index) => {
            const isPlayerWhoEnded = index === playerWhoEndedGame
            const adjustment = adjustments.find(a => a.playerIndex === index)
            const netAdjustment = adjustment?.net ?? 0

            return (
              <div key={index} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: player.color }} />
                  <span className="font-medium">{player.name}</span>
                  {isPlayerWhoEnded && (
                    <span className="text-sm text-neutral-500">(ended the game)</span>
                  )}
                </div>

                <RackTileInput
                  tiles={playerRacks[index]}
                  onChange={tiles => handleRackChange(index, tiles)}
                  playerColor={player.color}
                  disabled={isPlayerWhoEnded}
                  error={getErrorForPlayer(index)}
                  deduction={netAdjustment}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t p-3">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleApply} disabled={!validation.valid}>
          Apply & end game
        </Button>
      </div>
    </div>
  )
}

type Props = {
  game: Game
  onBack: () => void
  onApply: (adjustments: Array<{ playerIndex: number } & Adjustment>) => void
}
