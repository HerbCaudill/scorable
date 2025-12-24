import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AutomergeUrl } from '@automerge/automerge-repo'
import type { PlayerRecord } from './types'

type LocalStore = {
  // Known game URLs (bookmarks)
  knownGameUrls: AutomergeUrl[]
  addGameUrl: (url: AutomergeUrl) => void
  removeGameUrl: (url: AutomergeUrl) => void

  // Player records for autocomplete
  playerRecords: PlayerRecord[]
  addPlayerRecord: (name: string) => void
  getPlayerNames: () => string[]

  // Ephemeral UI state (not persisted)
  timerRunning: boolean
  setTimerRunning: (running: boolean) => void
}

export const useLocalStore = create<LocalStore>()(
  persist(
    (set, get) => ({
      knownGameUrls: [],

      addGameUrl: url => {
        const { knownGameUrls } = get()
        if (!knownGameUrls.includes(url)) {
          set({ knownGameUrls: [url, ...knownGameUrls] })
        }
      },

      removeGameUrl: url => {
        set({ knownGameUrls: get().knownGameUrls.filter(u => u !== url) })
      },

      playerRecords: [],

      addPlayerRecord: name => {
        const { playerRecords } = get()
        const existingIndex = playerRecords.findIndex(r => r.name.toLowerCase() === name.toLowerCase())

        if (existingIndex >= 0) {
          const updated = [...playerRecords]
          updated[existingIndex] = {
            ...updated[existingIndex],
            gamesPlayed: updated[existingIndex].gamesPlayed + 1,
            lastPlayedAt: Date.now(),
          }
          set({ playerRecords: updated })
        } else {
          set({
            playerRecords: [
              ...playerRecords,
              {
                name,
                gamesPlayed: 1,
                lastPlayedAt: Date.now(),
              },
            ],
          })
        }
      },

      getPlayerNames: () => {
        const { playerRecords } = get()
        return [...playerRecords]
          .sort((a, b) => {
            if (b.gamesPlayed !== a.gamesPlayed) {
              return b.gamesPlayed - a.gamesPlayed
            }
            return b.lastPlayedAt - a.lastPlayedAt
          })
          .map(r => r.name)
      },

      timerRunning: false,

      setTimerRunning: running => set({ timerRunning: running }),
    }),
    {
      name: 'scrabble-local-storage',
      partialize: state => ({
        knownGameUrls: state.knownGameUrls,
        playerRecords: state.playerRecords,
      }),
    }
  )
)
