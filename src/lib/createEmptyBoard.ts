import type { BoardState } from "./types"

export const createEmptyBoard = (): BoardState =>
  Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null))
