export type SquareType = 'TW' | 'DW' | 'TL' | 'DL' | 'ST' | null

// prettier-ignore
export const BOARD_LAYOUT: SquareType[][] = [
  ['TW', null, null, 'DL', null, null, null, 'TW', null, null, null, 'DL', null, null, 'TW'],
  [null, 'DW', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'DW', null],
  [null, null, 'DW', null, null, null, 'DL', null, 'DL', null, null, null, 'DW', null, null],
  ['DL', null, null, 'DW', null, null, null, 'DL', null, null, null, 'DW', null, null, 'DL'],
  [null, null, null, null, 'DW', null, null, null, null, null, 'DW', null, null, null, null],
  [null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null],
  [null, null, 'DL', null, null, null, 'DL', null, 'DL', null, null, null, 'DL', null, null],
  ['TW', null, null, 'DL', null, null, null, 'ST', null, null, null, 'DL', null, null, 'TW'],
  [null, null, 'DL', null, null, null, 'DL', null, 'DL', null, null, null, 'DL', null, null],
  [null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null],
  [null, null, null, null, 'DW', null, null, null, null, null, 'DW', null, null, null, null],
  ['DL', null, null, 'DW', null, null, null, 'DL', null, null, null, 'DW', null, null, 'DL'],
  [null, null, 'DW', null, null, null, 'DL', null, 'DL', null, null, null, 'DW', null, null],
  [null, 'DW', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'DW', null],
  ['TW', null, null, 'DL', null, null, null, 'TW', null, null, null, 'DL', null, null, 'TW'],
]

export const getSquareType = (row: number, col: number): SquareType => {
  return BOARD_LAYOUT[row][col]
}
