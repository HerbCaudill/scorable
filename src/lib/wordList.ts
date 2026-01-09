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
