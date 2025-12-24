import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { PlayerSetupScreen } from './components/PlayerSetupScreen'
import { GameScreen } from './components/GameScreen'
import { PastGameScreen } from './components/PastGameScreen'
import { useGameStore } from './lib/gameStore'
import { Toaster } from '@/components/ui/sonner'

type Screen = 'home' | 'player-setup' | 'game' | 'view-past-game'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [viewingGameId, setViewingGameId] = useState<string | null>(null)
  const { currentGame } = useGameStore()

  const handleResumeGame = () => {
    if (currentGame && currentGame.status !== 'finished') {
      setScreen('game')
    }
  }

  const handleViewPastGame = (gameId: string) => {
    setViewingGameId(gameId)
    setScreen('view-past-game')
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
        <PlayerSetupScreen onStartGame={() => setScreen('game')} onBack={() => setScreen('home')} />
      )}
      {screen === 'game' && <GameScreen onEndGame={() => setScreen('home')} />}
      {screen === 'view-past-game' && viewingGameId && (
        <PastGameScreen gameId={viewingGameId} onBack={() => setScreen('home')} />
      )}
      </div>
      <Toaster />
    </div>
  )
}

export default App
