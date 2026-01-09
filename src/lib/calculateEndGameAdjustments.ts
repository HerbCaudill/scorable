import { tileValues } from "./tileValues"

export type RackEntry = {
  playerIndex: number
  tiles: string[]
}

export type Adjustment = {
  playerIndex: number
  deduction: number
  bonus: number
  net: number
}

/**
 * Calculate end-game score adjustments based on remaining rack tiles.
 *
 * Rules:
 * - Each player subtracts the value of their remaining tiles
 * - The player who ended the game gets a bonus equal to the sum of all other players' tiles
 * - If no one ended the game (blocked), everyone just subtracts their tiles with no bonus
 */
export const calculateEndGameAdjustments = (
  racks: RackEntry[],
  playerWhoEndedGame: number | null,
): Adjustment[] => {
  // Calculate tile value for each player's rack
  const rackValues = racks.map(({ tiles }) =>
    tiles.reduce((sum, tile) => sum + (tileValues[tile.toUpperCase()] ?? 0), 0),
  )

  // Total value of all racks (for bonus calculation)
  const totalRackValue = rackValues.reduce((sum, val) => sum + val, 0)

  return racks.map(({ playerIndex }, index) => {
    const deduction = -rackValues[index]
    const isPlayerWhoEnded = playerIndex === playerWhoEndedGame

    // Bonus = sum of OTHER players' rack values (only if this player ended the game)
    const bonus = isPlayerWhoEnded ? totalRackValue - rackValues[index] : 0

    return {
      playerIndex,
      deduction,
      bonus,
      net: deduction + bonus,
    }
  })
}
