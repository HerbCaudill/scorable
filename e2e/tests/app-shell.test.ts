import { expect, test } from "@playwright/test"
import { seedGame } from "../fixtures/seed-game"
import { GamePage } from "../pages/game.page"
import { PlayerSetupPage } from "../pages/player-setup.page"

test("keeps the game header at the top while history scrolls and dialogs open", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedGame(page, {
    playerNames: ["Alice", "Bob"],
    moves: Array.from({ length: 50 }, (_, index) => ({ playerIndex: index % 2, tilesPlaced: [] })),
  })
  const header = page.getByRole("banner")
  await expect(header.getByRole("button", { name: "Back" })).toBeVisible()
  expect((await header.boundingBox())?.y).toBe(0)
  expect((await header.boundingBox())?.width).toBe(390)
  const scrolled = await page
    .getByRole("region", { name: "Alice's score panel" })
    .evaluate(element => {
      const history = Array.from(element.querySelectorAll<HTMLElement>("div")).find(
        child => getComputedStyle(child).overflowY === "auto",
      )!
      history.scrollTop = history.scrollHeight
      return history.scrollTop
    })
  expect(scrolled).toBeGreaterThan(0)
  expect((await header.boundingBox())?.y).toBe(0)
  await page.getByRole("button", { name: "Delete", exact: true }).click()
  await expect(page.getByRole("alertdialog")).toBeVisible()
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await header.getByRole("button", { name: "Back" }).click()
  await expect(page.getByRole("heading", { name: "Scorable" })).toBeVisible()
})

test("protects player entry until game creation saves it", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "New game" }).click()
  const setup = new PlayerSetupPage(page)
  await setup.addNewPlayer(0, "Alice")
  expect(
    await page.evaluate(
      () => !window.dispatchEvent(new Event("beforeunload", { cancelable: true })),
    ),
  ).toBe(true)
  await setup.addNewPlayer(1, "Bob")
  await setup.startGame()
  await expect(page.getByRole("grid", { name: "Scrabble board" })).toBeVisible()
  expect(
    await page.evaluate(() =>
      window.dispatchEvent(new Event("beforeunload", { cancelable: true })),
    ),
  ).toBe(true)
})

test("protects an uncommitted move and clears the guard after committing it", async ({ page }) => {
  await seedGame(page, { playerNames: ["Alice", "Bob"] })
  const game = new GamePage(page)
  await game.clickCell(7, 7)
  await game.typeLetters("CAT")
  expect(
    await page.evaluate(
      () => !window.dispatchEvent(new Event("beforeunload", { cancelable: true })),
    ),
  ).toBe(true)
  await game.pressKey("Enter")
  await expect(page.getByRole("region", { name: "Bob's score panel" })).toHaveAttribute(
    "aria-current",
    "true",
  )
  expect(
    await page.evaluate(() =>
      window.dispatchEvent(new Event("beforeunload", { cancelable: true })),
    ),
  ).toBe(true)
})
