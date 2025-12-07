import React, { useState, useRef, useEffect } from 'react'
import { Button } from './Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './DropdownMenu'
import { Input } from './Input'

export const PlayerSetup = ({ previousPlayers = [], onStartGame }: Props) => {
  const [players, setPlayers] = useState<Array<string | null>>([null, null, null, null])
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [newNameInput, setNewNameInput] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const enteredPlayers = players.filter((p): p is string => p !== null && p.trim() !== '')
  const canStartGame = enteredPlayers.length >= 2

  // Sort previous players by frequency (assuming they're already sorted)
  // Filter out already-selected players
  const availablePlayers = previousPlayers.filter(name => !players.includes(name))

  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAddingNew])

  const handleSelectPlayer = (index: number, name: string) => {
    const newPlayers = [...players]
    newPlayers[index] = name
    setPlayers(newPlayers)
    setActiveDropdown(null)
    setIsAddingNew(false)
    setNewNameInput('')
  }

  const handleNewClick = () => {
    setIsAddingNew(true)
  }

  const handleNewNameSubmit = (index: number) => {
    if (newNameInput.trim()) {
      handleSelectPlayer(index, newNameInput.trim())
    }
  }

  const handleNewNameKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter') {
      handleNewNameSubmit(index)
    } else if (event.key === 'Escape') {
      setIsAddingNew(false)
      setNewNameInput('')
    }
  }

  const handleClearPlayer = (index: number, event: React.MouseEvent) => {
    event.stopPropagation()
    const newPlayers = [...players]
    newPlayers[index] = null
    setPlayers(newPlayers)
  }

  const handleStartGame = () => {
    if (canStartGame) {
      onStartGame?.(enteredPlayers)
    }
  }

  const handleDropdownOpenChange = (index: number, open: boolean) => {
    if (open) {
      setActiveDropdown(index)
    } else {
      setActiveDropdown(null)
      setIsAddingNew(false)
      setNewNameInput('')
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      {players.map((player, index) => (
        <DropdownMenu
          key={index}
          open={activeDropdown === index}
          onOpenChange={open => handleDropdownOpenChange(index, open)}
        >
          <DropdownMenuTrigger asChild>
            <div
              className={`
                flex items-center justify-between
                px-4 py-3
                border-2 rounded
                cursor-pointer
                transition-colors
                ${
                  player
                    ? 'border-solid border-black bg-white'
                    : activeDropdown === index
                    ? 'border-solid border-black bg-white'
                    : 'border-dashed border-gray-400 bg-white'
                }
              `}
            >
              <span className={player ? 'text-black' : 'text-gray-400'}>
                {index + 1}. {player ?? 'player name'}
              </span>
              {player && (
                <button
                  onClick={event => handleClearPlayer(index, event)}
                  className="text-gray-400 hover:text-black transition-colors"
                  aria-label="Clear player"
                >
                  ×
                </button>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
            {isAddingNew ? (
              <div className="p-2">
                <Input
                  ref={inputRef}
                  type="text"
                  value={newNameInput}
                  onChange={event => setNewNameInput(event.target.value)}
                  onKeyDown={event => handleNewNameKeyDown(event, index)}
                  placeholder="Enter name..."
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => handleNewNameSubmit(index)} disabled={!newNameInput.trim()}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsAddingNew(false)
                      setNewNameInput('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <DropdownMenuItem onSelect={handleNewClick} className="font-medium">
                  New...
                </DropdownMenuItem>
                {availablePlayers.map(name => (
                  <DropdownMenuItem key={name} onSelect={() => handleSelectPlayer(index, name)}>
                    {name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      <Button
        size="lg"
        onClick={handleStartGame}
        disabled={!canStartGame}
        className={`
          mt-4 w-full
          ${canStartGame ? 'border-2 border-blue-500' : 'opacity-50 cursor-not-allowed'}
        `}
      >
        start game
      </Button>
    </div>
  )
}

type Props = {
  previousPlayers?: string[]
  onStartGame?: (players: string[]) => void
}
