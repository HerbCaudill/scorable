import { useMemo } from "react"
import { useDocuments } from "@automerge/automerge-repo-react-hooks"
import { useLocalStore } from "@/lib/localStore"
import type { GameDoc } from "@/lib/automergeTypes"
import { getPlayerScoreFromDoc } from "@/lib/getPlayerScoreFromDoc"
import { BackButton } from "./BackButton"
import { cx } from "@/lib/cx"

type PlayerStats = {
  name: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  totalScore: number
  avgScore: number
  highScore: number
  lowScore: number
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
        scores: number[]
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

        const existing = playerStatsMap.get(playerName) || {
          gamesPlayed: 0,
          gamesWon: 0,
          scores: [],
        }

        playerStatsMap.set(playerName, {
          gamesPlayed: existing.gamesPlayed + 1,
          gamesWon: existing.gamesWon + (isWinner ? 1 : 0),
          scores: [...existing.scores, score],
        })
      }
    }

    // Convert to array with calculated stats
    const playerStats: PlayerStats[] = []
    for (const [name, data] of playerStatsMap) {
      const { gamesPlayed, gamesWon, scores } = data
      playerStats.push({
        name,
        gamesPlayed,
        gamesWon,
        winRate: gamesPlayed > 0 ? gamesWon / gamesPlayed : 0,
        totalScore: scores.reduce((a, b) => a + b, 0),
        avgScore: gamesPlayed > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / gamesPlayed) : 0,
        highScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowScore: scores.length > 0 ? Math.min(...scores) : 0,
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

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <BackButton onClick={onBack} />
          <h1 className="text-lg font-semibold">Statistics</h1>
        </div>

        {/* Summary */}
        <div className="mb-6 rounded-lg bg-neutral-100 p-4">
          <div className="text-center">
            <span className="text-3xl font-bold">{totalFinishedGames}</span>
            <p className="text-sm text-neutral-500">
              {totalFinishedGames === 1 ? "Game completed" : "Games completed"}
            </p>
          </div>
        </div>

        {/* Player stats */}
        {stats.length === 0 ?
          <div className="text-center text-neutral-500">
            <p>No finished games yet</p>
            <p className="text-sm">Complete some games to see player statistics</p>
          </div>
        : <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-neutral-500">Player rankings</h2>

            {stats.map((player, index) => (
              <div key={player.name} className="rounded-lg border p-4">
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

                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <div className="font-semibold">{player.gamesPlayed}</div>
                    <div className="text-xs text-neutral-500">Games</div>
                  </div>
                  <div>
                    <div className="font-semibold">{player.gamesWon}</div>
                    <div className="text-xs text-neutral-500">Wins</div>
                  </div>
                  <div>
                    <div className="font-semibold">{player.avgScore}</div>
                    <div className="text-xs text-neutral-500">Avg</div>
                  </div>
                  <div>
                    <div className="font-semibold">{player.highScore}</div>
                    <div className="text-xs text-neutral-500">Best</div>
                  </div>
                </div>

                {/* Score range bar */}
                {player.gamesPlayed > 1 && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-neutral-400">
                      <span>{player.lowScore}</span>
                      <span>{player.highScore}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full bg-teal-500"
                        style={{
                          width: `${((player.avgScore - player.lowScore) / (player.highScore - player.lowScore || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-center text-xs text-neutral-500">Score range</div>
                  </div>
                )}
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
