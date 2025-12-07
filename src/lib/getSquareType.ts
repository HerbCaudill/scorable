import { boardLayout } from './boardLayout'
import type { SquareType } from './types'

export const getSquareType = (row: number, col: number): SquareType => {
  return boardLayout[row][col]
}
