// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest"
import { StrictMode } from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import type { RegisterSWOptions } from "vite-plugin-pwa/types"

const { registerSW, update } = vi.hoisted(() => ({ registerSW: vi.fn(), update: vi.fn() }))
vi.mock("virtual:pwa-register", () => ({ registerSW }))
import { UpdateNotice } from "../UpdateNotice"

let options: RegisterSWOptions
const save = vi.fn()

beforeEach(() => {
  vi.stubGlobal("location", { reload: vi.fn() })
  save.mockReset().mockResolvedValue(undefined)
  update.mockReset().mockResolvedValue(undefined)
  registerSW.mockReset().mockImplementation((next: RegisterSWOptions) => {
    options = next
    return update
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("downloads an update without reloading and applies it with one click after saving", async () => {
  render(
    <StrictMode>
      <UpdateNotice beforeReload={save} />
    </StrictMode>,
  )
  expect(registerSW).toHaveBeenCalledOnce()
  expect(screen.queryByRole("button", { name: "Update now" })).not.toBeInTheDocument()
  act(() => options.onNeedRefresh?.())
  expect(screen.getByRole("status")).toHaveTextContent("An update is ready.")
  expect(update).not.toHaveBeenCalled()
  expect(location.reload).not.toHaveBeenCalled()
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  expect(save).toHaveBeenCalledOnce()
  expect(update).toHaveBeenCalledExactlyOnceWith(true)
  expect(screen.getByRole("button", { name: "Updating…" })).toBeDisabled()
  await act(async () => options.onNeedReload?.())
  expect(save).toHaveBeenCalledTimes(2)
  expect(location.reload).toHaveBeenCalledOnce()
})

it("keeps a draft open until its leave guard clears", async () => {
  render(<UpdateNotice beforeReload={save} />)
  act(() => options.onNeedRefresh?.())
  /** Protect unsaved changes. */
  const guard = (event: Event) => event.preventDefault()
  window.addEventListener("beforeunload", guard)
  try {
    fireEvent.click(screen.getByRole("button", { name: "Update now" }))
    expect(update).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Finish or cancel your changes, then try again.",
    )
  } finally {
    window.removeEventListener("beforeunload", guard)
  }
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  expect(update).toHaveBeenCalledOnce()
})

it("leaves this window open when another window activates an update", async () => {
  render(<UpdateNotice beforeReload={save} />)
  await act(async () => options.onNeedReload?.())
  expect(screen.getByRole("button", { name: "Update now" })).toBeEnabled()
  expect(update).not.toHaveBeenCalled()
  expect(location.reload).not.toHaveBeenCalled()
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  expect(save).toHaveBeenCalledOnce()
  expect(location.reload).toHaveBeenCalledOnce()
})

it("protects new changes made while the worker activates", async () => {
  render(<UpdateNotice beforeReload={save} />)
  act(() => options.onNeedRefresh?.())
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  /** Protect a new draft. */
  const guard = (event: Event) => event.preventDefault()
  window.addEventListener("beforeunload", guard)
  try {
    await act(async () => options.onNeedReload?.())
    expect(location.reload).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("Finish or cancel your changes")
  } finally {
    window.removeEventListener("beforeunload", guard)
  }
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  expect(location.reload).toHaveBeenCalledOnce()
  expect(update).toHaveBeenCalledOnce()
})

it("offers a retry when activating the update fails", async () => {
  update.mockRejectedValueOnce(new Error("Update unavailable"))
  render(<UpdateNotice beforeReload={save} />)
  act(() => options.onNeedRefresh?.())
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  expect(screen.getByRole("alert")).toHaveTextContent("Could not install the update. Try again.")
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  expect(update).toHaveBeenCalledTimes(2)
})

it("keeps the app open when local saving fails", async () => {
  save.mockRejectedValueOnce(new Error("Storage unavailable"))
  render(<UpdateNotice beforeReload={save} />)
  act(() => options.onNeedRefresh?.())
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  expect(update).not.toHaveBeenCalled()
  expect(location.reload).not.toHaveBeenCalled()
  expect(screen.getByRole("alert")).toHaveTextContent("Could not install the update. Try again.")
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Update now" })))
  expect(update).toHaveBeenCalledOnce()
})
