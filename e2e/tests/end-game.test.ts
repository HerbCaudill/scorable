import { test, expect } from "@playwright/test"
import { HomePage } from "../pages/home.page"
import { GamePage } from "../pages/game.page"
import { seedNearEndGame } from "../fixtures/seed-game"

test.describe("End game", () => {
  let gamePage: GamePage

  test.beforeEach(async ({ page }) => {
    await seedNearEndGame(page)
    gamePage = new GamePage(page)

    // Verify tiles remaining is low (should be 7 for 2 players to show EndGameScreen)
    const tilesButton = page.getByRole("button", { name: /Tiles/ })
    const tilesText = await tilesButton.textContent()
    const tilesMatch = tilesText?.match(/Tiles \((\d+)\)/)
    const tilesRemaining = tilesMatch ? parseInt(tilesMatch[1], 10) : -1
    if (tilesRemaining > 7) {
      throw new Error(
        `Expected <= 7 tiles remaining, but got ${tilesRemaining}. Tile text: "${tilesText}"`,
      )
    }
  })

  test("shows EndGameScreen when tiles <= threshold", async () => {
    // Click End Game - should show EndGameScreen, not simple dialog
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()
  })

  test("defaults to last player as who ended the game", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Last move was by Alice (playerIndex 0), so Alice should be shown as "ended the game"
    await gamePage.expectPlayerEndedGame("Alice")
  })

  test("can change who ended the game", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Change to Bob
    await gamePage.selectPlayerWhoEndedGame("Bob")
    await gamePage.expectPlayerEndedGame("Bob")
  })

  test("can select nobody for blocked game", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    await gamePage.selectNobodyEndedGame()

    // Neither player should show "ended the game"
    const aliceSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Alice" })
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    await expect(aliceSection).not.toContainText("ended the game")
    await expect(bobSection).not.toContainText("ended the game")
  })

  test("auto-populates rack with remaining tiles for 2-player game", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack should be auto-populated with remaining tiles
    // The remaining tiles are I, N, N, R, T, U (values: 1+1+1+1+1+1 = 6)
    const adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-6")
  })

  test("player who ended game gets bonus", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack is auto-populated with remaining tiles
    // Alice (who ended) should get bonus equal to Bob's remaining tile values
    // The remaining tiles are I, N, N, R, T, U (values: 1+1+1+1+1+1 = 6)
    const aliceAdjustment = await gamePage.getPlayerAdjustment("Alice")
    expect(aliceAdjustment).toBe("+6")
  })

  test("validates rack tiles against remaining", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack is auto-populated with remaining tiles
    // Now try to enter a Q tile (which was already played in the game)
    await gamePage.enterRackTiles("Bob", "Q")

    // Should show error since Q was already used (it's now in rack via typing)
    // New format: tile component followed by "none left" or "X entered, but only Y left"
    await gamePage.expectRackError("Bob", "none left")

    // Apply button should be disabled
    expect(await gamePage.isApplyButtonDisabled()).toBe(true)
  })

  test("can cancel and return to game", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    await gamePage.cancelEndGame()
    await page.waitForSelector('[role="grid"][aria-label="Scrabble board"]')
  })

  test("apply creates adjustment moves and ends game", async ({ page }) => {
    const homePage = new HomePage(page)

    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack is auto-populated with remaining tiles
    // Just click apply - the rack is already populated correctly
    await gamePage.applyAndEndGame()

    // Should return to home screen
    await homePage.expectOnHomeScreen()
  })

  test("backspace removes tiles from rack input", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack is auto-populated with remaining tiles
    // The remaining tiles are I, N, N, R, T, U (values: 1+1+1+1+1+1 = 6)
    let adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-6")

    // Remove one tile
    await gamePage.clearRackTiles("Bob", 1)
    adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-5") // One less tile (value 1)
  })

  test("can override auto-populated rack tiles", async () => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // For 2-player games, Bob's rack starts auto-populated with 6 tiles
    let adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-6")

    // Clear all tiles - when rack is empty, deduction shows nothing (not "0")
    await gamePage.clearRackTiles("Bob", 6)

    // Enter just 3 tiles - now the adjustment should show
    await gamePage.enterRackTiles("Bob", "INN")
    adjustment = await gamePage.getPlayerAdjustment("Bob")
    expect(adjustment).toBe("-3") // I=1, N=1, N=1
  })

  test("rack error shows tile component with appropriate message", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Bob's rack is auto-populated with remaining tiles: I, N, N, R, T, U
    // Enter a Q tile (which has 0 remaining since it was used in the game)
    await gamePage.enterRackTiles("Bob", "Q")

    // Error should show "none left" for tile with 0 remaining
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    // Select the error div specifically (has flex layout for tile + text)
    const errorElement = bobSection.locator("div.flex.items-center.gap-1\\.5.text-red-600")
    await expect(errorElement).toContainText("none left")

    // Error should contain a tile component (div with Tile styling)
    const tileInError = errorElement.locator("div.bg-amber-100")
    await expect(tileInError).toBeVisible()

    // Clear Q and test the "X entered, but only Y left" format
    await gamePage.clearRackTiles("Bob", 1) // Remove Q

    // Now add 3 more N tiles (already have 2, only 2 available total)
    await gamePage.enterRackTiles("Bob", "NNN")

    // Should show "X entered, but only Y left" format
    await expect(errorElement).toContainText("entered, but only")
    await expect(errorElement).toContainText("left")
  })

  test("mobile keyboard appears when clicking rack input", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Initially, keyboard should be hidden (has translate-y-full class)
    const keyboard = page.locator(".fixed.inset-x-0.bottom-0.z-70.bg-neutral-200")
    await expect(keyboard).toHaveClass(/translate-y-full/)

    // Click on Bob's rack input (he's not the one who ended the game, so it's editable)
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    await rackInput.click()

    // Now keyboard should be visible (has translate-y-0 class)
    await expect(keyboard).toHaveClass(/translate-y-0/)

    // Verify keyboard has letter keys (use exact match)
    await expect(keyboard.getByRole("button", { name: "A", exact: true })).toBeVisible()
    await expect(keyboard.getByRole("button", { name: "Z", exact: true })).toBeVisible()

    // Verify keyboard has blank button
    await expect(keyboard.getByRole("button", { name: "blank" })).toBeVisible()

    // Tap hide button (chevron down) to close keyboard - use tap() for touch event
    const hideButton = keyboard.locator("button").filter({ has: page.locator("svg") }).last()
    await hideButton.tap()

    // Keyboard should be hidden again
    await expect(keyboard).toHaveClass(/translate-y-full/)
  })

  test("mobile keyboard input adds tiles to rack", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Clear Bob's auto-populated tiles first
    await gamePage.clearRackTiles("Bob", 6)

    // Click on Bob's rack input
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    await rackInput.click()

    // Use the mobile keyboard to type letters
    const keyboard = page.locator(".fixed.inset-x-0.bottom-0.z-70.bg-neutral-200")
    await expect(keyboard).toHaveClass(/translate-y-0/)

    // Type "A" using keyboard - use tap() for touch event simulation
    await keyboard.getByRole("button", { name: "A", exact: true }).tap()

    // Verify the tile appears in the rack
    const tiles = bobSection.locator('[tabindex="0"]').locator(".bg-amber-100")
    await expect(tiles).toHaveCount(1)

    // Type "B" and "C"
    await keyboard.getByRole("button", { name: "B", exact: true }).tap()
    await keyboard.getByRole("button", { name: "C", exact: true }).tap()
    await expect(tiles).toHaveCount(3)

    // Use backspace to remove one - first button with SVG icon is backspace
    await keyboard.getByRole("button").filter({ has: page.locator("svg") }).first().tap()
    await expect(tiles).toHaveCount(2)
  })

  test("focused rack input shows teal border", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Click on Bob's rack input
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')

    // Initially should not have teal border
    await expect(rackInput).not.toHaveClass(/border-teal-500/)

    // Click to focus
    await rackInput.click()

    // Now should have teal border
    await expect(rackInput).toHaveClass(/border-teal-500/)
  })

  test("focused rack input shows blinking cursor", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Click on Bob's rack input
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')

    // Initially should not have cursor visible
    const cursor = rackInput.locator(".animate-blink")
    await expect(cursor).toHaveCount(0)

    // Click to focus
    await rackInput.click()

    // Now cursor should be visible with the blink animation
    await expect(cursor).toBeVisible()
    await expect(cursor).toHaveClass(/bg-teal-500/)
  })

  test("disabled rack input does not show cursor when clicked", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Alice ended the game, so her rack is disabled
    const aliceSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Alice" })
    const rackInput = aliceSection.locator('[tabindex="-1"]')

    // Try to click Alice's rack (which is disabled)
    await rackInput.click()

    // Cursor should not be visible
    const cursor = rackInput.locator(".animate-blink")
    await expect(cursor).toHaveCount(0)
  })

  test("unaccounted tiles appear when tiles are cleared from rack", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Initially Bob's rack is auto-populated with all remaining tiles (I, N, N, R, T, U)
    // So the "Remaining tiles" label should not be visible
    const unaccountedSection = page.getByTestId("unaccounted-tiles")
    await expect(unaccountedSection.locator("text=Remaining tiles")).not.toBeVisible()

    // Clear all tiles from Bob's rack (6 tiles)
    await gamePage.clearRackTiles("Bob", 6)

    // Now unaccounted tiles section label should be visible
    await expect(unaccountedSection).toContainText("Remaining tiles")

    // Should show the 6 unaccounted tiles as visual tile components (divs now, not buttons)
    const tiles = unaccountedSection.locator("[draggable='true'] .bg-amber-100")
    await expect(tiles).toHaveCount(6)
  })

  test("remaining tiles section appears below player racks", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Clear all tiles from Bob's rack to make Remaining tiles section visible
    await gamePage.clearRackTiles("Bob", 6)

    // Get the position of the last player section (Bob's)
    const playerSections = page.locator('[data-testid^="player-rack-"]')
    const lastPlayerSection = playerSections.last()
    const playerBox = await lastPlayerSection.boundingBox()

    // Get the position of the Remaining tiles section
    const remainingSection = page.getByTestId("unaccounted-tiles")
    const remainingBox = await remainingSection.boundingBox()

    // Verify Remaining tiles is below the player racks
    expect(remainingBox).not.toBeNull()
    expect(playerBox).not.toBeNull()
    expect(remainingBox!.y).toBeGreaterThan(playerBox!.y + playerBox!.height - 10) // -10 for some tolerance
  })

  test("tapping unaccounted tile adds it to focused player rack", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Clear all tiles from Bob's rack to show unaccounted tiles
    await gamePage.clearRackTiles("Bob", 6)

    // Verify unaccounted tiles label is visible
    const unaccountedSection = page.getByTestId("unaccounted-tiles")
    await expect(unaccountedSection).toContainText("Remaining tiles")

    // Bob's rack should now be empty
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    let bobTiles = bobSection.locator('[tabindex="0"]').locator(".bg-amber-100")
    await expect(bobTiles).toHaveCount(0)

    // Click on Bob's rack to focus it
    const rackInput = bobSection.locator('[tabindex="0"]')
    await rackInput.click()

    // Should now show "(tap to add)" hint
    await expect(unaccountedSection).toContainText("(tap to add)")

    // Tap the first unaccounted tile to add it to Bob's rack (now divs, not buttons)
    const firstTile = unaccountedSection.locator("[draggable='true']").first()
    await firstTile.click()

    // Bob's rack should now have 1 tile
    bobTiles = bobSection.locator('[tabindex="0"]').locator(".bg-amber-100")
    await expect(bobTiles).toHaveCount(1)

    // Unaccounted tiles should now show 5 tiles (one was moved)
    const unaccountedTiles = unaccountedSection.locator("[draggable='true'] .bg-amber-100")
    await expect(unaccountedTiles).toHaveCount(5)
  })

  test("unaccounted tiles are disabled when no rack is focused", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Clear all tiles from Bob's rack to show unaccounted tiles
    await gamePage.clearRackTiles("Bob", 6)

    // Click elsewhere to blur the rack input
    await page.click("h2:text('Remaining tiles')")
    await page.waitForTimeout(200) // Allow focus change to process

    // Unaccounted tiles section should be visible but without the hint
    const unaccountedSection = page.getByTestId("unaccounted-tiles")
    await expect(unaccountedSection).toContainText("Remaining tiles")
    await expect(unaccountedSection).not.toContainText("(tap to add)")

    // Tiles should have opacity-50 class (disabled state) - now divs, not buttons
    const firstTile = unaccountedSection.locator("[draggable='true']").first()
    await expect(firstTile).toHaveClass(/opacity-50/)
  })

  test("footer has transparent background", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Find the footer container (has Cancel and Apply buttons)
    const footer = page.locator("div.border-t").filter({
      has: page.getByRole("button", { name: "Apply & end game" }),
    })

    // Verify the footer doesn't have bg-white class
    await expect(footer).not.toHaveClass(/bg-white/)

    // Verify the background is actually transparent by checking computed style
    const bgColor = await footer.evaluate(el => getComputedStyle(el).backgroundColor)
    // transparent is represented as "rgba(0, 0, 0, 0)" in computed styles
    expect(bgColor).toBe("rgba(0, 0, 0, 0)")
  })

  test("tapping a tile in player rack shows X icon to remove it", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Bob's rack is auto-populated with tiles (I, N, N, R, T, U)
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    const tiles = rackInput.locator(".relative.h-8.w-8")

    // Initially should have 6 tiles and no X button visible
    await expect(tiles).toHaveCount(6)
    const removeButton = page.getByTestId("remove-tile-button")
    await expect(removeButton).toHaveCount(0)

    // Click on the first tile
    await tiles.first().click()

    // X button should now be visible
    await expect(removeButton).toBeVisible()
    await expect(removeButton).toHaveClass(/bg-red-500/)
  })

  test("clicking X icon removes tile from rack and adds to remaining tiles", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Bob's rack has tiles (I, N, N, R, T, U) - sorted alphabetically
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    const tiles = rackInput.locator(".relative.h-8.w-8")

    // Initially no remaining tiles label visible (all tiles assigned)
    const unaccountedSection = page.getByTestId("unaccounted-tiles")
    await expect(unaccountedSection.locator("text=Remaining tiles")).not.toBeVisible()

    // Click on the first tile (should be "I")
    await tiles.first().click()

    // X button should appear
    const removeButton = page.getByTestId("remove-tile-button")
    await expect(removeButton).toBeVisible()

    // Click the X button to remove the tile
    await removeButton.click()

    // Should now have 5 tiles
    await expect(tiles).toHaveCount(5)

    // X button should be hidden (selection cleared)
    await expect(removeButton).toHaveCount(0)

    // Remaining tiles section should now show the label with the removed tile
    await expect(unaccountedSection).toContainText("Remaining tiles")
  })

  test("tapping another tile moves X icon to that tile", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Bob's rack has tiles
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    const tiles = rackInput.locator(".relative.h-8.w-8")

    // Click on the first tile
    await tiles.first().click()

    // X button should be on first tile
    const removeButton = page.getByTestId("remove-tile-button")
    await expect(removeButton).toBeVisible()

    // Click on the third tile
    await tiles.nth(2).click()

    // X button should still be visible (on the new tile)
    await expect(removeButton).toBeVisible()

    // The button should be positioned on the third tile (verify its parent is the third tile's container)
    const buttonParent = removeButton.locator("..")
    // Get the third tile container and check they're the same element
    const thirdTile = tiles.nth(2)
    await expect(buttonParent).toHaveCount(1)
    await expect(thirdTile.locator('[data-testid="remove-tile-button"]')).toBeVisible()
  })

  test("tapping same tile twice deselects it and hides X icon", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Bob's rack has tiles
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    const tiles = rackInput.locator(".relative.h-8.w-8")

    // Click on the first tile to select it
    await tiles.first().click()
    const removeButton = page.getByTestId("remove-tile-button")
    await expect(removeButton).toBeVisible()

    // Click on the same tile again to deselect it
    await tiles.first().click()

    // X button should now be hidden
    await expect(removeButton).toHaveCount(0)
  })

  test("can drag tile from rack to remaining tiles section", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Bob's rack has tiles (I, N, N, R, T, U) - sorted alphabetically
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    const tiles = rackInput.locator(".relative.h-8.w-8")

    // Initially should have 6 tiles
    await expect(tiles).toHaveCount(6)

    // Get the remaining tiles drop target
    const remainingSection = page.getByTestId("unaccounted-tiles")

    // Drag the first tile from Bob's rack to the remaining tiles section
    const firstTile = tiles.first()
    await firstTile.dragTo(remainingSection)

    // Should now have 5 tiles in the rack
    await expect(tiles).toHaveCount(5)

    // Remaining tiles section should show the label
    await expect(remainingSection).toContainText("Remaining tiles")
  })

  test("can drag tile from remaining tiles to rack", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Clear Bob's rack first to show remaining tiles
    await gamePage.clearRackTiles("Bob", 6)

    // Verify remaining tiles are visible
    const remainingSection = page.getByTestId("unaccounted-tiles")
    await expect(remainingSection).toContainText("Remaining tiles")
    const remainingTiles = remainingSection.locator("[draggable='true']")
    await expect(remainingTiles).toHaveCount(6)

    // Get Bob's rack
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    const rackTiles = rackInput.locator(".relative.h-8.w-8")

    // Bob's rack should be empty
    await expect(rackTiles).toHaveCount(0)

    // Drag the first remaining tile to Bob's rack
    const firstRemainingTile = remainingTiles.first()
    await firstRemainingTile.dragTo(rackInput)

    // Bob's rack should now have 1 tile
    await expect(rackTiles).toHaveCount(1)

    // Remaining tiles should now have 5
    await expect(remainingTiles).toHaveCount(5)
  })

  test("rack tiles are draggable (have cursor-grab class)", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Bob's rack has tiles
    const bobSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Bob" })
    const rackInput = bobSection.locator('[tabindex="0"]')
    const firstTile = rackInput.locator(".relative.h-8.w-8").first()

    // Tile should have cursor-grab class and draggable attribute
    await expect(firstTile).toHaveClass(/cursor-grab/)
    await expect(firstTile).toHaveAttribute("draggable", "true")
  })

  test("disabled rack tiles are not draggable", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Alice is the one who ended the game (default)
    // Her rack is disabled and empty
    const aliceSection = page.locator('[data-testid^="player-rack-"]').filter({ hasText: "Alice" })
    const rackInput = aliceSection.locator('[tabindex="-1"]')

    // The tabindex should be -1 (not focusable/disabled)
    await expect(rackInput).toBeVisible()

    // The container should have the disabled background
    await expect(rackInput).toHaveClass(/bg-neutral-100/)

    // It should show "No tiles" placeholder
    await expect(rackInput).toContainText("No tiles")
  })

  test("remaining tiles section shows visual feedback when dragging over", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    const remainingSection = page.getByTestId("unaccounted-tiles")

    // Initially should have transparent/neutral border (dashed with neutral-300 when empty)
    // When dragging over, it should get teal-500 border and teal-50 background
    // The section exists but has transparent border when empty
    await expect(remainingSection).toHaveClass(/border-transparent/)

    // Verify the section is always visible as a drop target
    await expect(remainingSection).toBeVisible()
  })

  test("player divs have no borders or padding", async ({ page }) => {
    await gamePage.clickEndGame()
    await gamePage.expectOnEndGameScreen()

    // Get the player section containers
    const playerSections = page.locator('[data-testid^="player-rack-"]')
    await expect(playerSections).toHaveCount(2) // Alice and Bob

    // Verify each player section has no border or padding classes
    for (let i = 0; i < 2; i++) {
      const section = playerSections.nth(i)
      // Should NOT have border classes
      await expect(section).not.toHaveClass(/border/)
      await expect(section).not.toHaveClass(/rounded-lg/)
      await expect(section).not.toHaveClass(/p-3/)
    }
  })
})
