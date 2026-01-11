import { describe, it, expect } from "vitest"
import { darkenColor } from "./utils"

describe("darkenColor", () => {
  it("darkens a hex color by default factor", () => {
    // Blue: #3B82F6 (59, 130, 246)
    // Darkened by 0.7: (41, 91, 172) = #295bac
    expect(darkenColor("#3B82F6")).toBe("#295bac")
  })

  it("darkens a hex color by custom factor", () => {
    // White: #FFFFFF (255, 255, 255)
    // Darkened by 0.5: (128, 128, 128) = #808080
    expect(darkenColor("#FFFFFF", 0.5)).toBe("#808080")
  })

  it("handles lowercase hex", () => {
    expect(darkenColor("#ffffff", 0.5)).toBe("#808080")
  })

  it("returns black when factor is 0", () => {
    expect(darkenColor("#FF0000", 0)).toBe("#000000")
  })

  it("returns same color when factor is 1", () => {
    expect(darkenColor("#3B82F6", 1)).toBe("#3b82f6")
  })
})
