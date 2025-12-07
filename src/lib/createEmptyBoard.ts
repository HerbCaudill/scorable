import type { BoardState } from './boardLayout'

export const createEmptyBoard = (): BoardState =>
  Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
