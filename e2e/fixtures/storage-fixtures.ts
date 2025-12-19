import { Page } from '@playwright/test'
import type { Game, PlayerRecord } from '../../src/lib/types'

const STORAGE_KEY = 'scrabble-game-storage'

export interface StorageState {
  currentGame: Game | null
  pastGames: Game[]
  playerRecords: PlayerRecord[]
}

export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
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
    [STORAGE_KEY, fullState] as const
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
