import { describe, it, expect } from "vitest"
import { getWordDefinition, getWordDefinitionWithFallback } from "./wordList"

describe("getWordDefinition", () => {
  it("should return definition for base word", () => {
    const entry = getWordDefinition("AAH")
    expect(entry).toBeDefined()
    expect(entry?.definitions.length).toBeGreaterThan(0)
  })

  it("should return entry for word form with crossRef", () => {
    const entry = getWordDefinition("AAHED")
    expect(entry).toBeDefined()
    expect(entry?.definitions).toEqual([])
    expect(entry?.crossRef).toBeDefined()
    expect(entry?.crossRef?.word).toBe("AAH")
  })
})

describe("getWordDefinitionWithFallback", () => {
  it("should return base word definition when word has no definitions", () => {
    const result = getWordDefinitionWithFallback("AAHED")
    expect(result).toBeDefined()
    expect(result?.word).toBe("AAHED")
    expect(result?.baseWord).toBe("AAH")
    expect(result?.definitions.length).toBeGreaterThan(0)
    expect(result?.definitions[0].text).toContain("surprise")
  })

  it("should return original word definition when it has definitions", () => {
    const result = getWordDefinitionWithFallback("AAH")
    expect(result).toBeDefined()
    expect(result?.word).toBe("AAH")
    expect(result?.baseWord).toBeUndefined()
    expect(result?.definitions.length).toBeGreaterThan(0)
  })

  it("should return undefined for invalid word", () => {
    const result = getWordDefinitionWithFallback("ZZZZZZ")
    expect(result).toBeUndefined()
  })

  it("should handle case-insensitive lookups", () => {
    const result = getWordDefinitionWithFallback("aahed")
    expect(result).toBeDefined()
    expect(result?.word).toBe("AAHED")
    expect(result?.baseWord).toBe("AAH")
  })
})
