import csw21 from "@herbcaudill/scrabble-words/csw21"
import type { Word } from "@herbcaudill/scrabble-words"

// Build a Set for O(1) word lookups
const validWords = new Set<string>((csw21 as Word[]).map(w => w.word.toUpperCase()))

/**
 * Check if a word is valid according to CSW21.
 * @param word - The word to check (case-insensitive)
 * @returns true if the word is valid
 */
export const isValidWord = (word: string): boolean => {
  return validWords.has(word.toUpperCase())
}

/**
 * Get the definition for a word.
 * @param word - The word to look up (case-insensitive)
 * @returns The word entry with definitions, or undefined if not found
 */
export const getWordDefinition = (word: string): Word | undefined => {
  const upperWord = word.toUpperCase()
  return (csw21 as Word[]).find(w => w.word.toUpperCase() === upperWord)
}

export type WordDefinitionResult = {
  word: string
  baseWord?: string
  definitions: Word["definitions"]
}

/**
 * Get the definition for a word, following crossRef links if needed.
 * When a word has no definitions but has a crossRef, this will look up
 * the base word and return its definitions.
 * @param word - The word to look up (case-insensitive)
 * @returns The word with definitions (possibly from base word), or undefined if not found
 */
export const getWordDefinitionWithFallback = (word: string): WordDefinitionResult | undefined => {
  const entry = getWordDefinition(word)
  if (!entry) return undefined

  // If the word has definitions, return them
  if (entry.definitions.length > 0) {
    return {
      word: entry.word,
      definitions: entry.definitions,
    }
  }

  // If the word has no definitions but has a crossRef, look up the base word
  if (entry.crossRef) {
    const baseEntry = getWordDefinition(entry.crossRef.word)
    if (baseEntry && baseEntry.definitions.length > 0) {
      return {
        word: entry.word,
        baseWord: baseEntry.word,
        definitions: baseEntry.definitions,
      }
    }
  }

  // Fallback: return the original entry even though it has no definitions
  return {
    word: entry.word,
    definitions: entry.definitions,
  }
}
