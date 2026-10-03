import type { DocumentId } from "@automerge/automerge-repo"
import { HomeScreen } from "./components/HomeScreen"
import { PlayerSetupScreen } from "./components/PlayerSetupScreen"
import { GameScreen } from "./components/GameScreen"
import { PastGameScreen } from "./components/PastGameScreen"
import { UnplayedTilesScreen } from "./components/TileBagScreen"
import { StatisticsScreen } from "./components/StatisticsScreen"
import { useRoute } from "./lib/useRoute"
import { useGame } from "./lib/useGame"
import { Toaster } from "@/components/ui/sonner"
import { UpdateNotice } from "./components/UpdateNotice"
import { repo } from "./lib/repo"

function App() {
  const [route, setRoute] = useRoute()

  const handleResumeGame = (id: DocumentId) => {
    setRoute({ screen: "game", gameId: id })
  }

  const handleViewPastGame = (id: DocumentId) => {
    setRoute({ screen: "view-past-game", gameId: id })
  }

  const handleGameCreated = (id: DocumentId) => {
    setRoute({ screen: "game", gameId: id })
  }

  const handleGoHome = () => {
    setRoute({ screen: "home" })
  }

  return (
    <div className="bg-khaki-100 h-full">
      <div className="h-full">
        {route.screen === "home" && (
          <HomeScreen
            onNewGame={() => setRoute({ screen: "new-game" })}
            onResumeGame={handleResumeGame}
            onViewPastGame={handleViewPastGame}
            onViewStatistics={() => setRoute({ screen: "statistics" })}
          />
        )}
        {route.screen === "new-game" && (
          <PlayerSetupScreen onGameCreated={handleGameCreated} onBack={handleGoHome} />
        )}
        {route.screen === "game" && (
          <GameScreen
            gameId={route.gameId}
            onEndGame={handleGoHome}
            onShowTiles={() => setRoute({ screen: "tiles", gameId: route.gameId })}
          />
        )}
        {route.screen === "view-past-game" && (
          <PastGameScreen gameId={route.gameId} onBack={handleGoHome} />
        )}
        {route.screen === "tiles" && (
          <TilesScreenWrapper
            gameId={route.gameId}
            onBack={() => setRoute({ screen: "game", gameId: route.gameId })}
          />
        )}
        {route.screen === "statistics" && (
          <StatisticsScreen
            onBack={handleGoHome}
            onViewPastGame={id => setRoute({ screen: "view-past-game", gameId: id as DocumentId })}
          />
        )}
      </div>
      <Toaster />
      <UpdateNotice beforeReload={flushGameChanges} />
    </div>
  )
}

/** Wrapper to load game for tiles screen */
const TilesScreenWrapper = ({ gameId, onBack }: { gameId: DocumentId; onBack: () => void }) => {
  const { game, isLoading } = useGame(gameId)

  if (isLoading || !game) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>
  }

  return <UnplayedTilesScreen game={game} onBack={onBack} />
}

export default App

/** Finish IndexedDB writes before applying an app update. */
const flushGameChanges = () => repo.flush()
