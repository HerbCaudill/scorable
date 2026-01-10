import { Page } from "@playwright/test"
import type { Game, PlayerRecord } from "../../src/lib/types"

const STORAGE_KEY = "scrabble-game-storage"

export interface StorageState {
  currentGame: Game | null
  pastGames: Game[]
  playerRecords: PlayerRecord[]
}

export async function clearStorage(page: Page) {
  await page.evaluate(async () => {
    localStorage.clear()
    // Also clear IndexedDB for Automerge data
    const databases = await indexedDB.databases()
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name)
      }
    }
  })
}

export async function seedStorage(page: Page, state: Partial<StorageState>) {
  const fullState = {
    state: {
      currentGame: state.currentGame ?? null,
      pastGames: state.pastGames ?? [],
      playerRecords: state.playerRecords ?? [],
    },
    version: 2,
  }

  await page.evaluate(
    ([key, data]) => {
      localStorage.setItem(key, JSON.stringify(data))
    },
    [STORAGE_KEY, fullState] as const,
  )
}

export async function getStorageState(page: Page): Promise<StorageState> {
  return page.evaluate(key => {
    const data = localStorage.getItem(key)
    if (!data) return { currentGame: null, pastGames: [], playerRecords: [] }
    const parsed = JSON.parse(data)
    return parsed.state
  }, STORAGE_KEY)
}

/**
 * Wait for Automerge to persist pending changes to IndexedDB.
 *
 * Automerge-repo writes to IndexedDB asynchronously. When testing persistence
 * across page reloads, we need to ensure pending writes have completed before
 * reloading. This helper waits for the async write queue to flush.
 *
 * Note: We use a fixed delay because Automerge's binary storage format makes
 * it difficult to verify specific document content from the test. The 100ms
 * delay is sufficient for IndexedDB write operations to complete.
 */
export async function waitForAutomergePersistence(page: Page): Promise<void> {
  // Give IndexedDB time to complete pending writes
  // Automerge-repo writes are async but typically complete within 50ms
  await page.waitForTimeout(100)
}
