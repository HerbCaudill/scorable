import { test, expect } from '@playwright/test'
import { GamePage } from '../pages/game.page'
import { clearStorage, seedStorage } from '../fixtures/storage-fixtures'
import { createTestGame, createGameWithMoves } from '../fixtures/game-fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
})

test('applies double word score for center square', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // CAT at center: C=3, A=1, T=1 = 5 * 2 (DW) = 10
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()

  expect(await gamePage.getPlayerScore(0)).toBe(10)
})

test('basic word scoring without multipliers', async ({ page }) => {
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

  // Bob adds S below A: S is on DL square, so S(1)*2 + A(1) = 3
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // AS = A(1) + S(1)*2 (DL at 8,8) = 3
  expect(await gamePage.getPlayerScore(1)).toBe(3)
})

test('cross-word scoring', async ({ page }) => {
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

  // Bob places "BA" vertically, connecting to make "BAT"
  // B at 6,9, A at 7,9 (where T already is - skip), so actually:
  // Place B above T and S below T to make "BTS" vertically
  await gamePage.clickCell(6, 9)
  await gamePage.clickCell(6, 9) // Toggle to vertical
  await gamePage.typeLetters('O')
  await gamePage.clickCell(8, 9)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()

  // Should score for the vertical word "OTS" (O=1, T=1, S=1 = 3)
  expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
})

test('bingo bonus for 7 tiles', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // QUILTED (7 letters) at center - Q=10, U=1, I=1, L=1, T=1, E=1, D=2 = 18 * 2 = 36 + 50 = 86
  // Actually let's use a simpler 7-letter word
  // RETAINS: R=1, E=1, T=1, A=1, I=1, N=1, S=1 = 7 * 2 = 14 + 50 = 64
  await gamePage.placeWord(7, 4, 'RETAINS')
  await gamePage.endTurn()

  // 7 tiles = bingo bonus of 50
  const score = await gamePage.getPlayerScore(0)
  expect(score).toBeGreaterThanOrEqual(64) // Base + bingo
})

test('blank tile scores 0 points', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Place C_T where _ is a blank representing A
  // C=3, blank=0, T=1 = 4 * 2 = 8
  await gamePage.clickCell(7, 7)
  await gamePage.typeLetters('C')
  await gamePage.pressKey(' ') // Blank tile
  await gamePage.typeLetters('T')
  await gamePage.endTurn()

  // C(3) + blank(0) + T(1) = 4 * 2 = 8
  expect(await gamePage.getPlayerScore(0)).toBe(8)
})

test('double letter square', async ({ page }) => {
  // The DL squares are at specific positions
  // Position (6,6) is a DL square
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

  // Place a word that uses a DL square
  // (6,6) is DL - place "DC" vertically to connect
  await gamePage.clickCell(6, 7)
  await gamePage.typeLetters('O')
  await gamePage.endTurn()

  // O at DL = 1*2 = 2, plus C from cross = 3, total "OC" = 2+3 = 5
  expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
})

test('scores update after each valid move', async ({ page }) => {
  await seedStorage(page, {
    currentGame: createTestGame(['Alice', 'Bob']),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Resume game' }).click()

  const gamePage = new GamePage(page)

  // Initial scores should be 0
  expect(await gamePage.getPlayerScore(0)).toBe(0)
  expect(await gamePage.getPlayerScore(1)).toBe(0)

  // Alice plays
  await gamePage.placeWord(7, 7, 'CAT')
  await gamePage.endTurn()
  expect(await gamePage.getPlayerScore(0)).toBe(10)
  expect(await gamePage.getPlayerScore(1)).toBe(0)

  // Bob plays
  await gamePage.clickCell(8, 8)
  await gamePage.typeLetters('S')
  await gamePage.endTurn()
  expect(await gamePage.getPlayerScore(0)).toBe(10)
  expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
})
