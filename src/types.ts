export type Side = Set<string> // each side has three letters; the order doesn't matter

export type Layout = Side[] // each layout has 4 sides; the order doesn't matter but we use an array for convenience

export type AdjacencyMap = {
  [letter: string]: Set<string>
}

export type Puzzle = {
  solution: string
  layout: Layout
}

export type State = {
  layout: Layout
  words: string[]
  currentWord: string
  message?: Message
  history: string[][] // each entry is a list of words that have been found
}

export type Message =
  | { type: 'FOUND_WORD'; word: string }
  | { type: 'FOUND_SOLUTION'; words: string[] }
  | { type: 'ERROR'; details: string }
