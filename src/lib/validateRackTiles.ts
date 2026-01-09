export type RackValidationError = {
  tile: string
  entered: number
  available: number
}

export type RackValidationResult = {
  valid: boolean
  errors: RackValidationError[]
}

/**
 * Validates that the entered rack tiles don't exceed remaining available tiles.
 * Counts tiles across all player racks to ensure total doesn't exceed what's left.
 */
export const validateRackTiles = (
  allRacks: string[][],
  remainingTiles: Record<string, number>,
): RackValidationResult => {
  // Count all tiles across all racks
  const totalCounts: Record<string, number> = {}

  for (const rack of allRacks) {
    for (const tile of rack) {
      const letter = tile.toUpperCase()
      totalCounts[letter] = (totalCounts[letter] || 0) + 1
    }
  }

  // Check each tile type against available
  const errors: RackValidationError[] = []

  for (const [letter, entered] of Object.entries(totalCounts)) {
    const available = remainingTiles[letter] ?? 0
    if (entered > available) {
      errors.push({
        tile: letter,
        entered,
        available,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
