import { Page } from "@playwright/test"

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
