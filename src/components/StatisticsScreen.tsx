import { useMemo } from "react"
import { useDocuments } from "@automerge/automerge-repo-react-hooks"
import { useLocalStore } from "@/lib/localStore"
import type { GameDoc } from "@/lib/automergeTypes"
import { getPlayerScoreFromDoc } from "@/lib/getPlayerScoreFromDoc"
import { getMoveScoresFromDoc } from "@/lib/getMoveScoresFromDoc"
import { Header } from "./Header"
import { cx } from "@/lib/cx"
import { Histogram } from "./Histogram"

const MIN_GAMES_FOR_STATS = 3

type PlayerStats = {
  name: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  totalScore: number
  avgScore: number
  highScore: number
  lowScore: number
  gameScores: number[]
  moveScores: number[]
  avgMoveScore: number
  maxMoveScore: number
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
        gameScores: number[]
        moveScores: number[]
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
        const playerMoveScores = getMoveScoresFromDoc(doc, i)

        const existing = playerStatsMap.get(playerName) || {
          gamesPlayed: 0,
          gamesWon: 0,
          gameScores: [],
          moveScores: [],
        }

        playerStatsMap.set(playerName, {
          gamesPlayed: existing.gamesPlayed + 1,
          gamesWon: existing.gamesWon + (isWinner ? 1 : 0),
          gameScores: [...existing.gameScores, score],
          moveScores: [...existing.moveScores, ...playerMoveScores],
        })
      }
    }

    // Convert to array with calculated stats
    // Only include players with more than 2 games
    const playerStats: PlayerStats[] = []
    for (const [name, data] of playerStatsMap) {
      const { gamesPlayed, gamesWon, gameScores, moveScores } = data
      if (gamesPlayed < MIN_GAMES_FOR_STATS) continue

      playerStats.push({
        name,
        gamesPlayed,
        gamesWon,
        winRate: gamesPlayed > 0 ? gamesWon / gamesPlayed : 0,
        totalScore: gameScores.reduce((a, b) => a + b, 0),
        avgScore:
          gamesPlayed > 0 ? Math.round(gameScores.reduce((a, b) => a + b, 0) / gamesPlayed) : 0,
        highScore: gameScores.length > 0 ? Math.max(...gameScores) : 0,
        lowScore: gameScores.length > 0 ? Math.min(...gameScores) : 0,
        gameScores,
        moveScores,
        avgMoveScore:
          moveScores.length > 0 ?
            Math.round(moveScores.reduce((a, b) => a + b, 0) / moveScores.length)
          : 0,
        maxMoveScore: moveScores.length > 0 ? Math.max(...moveScores) : 0,
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

  // Calculate shared ranges for histograms across all players
  const histogramRanges = useMemo(() => {
    const allMoveScores = stats.flatMap(p => p.moveScores)
    const allGameScores = stats.flatMap(p => p.gameScores)

    return {
      moveScores: {
        min: allMoveScores.length > 0 ? Math.min(...allMoveScores) : 0,
        max: allMoveScores.length > 0 ? Math.max(...allMoveScores) : 0,
      },
      gameScores: {
        min: allGameScores.length > 0 ? Math.min(...allGameScores) : 0,
        max: allGameScores.length > 0 ? Math.max(...allGameScores) : 0,
      },
    }
  }, [stats])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-md px-4">
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
        : <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-500">Player rankings</h2>
              <span className="text-xs text-neutral-400">
                {totalFinishedGames} {totalFinishedGames === 1 ? "game" : "games"}
              </span>
            </div>

            {stats.map((player, index) => (
              <div
                key={player.name}
                className="rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cx(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        index === 0 && "bg-amber-100 text-amber-700",
                        index === 1 && "bg-neutral-200 text-neutral-600",
                        index === 2 && "bg-orange-100 text-orange-700",
                        index > 2 && "bg-neutral-100 text-neutral-500",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="font-semibold">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">
                      {Math.round(player.winRate * 100)}%
                    </span>
                    <span className="ml-1 text-sm text-neutral-500">win rate</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="font-semibold">{player.gamesPlayed}</div>
                    <div className="text-xs text-neutral-500">Games</div>
                  </div>
                  <div>
                    <div className="font-semibold">{player.gamesWon}</div>
                    <div className="text-xs text-neutral-500">Wins</div>
                  </div>
                  <div>
                    <div className="font-semibold">{player.highScore}</div>
                    <div className="text-xs text-neutral-500">Best game</div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <div className="font-semibold">{player.avgScore}</div>
                    <div className="text-xs text-neutral-500">Avg game</div>
                  </div>
                  <div>
                    <div className="font-semibold">{player.avgMoveScore}</div>
                    <div className="text-xs text-neutral-500">Avg move</div>
                  </div>
                  <div>
                    <div className="font-semibold">{player.maxMoveScore}</div>
                    <div className="text-xs text-neutral-500">Best move</div>
                  </div>
                  <div>
                    <div className="font-semibold">{player.moveScores.length}</div>
                    <div className="text-xs text-neutral-500">Moves</div>
                  </div>
                </div>

                {/* Score distribution histograms */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Histogram
                    data={player.moveScores}
                    label="Move scores"
                    color="teal"
                    minValue={histogramRanges.moveScores.min}
                    maxValue={histogramRanges.moveScores.max}
                  />
                  <Histogram
                    data={player.gameScores}
                    label="Game scores"
                    color="amber"
                    minValue={histogramRanges.gameScores.min}
                    maxValue={histogramRanges.gameScores.max}
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
