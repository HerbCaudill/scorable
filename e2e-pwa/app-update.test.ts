import { expect, test } from "@playwright/test"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { GamePage } from "../e2e/pages/game.page"
import { PlayerSetupPage } from "../e2e/pages/player-setup.page"

test("updates with one click while another window keeps its unfinished move", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  // Worker updates bypass Playwright routes, so serve the changed worker from a real server.
  let updated = false
  const server = createServer(async (request, response) => {
    try {
      const upstream = await fetch(new URL(request.url!, baseURL))
      response.statusCode = upstream.status
      response.setHeader("Content-Type", upstream.headers.get("content-type") ?? "text/plain")
      const body = Buffer.from(await upstream.arrayBuffer())
      response.end(
        updated && request.url === "/sw.js"
          ? Buffer.concat([body, Buffer.from("\n// Update test version\n")])
          : body,
      )
    } catch {
      response.writeHead(502).end()
    }
  })
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve))
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  try {
    await page.goto(origin)
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.reload()
    await page.getByRole("button", { name: "New game" }).click()
    const setup = new PlayerSetupPage(page)
    await setup.addNewPlayer(0, "Alice")
    await setup.addNewPlayer(1, "Bob")
    await setup.startGame()
    await expect(page.getByRole("grid", { name: "Scrabble board" })).toBeVisible()
    await expect(page.getByRole("region", { name: "Alice's score panel" })).toBeVisible()

    const other = await context.newPage()
    await other.goto(page.url())
    const otherGame = new GamePage(other)
    await otherGame.clickCell(7, 7)
    await otherGame.typeLetters("CAT")
    await other.evaluate(() => Object.assign(window, { updateTestWindow: "original" }))

    updated = true
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration!.update()
    })
    const notice = page.getByRole("complementary", { name: "App update" })
    await expect(notice.getByRole("button", { name: "Update now" })).toBeVisible()
    const bounds = await notice.boundingBox()
    const viewport = page.viewportSize()!
    expect(bounds!.x).toBeLessThan(viewport.width / 2)
    expect(bounds!.y).toBeGreaterThan(viewport.height / 2)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
    await notice.screenshot({ path: testInfo.outputPath("update-notice.png") })
    await page.evaluate(() => Object.assign(window, { updateTestWindow: "original" }))
    await Promise.all([
      page.waitForEvent("load"),
      notice.getByRole("button", { name: "Update now" }).click(),
    ])
    expect(await page.evaluate(() => "updateTestWindow" in window)).toBe(false)
    await expect(page.getByRole("region", { name: "Alice's score panel" })).toBeVisible()
    expect(await other.evaluate(() => "updateTestWindow" in window)).toBe(true)
    await expect(otherGame.getCellByLabel("H8").getByText("C", { exact: true })).toBeVisible()
    await other.getByRole("button", { name: "Update now" }).click()
    await expect(other.getByRole("alert")).toHaveText(
      "Finish or cancel your changes, then try again.",
    )
    for (let index = 0; index < 3; index++) await otherGame.pressKey("Backspace")
    await Promise.all([
      other.waitForEvent("load"),
      other.getByRole("button", { name: "Update now" }).click(),
    ])
    expect(await other.evaluate(() => "updateTestWindow" in window)).toBe(false)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    )
  }
})
