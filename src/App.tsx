import { useState, useEffect } from 'react'
import type { DocumentId } from '@automerge/automerge-repo'
import { HomeScreen } from './components/HomeScreen'
import { PlayerSetupScreen } from './components/PlayerSetupScreen'
import { GameScreen } from './components/GameScreen'
import { PastGameScreen } from './components/PastGameScreen'
import { useGameId } from './lib/useGameId'
import { Toaster } from '@/components/ui/sonner'

type Screen = 'home' | 'player-setup' | 'game' | 'view-past-game'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [viewingGameId, setViewingGameId] = useState<DocumentId | null>(null)
  const [gameId, setGameId] = useGameId()

  // Navigate based on URL hash: game screen when hash present, home when cleared
  useEffect(() => {
    if (gameId) {
      setScreen('game')
    } else if (screen === 'game') {
      // Hash was cleared, go back to home
      setScreen('home')
    }
  }, [gameId, screen])

  const handleResumeGame = (id: DocumentId) => {
    setGameId(id)
    setScreen('game')
  }

  const handleViewPastGame = (id: DocumentId) => {
    setViewingGameId(id)
    setScreen('view-past-game')
  }

  const handleGameCreated = (id: DocumentId) => {
    setGameId(id)
    setScreen('game')
  }

  const handleEndGame = () => {
    setGameId(null)
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
        {screen === 'game' && gameId && <GameScreen gameId={gameId} onEndGame={handleEndGame} />}
        {screen === 'view-past-game' && viewingGameId && (
          <PastGameScreen gameId={viewingGameId} onBack={() => setScreen('home')} />
        )}
      </div>
      <Toaster />
    </div>
  )
}

export default App
