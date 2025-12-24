import { useState, useEffect } from 'react'
import type { AutomergeUrl } from '@automerge/automerge-repo'
import { HomeScreen } from './components/HomeScreen'
import { PlayerSetupScreen } from './components/PlayerSetupScreen'
import { GameScreen } from './components/GameScreen'
import { PastGameScreen } from './components/PastGameScreen'
import { useGameUrl } from './lib/useGameUrl'
import { useGame } from './lib/useGame'
import { Toaster } from '@/components/ui/sonner'

type Screen = 'home' | 'player-setup' | 'game' | 'view-past-game'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [viewingGameUrl, setViewingGameUrl] = useState<AutomergeUrl | null>(null)
  const [gameUrl, setGameUrl] = useGameUrl()
  const { game } = useGame(gameUrl)

  // If URL has game hash and game is loaded, navigate to game screen
  useEffect(() => {
    if (gameUrl && game && game.status !== 'finished') {
      setScreen('game')
    }
  }, [gameUrl, game])

  const handleResumeGame = (url: AutomergeUrl) => {
    setGameUrl(url)
    setScreen('game')
  }

  const handleViewPastGame = (url: AutomergeUrl) => {
    setViewingGameUrl(url)
    setScreen('view-past-game')
  }

  const handleGameCreated = (url: AutomergeUrl) => {
    setGameUrl(url)
    setScreen('game')
  }

  const handleEndGame = () => {
    setGameUrl(null)
    setScreen('home')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl">
        {screen === 'home' && (
          <HomeScreen
            onNewGame={() => setScreen('player-setup')}
            onResumeGame={handleResumeGame}
            onViewPastGame={handleViewPastGame}
          />
        )}
        {screen === 'player-setup' && (
          <PlayerSetupScreen onGameCreated={handleGameCreated} onBack={() => setScreen('home')} />
        )}
        {screen === 'game' && gameUrl && <GameScreen gameUrl={gameUrl} onEndGame={handleEndGame} />}
        {screen === 'view-past-game' && viewingGameUrl && (
          <PastGameScreen gameUrl={viewingGameUrl} onBack={() => setScreen('home')} />
        )}
      </div>
      <Toaster />
    </div>
  )
}

export default App
