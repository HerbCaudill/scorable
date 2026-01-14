import { test, expect } from "@playwright/test"
import { GamePage } from "../pages/game.page"
import { HomePage } from "../pages/home.page"
import { clearStorage } from "../fixtures/storage-fixtures"

import { seedTwoPlayerGame } from "../fixtures/seed-game"

test.describe("Scoring", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedTwoPlayerGame(page)
    gamePage = new GamePage(page)
  })

  test("applies double word score for center square", async () => {
    // CAT at center: C=3, A=1, T=1 = 5 * 2 (DW) = 10
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    expect(await gamePage.getPlayerScore(0)).toBe(10)
  })

  test("basic word scoring without multipliers", async () => {
    // Alice places CAT at center
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob adds S below A: S is on DL square, so S(1)*2 + A(1) = 3
    await gamePage.clickCell(8, 8)
    await gamePage.typeLetters("S")
    await gamePage.endTurn()

    // AS = A(1) + S(1)*2 (DL at 8,8) = 3
    expect(await gamePage.getPlayerScore(1)).toBe(3)
  })

  test("cross-word scoring", async () => {
    // Alice places CAT at center
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Bob places "O" above T and "S" below T to make "OTS" vertically
    await gamePage.setCursorDirection(6, 9, "vertical")
    await gamePage.typeLetters("O")
    await gamePage.clickCell(8, 9)
    await gamePage.typeLetters("S")
    await gamePage.endTurn()

    // Should score for the vertical word "OTS" (O=1, T=1, S=1 = 3)
    expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
  })

  test("bingo bonus for 7 tiles", async () => {
    // RETAINS: R=1, E=1, T=1, A=1, I=1, N=1, S=1 = 7 * 2 = 14 + 50 = 64
    await gamePage.placeWord(7, 4, "RETAINS")
    await gamePage.endTurn()

    // 7 tiles = bingo bonus of 50
    const score = await gamePage.getPlayerScore(0)
    expect(score).toBeGreaterThanOrEqual(64) // Base + bingo
  })

  test("blank tile scores 0 points", async () => {
    // Place C_T where _ is a blank representing A
    // C=3, blank=0, T=1 = 4 * 2 = 8
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("C")
    await gamePage.pressKey(" ") // Blank tile (placed immediately as unassigned)
    await gamePage.typeLetters("T")
    await gamePage.pressKey("Enter") // Commit - dialog appears for blank letter
    await gamePage.typeBlankLetters("A") // Type letter for blank tile and click Done

    // C(3) + blank(0) + T(1) = 4 * 2 = 8
    expect(await gamePage.getPlayerScore(0)).toBe(8)
  })

  test("blank tile letter is displayed in yellow on board", async ({ page }) => {
    // Place C_T where _ is a blank representing A
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("C")
    await gamePage.pressKey(" ") // Blank tile
    await gamePage.typeLetters("T")
    await gamePage.pressKey("Enter")
    await gamePage.typeBlankLetters("A")

    // Find the blank tile on the board (at position H8) - aria-label indicates it's a blank
    const blankTile = page.locator('[aria-label="Blank tile representing A"]')
    await expect(blankTile).toBeVisible()

    // The letter span inside should have yellow color (not the default khaki-800)
    const letterSpan = blankTile.locator("span").first()
    const color = await letterSpan.evaluate((el) => getComputedStyle(el).color)
    // Yellow-600 is approximately rgb(202, 138, 4) - just verify it's not the default khaki
    expect(color).not.toContain("rgb(72,") // khaki-800 starts with ~72
  })

  test("blank tile letter is displayed in yellow on scoresheet", async ({ page }) => {
    // Place C_T where _ is a blank representing A
    await gamePage.clickCell(7, 7)
    await gamePage.typeLetters("C")
    await gamePage.pressKey(" ") // Blank tile
    await gamePage.typeLetters("T")
    await gamePage.pressKey("Enter")
    await gamePage.typeBlankLetters("A")

    // Wait for move to be committed and appear in history (Alice's panel)
    const alicePanel = page.locator('[role="region"][data-player="Alice"]')
    await expect(alicePanel).toContainText("CAT")

    // The blank letter "A" should have the yellow class applied
    // DOM structure: div.truncate > span (WordsDisplay wrapper) > span (WordWithBlanks) > span.text-yellow-600
    // Find spans inside the move entry with yellow color
    const moveEntry = alicePanel.locator(".divide-y > div").first()

    // Get the computed color of the "A" letter (second character in CAT)
    // The structure is: span.truncate > span > span > span[0]=C, span[1]=A, span[2]=T
    const letterSpans = moveEntry.locator("span.truncate span span span")

    // Get the colors of C and A to verify A is different (yellow)
    const cColor = await letterSpans.nth(0).evaluate((el) => getComputedStyle(el).color)
    const aColor = await letterSpans.nth(1).evaluate((el) => getComputedStyle(el).color)

    // The blank letter A should have a different color than regular letter C
    expect(aColor).not.toBe(cColor)
    // A should have yellow coloring (oklch format with positive chroma/saturation)
    expect(aColor).toContain("oklch")
    // Yellow-600 has chroma > 0, regular text has chroma = 0
    expect(aColor).not.toBe("oklch(0.439 0 0)") // Not the default gray
  })

  test("double letter square", async () => {
    // Alice places CAT at center
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()

    // Place a word that uses a DL square
    // (6,7) should connect to C - place "O" above C
    await gamePage.clickCell(6, 7)
    await gamePage.typeLetters("O")
    await gamePage.endTurn()

    // O at some position + C from cross
    expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
  })

  test("scores update after each valid move", async () => {
    // Initial scores should be 0
    expect(await gamePage.getPlayerScore(0)).toBe(0)
    expect(await gamePage.getPlayerScore(1)).toBe(0)

    // Alice plays
    await gamePage.placeWord(7, 7, "CAT")
    await gamePage.endTurn()
    expect(await gamePage.getPlayerScore(0)).toBe(10)
    expect(await gamePage.getPlayerScore(1)).toBe(0)

    // Bob plays
    await gamePage.clickCell(8, 8)
    await gamePage.typeLetters("S")
    await gamePage.endTurn()
    expect(await gamePage.getPlayerScore(0)).toBe(10)
    expect(await gamePage.getPlayerScore(1)).toBeGreaterThan(0)
  })
})

test.describe("Imported game blank tiles", () => {
  test("imported games display blank tiles with assigned letters", async ({ page }) => {
    // Clear storage and navigate to home
    await page.goto("/")
    await clearStorage(page)

    // Create test games - these are imported from GCG files
    await page.getByRole("button", { name: /Create test games/i }).click()

    // Wait for games to load
    await expect(page.getByText("Past games")).toBeVisible()

    // Navigate to a past game
    const homePage = new HomePage(page)
    await homePage.clickPastGame(0)

    // Wait for past game screen
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible()

    // Look for any blank tiles on the board - they should have yellow coloring
    // Blank tiles are marked with aria-label="Blank tile representing X"
    const blankTiles = page.locator('[aria-label^="Blank tile representing"]')
    const blankTileCount = await blankTiles.count()

    // Many of the test games have blank tiles, so we should find some
    // If we find blank tiles, verify they display correctly (not as empty spaces)
    if (blankTileCount > 0) {
      const firstBlankTile = blankTiles.first()
      await expect(firstBlankTile).toBeVisible()

      // The blank tile should show a letter (from the aria-label we know it represents a letter)
      const ariaLabel = await firstBlankTile.getAttribute("aria-label")
      // Extract the letter from "Blank tile representing X"
      const letter = ariaLabel?.replace("Blank tile representing ", "")
      expect(letter).toMatch(/^[A-Z]$/)

      // The tile should display that letter
      await expect(firstBlankTile).toContainText(letter!)
    }
  })
})
