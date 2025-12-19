import { useState } from 'react'
import { useGameStore, getPlayerScore } from '@/lib/gameStore'
import ScrabbleBoard from './ScrabbleBoard'
import { Button } from '@/components/ui/button'
import { createEmptyBoard } from '@/lib/types'
import { getWordsFromMove } from '@/lib/getWordsFromMove'
import { calculateMoveScore } from '@/lib/calculateMoveScore'

export const PastGameScreen = ({ gameId, onBack }: Props) => {
  const { pastGames } = useGameStore()
  const game = pastGames.find(g => g.id === gameId)
  const [highlightedTiles, setHighlightedTiles] = useState<Array<{ row: number; col: number }>>([])

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-500">Game not found</p>
        <Button onClick={onBack}>Back to Home</Button>
      </div>
    )
  }

  const { players, board, moves } = game

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Get word history for a player
  const getPlayerMoveHistory = (playerIndex: number) => {
    let boardState = createEmptyBoard()
    const history: Array<{ words: string[]; score: number; tiles: Array<{ row: number; col: number }> }> = []

    for (const move of moves) {
      if (move.playerIndex === playerIndex) {
        const words = getWordsFromMove(move.tilesPlaced, boardState)
        const score = calculateMoveScore({ move: move.tilesPlaced, board: boardState })
        const tiles = move.tilesPlaced.map(({ row, col }) => ({ row, col }))
        history.push({ words, score, tiles })
      }
      for (const { row, col, tile } of move.tilesPlaced) {
        boardState[row][col] = tile
      }
    }

    return history.reverse()
  }

  const handleMoveClick = (tiles: Array<{ row: number; col: number }>) => {
    setHighlightedTiles(tiles)
    setTimeout(() => setHighlightedTiles([]), 1500)
  }

  // Calculate scores and determine winner
  const scores = players.map((_, index) => getPlayerScore(game, index))
  const maxScore = Math.max(...scores)

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <span className="text-sm text-gray-500">{formatDate(game.createdAt)}</span>
      </div>

      {/* Board - read-only */}
      <div className="flex flex-col items-center p-4 pb-2">
        <ScrabbleBoard tiles={board} highlightedTiles={highlightedTiles} />
      </div>

      {/* Final scores */}
      <div className="flex gap-2 px-4 pt-0">
        {players.map((player, index) => {
          const score = scores[index]
          const isWinner = score === maxScore

          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center rounded-lg p-3"
              style={{
                backgroundColor: isWinner ? `${player.color}20` : 'transparent',
                borderWidth: 2,
                borderColor: isWinner ? player.color : 'transparent',
              }}
            >
              <span className="text-sm font-medium">{player.name}</span>
              <span className="text-2xl font-bold">{score}</span>
              {isWinner && <span className="text-amber-500">★ Winner</span>}
            </div>
          )
        })}
      </div>

      {/* Game history */}
      {moves.length > 0 && (
        <div className="flex gap-2 overflow-y-auto px-4">
          {players.map((_, index) => {
            const moveHistory = getPlayerMoveHistory(index)
            return (
              <div key={index} className="flex flex-1 flex-col divide-y divide-neutral-200 p-2 text-xs">
                {moveHistory.map((entry, i) => (
                  <div
                    key={i}
                    className="flex cursor-pointer justify-between gap-2 py-1 text-neutral-600 hover:bg-neutral-100"
                    onClick={() => handleMoveClick(entry.tiles)}
                  >
                    <span className="truncate">{entry.words.join(', ') || '(pass)'}</span>
                    <span className="font-medium">{entry.score}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type Props = {
  gameId: string
  onBack: () => void
}
