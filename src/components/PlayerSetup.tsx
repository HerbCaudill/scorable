import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { IconPlus, IconX, IconCheck, IconPlayerPlay } from "@tabler/icons-react"

export const PlayerSetup = ({ previousPlayers = [], onStartGame }: Props) => {
  const [players, setPlayers] = useState<Array<string | null>>([null, null, null, null])
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [newNameInput, setNewNameInput] = useState("")
  const [isAddingNew, setIsAddingNew] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const enteredPlayers = players.filter((p): p is string => p !== null && p.trim() !== "")
  const canStartGame = enteredPlayers.length >= 2

  // Sort previous players by frequency (assuming they're already sorted)
  // Filter out already-selected players
  const availablePlayers = previousPlayers.filter(name => !players.includes(name))

  useEffect(() => {
    if (isAddingNew) {
      // Use multiple attempts to focus - mobile browsers are finicky
      // and Radix's dropdown animation needs time to complete
      const focusInput = () => inputRef.current?.focus()
      // Try immediately if input exists
      focusInput()
      // Retry after delays for Radix's focus management and animations
      const timeoutId1 = setTimeout(focusInput, 50)
      const timeoutId2 = setTimeout(focusInput, 150)
      return () => {
        clearTimeout(timeoutId1)
        clearTimeout(timeoutId2)
      }
    }
  }, [isAddingNew])

  const handleSelectPlayer = (index: number, name: string) => {
    const newPlayers = [...players]
    newPlayers[index] = name
    setPlayers(newPlayers)
    setIsAddingNew(false)
    setNewNameInput("")

    // Count how many players will be entered after this selection
    const enteredCount = newPlayers.filter((p): p is string => p !== null && p.trim() !== "").length

    // If we don't have 2 players yet, auto-focus the next empty slot
    if (enteredCount < 2) {
      const nextEmptyIndex = newPlayers.findIndex((p, i) => i > index && p === null)
      if (nextEmptyIndex !== -1) {
        // Open the next dropdown (Radix will close the current one)
        setActiveDropdown(nextEmptyIndex)
        // Auto-show new player input if no previous players are available
        const remainingPlayers = previousPlayers.filter(n => !newPlayers.includes(n))
        if (remainingPlayers.length === 0) {
          setIsAddingNew(true)
        }
        return
      }
    }

    setActiveDropdown(null)
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
    if (event.key === "Enter") {
      handleNewNameSubmit(index)
    } else if (event.key === "Escape") {
      setIsAddingNew(false)
      setNewNameInput("")
    }
  }

  const handleClearPlayer = (index: number) => {
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
      // Auto-show new player input if no previous players are available
      if (availablePlayers.length === 0) {
        setIsAddingNew(true)
      }
    } else {
      setActiveDropdown(null)
      setIsAddingNew(false)
      setNewNameInput("")
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
                  player ? "border-solid border-black bg-white"
                  : activeDropdown === index ? "border-solid border-black bg-white"
                  : "border-dashed border-gray-400 bg-white"
                }
              `}
            >
              <span className={player ? "text-black" : "text-gray-400"}>
                {index + 1}. {player ?? "player name"}
              </span>
              {player && (
                <button
                  onPointerDown={event => {
                    event.preventDefault()
                    event.stopPropagation()
                    handleClearPlayer(index)
                  }}
                  className="text-gray-400 hover:text-black transition-colors"
                  aria-label="Clear player"
                >
                  <IconX size={16} />
                </button>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
            {isAddingNew ?
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
                  <Button
                    size="sm"
                    onClick={() => handleNewNameSubmit(index)}
                    disabled={!newNameInput.trim()}
                  >
                    <IconCheck size={16} />
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsAddingNew(false)
                      setNewNameInput("")
                    }}
                  >
                    <IconX size={16} />
                    Cancel
                  </Button>
                </div>
              </div>
            : <>
                {availablePlayers.map(name => (
                  <DropdownMenuItem key={name} onSelect={() => handleSelectPlayer(index, name)}>
                    {name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onSelect={event => {
                    event.preventDefault()
                    handleNewClick()
                  }}
                  className="font-medium"
                >
                  <IconPlus size={16} />
                  New...
                </DropdownMenuItem>
              </>
            }
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      <Button
        size="lg"
        onClick={handleStartGame}
        disabled={!canStartGame}
        className={`
          mt-4 w-full
          ${canStartGame ? "" : "opacity-50 cursor-not-allowed"}
        `}
      >
        <IconPlayerPlay size={20} />
        Start game
      </Button>
    </div>
  )
}

type Props = {
  previousPlayers?: string[]
  onStartGame?: (players: string[]) => void
}
