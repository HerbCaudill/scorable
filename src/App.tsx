import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { PlayerSetupScreen } from './components/PlayerSetupScreen'
import { GameScreen } from './components/GameScreen'
import { useGameStore } from './lib/gameStore'

type Screen = 'home' | 'player-setup' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const { currentGame } = useGameStore()

  // If there's an active game and we're on home, allow resuming
  const handleResumeGame = () => {
    if (currentGame && currentGame.status !== 'finished') {
      setScreen('game')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {screen === 'home' && <HomeScreen onNewGame={() => setScreen('player-setup')} onResumeGame={handleResumeGame} />}
      {screen === 'player-setup' && (
        <PlayerSetupScreen onStartGame={() => setScreen('game')} onBack={() => setScreen('home')} />
      )}
      {screen === 'game' && <GameScreen onEndGame={() => setScreen('home')} />}
    </div>
  )
}

export default App
