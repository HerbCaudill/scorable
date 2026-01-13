import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DocumentId } from "@automerge/automerge-repo"
import type { PlayerRecord } from "./types"

type LocalStore = {
  // Known game IDs (bookmarks)
  knownGameIds: DocumentId[]
  addGameId: (id: DocumentId) => void
  removeGameId: (id: DocumentId) => void

  // Player records for autocomplete
  playerRecords: PlayerRecord[]
  addPlayerRecord: (name: string) => void
  getPlayerNames: () => string[]
}

export const useLocalStore = create<LocalStore>()(
  persist(
    (set, get) => ({
      knownGameIds: [],

      addGameId: id => {
        const { knownGameIds } = get()
        if (!knownGameIds.includes(id)) {
          set({ knownGameIds: [id, ...knownGameIds] })
        }
      },

      removeGameId: id => {
        set({ knownGameIds: get().knownGameIds.filter(i => i !== id) })
      },

      playerRecords: [],

      addPlayerRecord: name => {
        const { playerRecords } = get()
        const existingIndex = playerRecords.findIndex(
          r => r.name.toLowerCase() === name.toLowerCase(),
        )

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
    }),
    {
      name: "scorable-local-storage",
      partialize: state => ({
        knownGameIds: state.knownGameIds,
        playerRecords: state.playerRecords,
      }),
    },
  ),
)
