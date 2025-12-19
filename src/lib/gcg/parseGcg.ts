export type GcgPosition = {
  row: number
  col: number
  direction: 'horizontal' | 'vertical'
}

export type GcgPlayMove = {
  player: string
  rack: string
  type: 'play'
  position: GcgPosition
  word: string
  score: number
  cumulative: number
}

export type GcgExchangeMove = {
  player: string
  rack: string
  type: 'exchange'
  score: number
  cumulative: number
}

export type GcgChallengeMove = {
  player: string
  rack: string
  type: 'challenge'
  score: number
  cumulative: number
}

export type GcgEndMove = {
  player: string
  type: 'end'
  tiles: string
  score: number
  cumulative: number
}

export type GcgMove = GcgPlayMove | GcgExchangeMove | GcgChallengeMove | GcgEndMove

export type GcgPlayer = {
  nickname: string
  name: string
}

export type GcgGame = {
  player1: GcgPlayer
  player2: GcgPlayer
  title?: string
  description?: string
  moves: GcgMove[]
}

/** Parse a GCG position string like "H4" or "9A" into row, col, and direction
 *
 * GCG notation:
 * - Letter first (H4) = VERTICAL play at column H, starting at row 4
 * - Number first (9A) = HORIZONTAL play at row 9, starting at column A
 */
export const parsePosition = (pos: string): GcgPosition => {
  // Check if it starts with a letter (vertical) or number (horizontal)
  const letterFirst = /^([A-O])(\d+)$/i.exec(pos)
  const numberFirst = /^(\d+)([A-O])$/i.exec(pos)

  if (letterFirst) {
    // Format: H4 (vertical) - letter is COLUMN, number is starting ROW
    const col = letterFirst[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
    const row = parseInt(letterFirst[2], 10) - 1
    return { row, col, direction: 'vertical' }
  }

  if (numberFirst) {
    // Format: 9A (horizontal) - number is ROW, letter is starting COLUMN
    const row = parseInt(numberFirst[1], 10) - 1
    const col = numberFirst[2].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
    return { row, col, direction: 'horizontal' }
  }

  throw new Error(`Invalid position: ${pos}`)
}

/** Parse a GCG file content into a structured game object */
export const parseGcg = (content: string): GcgGame => {
  const lines = content.split(/\r?\n/)

  const game: GcgGame = {
    player1: { nickname: '', name: '' },
    player2: { nickname: '', name: '' },
    moves: [],
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Parse pragmas
    if (trimmed.startsWith('#player1 ')) {
      const parts = trimmed.slice('#player1 '.length).split(' ')
      game.player1 = {
        nickname: parts[0],
        name: parts.slice(1).join(' '),
      }
      continue
    }

    if (trimmed.startsWith('#player2 ')) {
      const parts = trimmed.slice('#player2 '.length).split(' ')
      game.player2 = {
        nickname: parts[0],
        name: parts.slice(1).join(' '),
      }
      continue
    }

    if (trimmed.startsWith('#title ')) {
      game.title = trimmed.slice('#title '.length)
      continue
    }

    if (trimmed.startsWith('#description ')) {
      game.description = trimmed.slice('#description '.length)
      continue
    }

    // Skip other pragmas (notes, etc.)
    if (trimmed.startsWith('#')) continue

    // Parse move lines
    // Standard move: >Player: RACK POSITION WORD +SCORE CUMULATIVE
    // Exchange: >Player: RACK - +0 CUMULATIVE
    // Challenge withdrawal: >Player: RACK -- -SCORE CUMULATIVE
    // End game: >Player" (TILES) +SCORE CUMULATIVE

    // End-game scoring (note the " instead of :)
    const endGameMatch = /^>(\w+)" \(([A-Z]+)\) ([+-]\d+) (\d+)$/.exec(trimmed)
    if (endGameMatch) {
      game.moves.push({
        player: endGameMatch[1],
        type: 'end',
        tiles: endGameMatch[2],
        score: parseInt(endGameMatch[3], 10),
        cumulative: parseInt(endGameMatch[4], 10),
      })
      continue
    }

    // Regular move line
    const moveMatch = /^>(\w+): (\S+) (.+) ([+-]\d+) (\d+)$/.exec(trimmed)
    if (moveMatch) {
      const player = moveMatch[1]
      const rack = moveMatch[2]
      const action = moveMatch[3]
      const score = parseInt(moveMatch[4], 10)
      const cumulative = parseInt(moveMatch[5], 10)

      // Challenge withdrawal (double dash)
      if (action === '--') {
        game.moves.push({
          player,
          rack,
          type: 'challenge',
          score,
          cumulative,
        })
        continue
      }

      // Exchange (single dash, possibly with tiles)
      if (action === '-' || action.startsWith('-')) {
        game.moves.push({
          player,
          rack,
          type: 'exchange',
          score,
          cumulative,
        })
        continue
      }

      // Regular play - action is "POSITION WORD"
      const playParts = action.split(' ')
      if (playParts.length === 2) {
        const position = parsePosition(playParts[0])
        const word = playParts[1]
        game.moves.push({
          player,
          rack,
          type: 'play',
          position,
          word,
          score,
          cumulative,
        })
      }
    }
  }

  return game
}
