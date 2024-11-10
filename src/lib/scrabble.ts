export type Letter = keyof typeof letterMap

export interface TileValue {
  letter: Letter
  id: number
  isFaceUp?: boolean
}

export type TileSet = TileValue[]

export const letterMap = {
  A: { points: 1, tiles: 9 },
  B: { points: 3, tiles: 2 },
  C: { points: 3, tiles: 2 },
  D: { points: 2, tiles: 4 },
  E: { points: 1, tiles: 12 },
  F: { points: 4, tiles: 2 },
  G: { points: 2, tiles: 3 },
  H: { points: 4, tiles: 2 },
  I: { points: 1, tiles: 9 },
  J: { points: 8, tiles: 1 },
  K: { points: 5, tiles: 1 },
  L: { points: 1, tiles: 4 },
  M: { points: 3, tiles: 2 },
  N: { points: 1, tiles: 6 },
  O: { points: 1, tiles: 8 },
  P: { points: 3, tiles: 2 },
  Q: { points: 10, tiles: 1 },
  R: { points: 1, tiles: 6 },
  S: { points: 1, tiles: 4 },
  T: { points: 1, tiles: 6 },
  U: { points: 1, tiles: 4 },
  V: { points: 4, tiles: 2 },
  W: { points: 4, tiles: 2 },
  X: { points: 8, tiles: 1 },
  Y: { points: 4, tiles: 2 },
  Z: { points: 10, tiles: 1 }
}

export const points = (letter: Letter) => {
  if (!letterMap[letter]) throw new Error('not a letter')
  return letterMap[letter].points
}

export const tiles = (letter: Letter) => {
  if (!letterMap[letter]) throw new Error('not a letter')
  return letterMap[letter].tiles
}

export const alphabet = Object.keys(letterMap) as Letter[]

export const initialLetters: Letter[] = alphabet.flatMap((letter) =>
  new Array(tiles(letter)).fill(letter)
)

export const wordScore = (word: string) =>
  word.split('').reduce((sum, letter) => sum + points(letter as Letter), 0)

const sum = (total: number, current: number) => total + current
