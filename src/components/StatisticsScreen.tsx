import { useMemo } from "react"
import { useDocuments } from "@automerge/automerge-repo-react-hooks"
import { useLocalStore } from "@/lib/localStore"
import type { GameDoc } from "@/lib/automergeTypes"
import { getPlayerScoreFromDoc } from "@/lib/getPlayerScoreFromDoc"
import { getMoveDataFromDoc, type MoveData } from "@/lib/getMoveDataFromDoc"
import { getGameDataFromDoc, type GameData } from "@/lib/getGameDataFromDoc"
import { Header } from "./Header"
import { DotPlot } from "./DotPlot"
import { Histogram } from "./Histogram"

const MIN_GAMES_FOR_STATS = 3
const MAX_GAME_SCORE = 500 // Filter out games with scores above this to keep data relatable
const MAX_MOVE_SCORE = 100 // Filter out moves with scores above this to keep data relatable

/** Round up to a nice round number for axis labels (e.g., 10, 20, 50, 100, 200, 500) */
const roundUpToNice = (value: number): number => {
  if (value <= 0) return 10
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  // Choose nice multipliers: 1, 2, 5, 10
  if (normalized <= 1) return magnitude
  if (normalized <= 2) return 2 * magnitude
  if (normalized <= 5) return 5 * magnitude
  return 10 * magnitude
}

type PlayerStats = {
  name: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  totalScore: number
  avgScore: number
  highScore: number
  lowScore: number
  gameData: GameData[]
  moveData: MoveData[]
  avgMoveScore: number
  maxMoveScore: number
  bestMoveLabel: string
}

export const StatisticsScreen = ({ onBack }: Props) => {
  const { knownGameIds } = useLocalStore()

  // Load all known game documents
  const [docs] = useDocuments<GameDoc>(knownGameIds as any)

  // Calculate statistics from finished games
  const stats = useMemo(() => {
    const playerStatsMap = new Map<
      string,
      {
        gamesPlayed: number
        gamesWon: number
        gameData: GameData[]
        moveData: MoveData[]
      }
    >()

    // Process only finished games
    for (const id of knownGameIds) {
      const doc = docs.get(id as any)
      if (!doc || doc.status !== "finished") continue

      // Calculate scores for all players in this game
      const scores = doc.players.map((_, i) => getPlayerScoreFromDoc(doc, i))
      const maxScore = Math.max(...scores)

      // Update stats for each player
      for (let i = 0; i < doc.players.length; i++) {
        const playerName = doc.players[i].name
        const score = scores[i]
        const isWinner = score === maxScore
        const playerMoveData = getMoveDataFromDoc(doc, i)
        const playerGameData = getGameDataFromDoc(doc, i)

        const existing = playerStatsMap.get(playerName) || {
          gamesPlayed: 0,
          gamesWon: 0,
          gameData: [],
          moveData: [],
        }

        playerStatsMap.set(playerName, {
          gamesPlayed: existing.gamesPlayed + 1,
          gamesWon: existing.gamesWon + (isWinner ? 1 : 0),
          gameData: [...existing.gameData, playerGameData],
          moveData: [...existing.moveData, ...playerMoveData],
        })
      }
    }

    // Convert to array with calculated stats
    // Only include players with more than 2 games
    const playerStats: PlayerStats[] = []
    for (const [name, data] of playerStatsMap) {
      const { gamesPlayed, gamesWon, gameData, moveData } = data
      if (gamesPlayed < MIN_GAMES_FOR_STATS) continue

      // Filter out outlier games and moves to keep data relatable
      const filteredGameData = gameData.filter(g => g.value <= MAX_GAME_SCORE)
      const filteredMoveData = moveData.filter(m => m.value <= MAX_MOVE_SCORE)

      const gameScores = filteredGameData.map(g => g.value)
      const moveScores = filteredMoveData.map(m => m.value)
      const maxMoveScore = moveScores.length > 0 ? Math.max(...moveScores) : 0

      // Find all moves with the max score and extract their word labels
      const bestMoves = filteredMoveData.filter(m => m.value === maxMoveScore)
      // Extract word from label (format: "WORD for X" or "X pts")
      const bestMoveWords = bestMoves
        .map(m => {
          const match = m.label.match(/^(.+) for \d+$/)
          return match ? match[1] : ""
        })
        .filter(Boolean)
      // Join unique words (in case same high score achieved multiple times with different words)
      const bestMoveLabel = [...new Set(bestMoveWords)].join(", ")

      playerStats.push({
        name,
        gamesPlayed,
        gamesWon,
        winRate: gamesPlayed > 0 ? gamesWon / gamesPlayed : 0,
        totalScore: gameScores.reduce((a, b) => a + b, 0),
        avgScore:
          gameScores.length > 0 ?
            Math.round(gameScores.reduce((a, b) => a + b, 0) / gameScores.length)
          : 0,
        highScore: gameScores.length > 0 ? Math.max(...gameScores) : 0,
        lowScore: gameScores.length > 0 ? Math.min(...gameScores) : 0,
        gameData: filteredGameData,
        moveData: filteredMoveData,
        avgMoveScore:
          moveScores.length > 0 ?
            Math.round(moveScores.reduce((a, b) => a + b, 0) / moveScores.length)
          : 0,
        maxMoveScore,
        bestMoveLabel,
      })
    }

    // Sort by win rate, then by games played
    playerStats.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate
      return b.gamesPlayed - a.gamesPlayed
    })

    return playerStats
  }, [knownGameIds, docs])

  const totalFinishedGames = useMemo(() => {
    let count = 0
    for (const id of knownGameIds) {
      const doc = docs.get(id as any)
      if (doc?.status === "finished") count++
    }
    return count
  }, [knownGameIds, docs])

  // Calculate shared ranges for dot plots across all players
  // Axes start at zero and go up to a round number
  const plotRanges = useMemo(() => {
    const allMoveScores = stats.flatMap(p => p.moveData.map(m => m.value))
    const allGameScores = stats.flatMap(p => p.gameData.map(g => g.value))

    const moveMax = allMoveScores.length > 0 ? Math.max(...allMoveScores) : 0
    const gameMax = allGameScores.length > 0 ? Math.max(...allGameScores) : 0

    return {
      moveScores: {
        min: 0,
        max: roundUpToNice(moveMax),
      },
      gameScores: {
        min: 0,
        max: roundUpToNice(gameMax),
      },
    }
  }, [stats])

  return (
    <div className="scrollbar-none flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-md px-4 pb-6">
        <Header title="Statistics" onBack={onBack} />

        {/* Player stats */}
        {stats.length === 0 ?
          <div className="text-center text-neutral-500">
            <p>No player statistics yet</p>
            <p className="text-sm">
              Complete at least {MIN_GAMES_FOR_STATS} games to see player statistics
            </p>
            <p className="mt-4 text-xs text-neutral-400">
              {totalFinishedGames} {totalFinishedGames === 1 ? "game" : "games"} completed
            </p>
          </div>
        : <div className="flex flex-col gap-6">
            {stats.map(player => (
              <div
                key={player.name}
                className="rounded-lg bg-white px-4 py-6 shadow-[0_3px_0_0_rgba(0,0,0,0.1)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold">{player.name}</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">
                      {Math.round(player.winRate * 100)}%
                    </span>
                    <span className="ml-1 text-sm text-neutral-500">win rate</span>
                  </div>
                </div>

                {/* Move Scores section */}
                <div className="mb-6">
                  <div className="mb-2 text-xs font-bold text-neutral-500">Move scores</div>
                  <Histogram
                    data={player.moveData.map(m => m.value)}
                    color="teal"
                    minValue={plotRanges.moveScores.min}
                    maxValue={plotRanges.moveScores.max}
                    showTooltip={false}
                    referenceLines={[
                      {
                        value: player.avgMoveScore,
                        label: "avg:",
                        labelValue: player.avgMoveScore,
                        type: "avg",
                      },
                      {
                        value: player.maxMoveScore,
                        label: "best:",
                        labelValue:
                          player.bestMoveLabel ?
                            `${player.bestMoveLabel} (${player.maxMoveScore})`
                          : player.maxMoveScore,
                        type: "best",
                      },
                    ]}
                  />
                </div>

                {/* Game Scores section */}
                <div>
                  <div className="mb-2 text-xs font-bold text-neutral-500">Game scores</div>
                  <DotPlot
                    data={player.gameData}
                    color="amber"
                    minValue={plotRanges.gameScores.min}
                    maxValue={plotRanges.gameScores.max}
                    getTooltip={d => d.label ?? String(d.value)}
                    referenceLines={[
                      {
                        value: player.avgScore,
                        label: "avg:",
                        labelValue: player.avgScore,
                        type: "avg",
                      },
                      {
                        value: player.highScore,
                        label: "best:",
                        labelValue: player.highScore,
                        type: "best",
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  )
}

type Props = {
  onBack: () => void
}
