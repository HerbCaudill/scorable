import { tileValues } from "./tileValues"

export const getTileValue = (letter: string): number => tileValues[letter.toUpperCase()] ?? 0
