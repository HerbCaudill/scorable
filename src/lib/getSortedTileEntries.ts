/** Get tiles sorted alphabetically with blanks at the end */

export const getSortedTileEntries = (tiles: Record<string, number>): Array<[string, number]> => {
  return Object.entries(tiles).sort(([a], [b]) => {
    // Blanks go last
    if (a === " ") return 1
    if (b === " ") return -1
    return a.localeCompare(b)
  })
}
