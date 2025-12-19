import { test, expect } from '@playwright/test'
import { GamePage } from '../pages/game.page'
import { clearStorage, seedStorage } from '../fixtures/storage-fixtures'
import { createTestGame, createGameWithMoves } from '../fixtures/game-fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
})

test('first move must include center square', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Place word NOT on center
  await gamePage.placeWord(0, 0, 'CAT')
  await gamePage.endTurn()

  // Should show error toast
  await expect(page.getByText('First word must include the center square')).toBeVisible()
})

test('first move on center square succeeds', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Place word on center
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  // Should succeed - score should update and turn should change
  expect(await gamePage.getPlayerScore(0)).toBe(10) // CAT = 5 * 2 (DW) = 10
  expect(await gamePage.getCurrentPlayerIndex()).toBe(1)
})

test('subsequent moves must connect to existing tiles', async ({ page }) => {
  const gameWithMove = createGameWithMoves(['Alice', 'Bob'], [
    {
      playerIndex: 0,
      tilesPlaced: [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: 'A' },
        { row: 7, col: 9, tile: 'T' },
      ],
    },
  ])

  await seedStorage(page, { currentGame: gameWithMove })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Place word not connected to existing tiles
  await gamePage.placeWord(0, 0, 'DOG')
  await gamePage.endTurn()

  // Should show error
  await expect(page.getByText('Word must connect to existing tiles')).toBeVisible()
})

test('connected word succeeds', async ({ page }) => {
  const gameWithMove = createGameWithMoves(['Alice', 'Bob'], [
    {
      playerIndex: 0,
      tilesPlaced: [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: 'A' },
        { row: 7, col: 9, tile: 'T' },
      ],
    },
  ])

  await seedStorage(page, { currentGame: gameWithMove })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Place word connected to existing tiles (add S below A to make AS)
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // Should succeed - turn should change
  expect(await gamePage.getCurrentPlayerIndex()).toBe(0)
  expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
})

test('tiles must be in single line', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Place tiles in L-shape (not in a line)
  await gamePage.clickCell(7, 7)
  await gamePage.typeLetters('C')
  await gamePage.clickCell(7, 8)
  await gamePage.typeLetters('A')
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('T')
  await gamePage.endTurn()

  // Should show error
  await expect(page.getByText('Tiles must be in a single row or column')).toBeVisible()
})

test('word cannot have gaps', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Place tiles with a gap
  await gamePage.clickCell(7, 7)
  await gamePage.typeLetters('C')
  await gamePage.clickCell(7, 9) // Skip col 8
  await gamePage.typeLetters('T')
  await gamePage.endTurn()

  // Should show error
  await expect(page.getByText('Word cannot have gaps')).toBeVisible()
})

test('short word on first turn is valid', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Place a short word (2 letters) on center - this is allowed in scrabble
  await gamePage.placeWord(7, 7, 'AT')
  await gamePage.endTurn()

  // Should succeed - score should update
  // AT on center: A(1) + T(1) = 2 * 2 (DW) = 4
  expect(await gamePage.getPlayerScore(0)).toBe(4)
})
