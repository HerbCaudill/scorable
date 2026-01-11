/**
 * Check if a tile represents a blank tile.
 * Blank tiles are stored as:
 * - " " (space) for unassigned blanks
 * - lowercase letters (a-z) for blanks representing that letter
 */
export const isBlankTile = (tile: string | null): boolean => {
  if (!tile) return false
  if (tile === " ") return true
  // Lowercase letters represent blank tiles that have been assigned a letter
  return tile.length === 1 && tile >= "a" && tile <= "z"
}

/**
 * Get the letter a blank tile represents.
 * Returns the uppercase letter for assigned blanks, or null for unassigned/non-blank tiles.
 */
export const getBlankTileLetter = (tile: string | null): string | null => {
  if (!tile) return null
  if (tile === " ") return null // Unassigned blank
  if (tile.length === 1 && tile >= "a" && tile <= "z") {
    return tile.toUpperCase()
  }
  return null // Not a blank tile
}

/**
 * Get the display letter for a tile.
 * For regular tiles, returns the letter.
 * For blank tiles, returns the assigned letter (or empty for unassigned).
 */
export const getTileDisplayLetter = (tile: string | null): string => {
  if (!tile) return ""
  if (tile === " ") return "" // Unassigned blank shows nothing
  // Lowercase = blank with assigned letter, return uppercase
  if (tile.length === 1 && tile >= "a" && tile <= "z") {
    return tile.toUpperCase()
  }
  return tile.toUpperCase()
}
