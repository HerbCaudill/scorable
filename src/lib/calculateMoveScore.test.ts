import { describe, expect, it } from 'vitest'
import { BINGO_BONUS, calculateMoveScore } from './calculateMoveScore'
import type { BoardState, Move } from './types'
import { createEmptyBoard } from './types'

describe('calculateMoveScore', () => {
  describe('basic scoring', () => {
    it('scores a single tile extending an existing word', () => {
      const board = parseBoard(`
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · ○ · · · ○ · ○ · · · ○ · ·
        ⏺︎ · · ○ · · · C A T · ○ · · ⏺︎
        · · ○ · · · ○ · ○ · · · ○ · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
      `)
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · S · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      expect(score).toBe(6)
    })

    it('scores a simple horizontal word', () => {
      const board = createEmptyBoard()
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · C A T · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // C=3, A=1, T=1, center is DW so word doubles
      // (3 + 1 + 1) * 2 = 10
      expect(score).toBe(10)
    })

    it('scores a simple vertical word', () => {
      const board = createEmptyBoard()
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · C · · · · · · ·
        · · · · · · · A · · · · · · ·
        · · · · · · · T · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // C=3, A=1, T=1, center is DW so word doubles
      // (3 + 1 + 1) * 2 = 10
      expect(score).toBe(10)
    })
  })

  describe('letter multipliers', () => {
    it('applies double letter score', () => {
      // DL is at (0, 3)
      const board = parseBoard(`
        ⏺︎ · · ○ O G · ⏺︎ · · · ○ · · ⏺︎
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · ○ · · · ○ · ○ · · · ○ · ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · · ○ · · · ○ · ○ · · · ○ · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
      `)
      const move = parseMove(`
        · · · D · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // D=2 (doubled to 4) + O=1 + G=2 = 7
      expect(score).toBe(7)
    })

    it('applies triple letter score', () => {
      // TL is at (1, 5)
      const board = parseBoard(`
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · ⏺︎ · · · ○ I · · ○ · · · ⏺︎ ·
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · ○ · · · ○ · ○ · · · ○ · ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · · ○ · · · ○ · ○ · · · ○ · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
      `)
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · Q · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // Q=10 (tripled to 30) + I=1 = 31
      expect(score).toBe(31)
    })
  })

  describe('word multipliers', () => {
    it('applies double word score', () => {
      // DW is at (1, 1)
      const board = createEmptyBoard()
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · A T · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // A=1 + T=1 = 2, doubled = 4
      expect(score).toBe(4)
    })

    it('applies triple word score', () => {
      // TW is at (0, 0)
      const board = createEmptyBoard()
      const move = parseMove(`
        A T · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // A=1 + T=1 = 2, tripled = 6
      expect(score).toBe(6)
    })

    it('applies multiple word multipliers', () => {
      // DW at (4,4) and (4,10)
      const board = createEmptyBoard()
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · A B C D E F G · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // A=1, B=3, C=3, D=2, E=1, F=4, G=2 = 16
      // Two DW squares: 16 * 2 * 2 = 64
      // Plus bingo bonus (7 tiles): 64 + 50 = 114
      expect(score).toBe(114)
    })
  })

  describe('cross words', () => {
    it('scores perpendicular words formed by the move', () => {
      // Existing word "CAT" horizontally at row 7
      // Play 'B' at (6,8) to form "BA" vertically (B above A)
      const board = parseBoard(`
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · ○ · · · ○ · ○ · · · ○ · ·
        ⏺︎ · · ○ · · · C A T · ○ · · ⏺︎
        · · ○ · · · ○ · ○ · · · ○ · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
      `)
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · B · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // B at (6,8) is on DL: B=3*2=6, A=1 = 7
      expect(score).toBe(7)
    })

    it('scores multiple cross words', () => {
      // Existing horizontal word "CAT" at row 7
      // Play 'B' at (6,8) and 'E' at (8,8), forming "BAE" vertically
      const board = parseBoard(`
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · ○ · · · ○ · ○ · · · ○ · ·
        ⏺︎ · · ○ · · · C A T · ○ · · ⏺︎
        · · ○ · · · ○ · ○ · · · ○ · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
      `)
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · B · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · E · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // Main word "BAE": B at DL (6,8)=3*2=6, A=1, E at DL (8,8)=1*2=2 = 9
      expect(score).toBe(9)
    })

    it('applies letter multipliers to cross words', () => {
      // DL at (6, 6)
      const board = parseBoard(`
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · ○ · · · ○ O T · · · ○ · ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · · ○ · · · ○ · ○ · · · ○ · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
      `)
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · D · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // D at DL = 2*2=4, O=1, T=1 = 6
      expect(score).toBe(6)
    })

    it('applies word multipliers only to new words', () => {
      // Play 'C' at center (7,7) which is DW, forming "CAT"
      const board = parseBoard(`
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · ○ · · · ○ · ○ · · · ○ · ·
        ⏺︎ · · ○ · · · ⏺︎ A T · ○ · · ⏺︎
        · · ○ · · · ○ · ○ · · · ○ · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
      `)
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · C · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // C=3 + A=1 + T=1 = 5, center is DW so *2 = 10
      expect(score).toBe(10)
    })
  })

  describe('blank tiles', () => {
    it('scores blank tiles as 0 points', () => {
      const board = createEmptyBoard()
      // Note: using space ' ' for blank tile in the move
      const move: Move = [
        { row: 7, col: 7, tile: 'C' },
        { row: 7, col: 8, tile: ' ' }, // Blank
        { row: 7, col: 9, tile: 'T' },
      ]

      const score = calculateMoveScore({ move, board })
      // C=3, blank=0, T=1, center DW so *2 = 8
      expect(score).toBe(8)
    })
  })

  describe('bingo bonus', () => {
    it('adds 50 points for using all 7 tiles', () => {
      const board = createEmptyBoard()
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · S C R A B L E · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // S=1, C=3, R=1, A=1, B=3, L=1, E=1 = 11
      // Center is DW: 11 * 2 = 22
      // Bingo bonus: 22 + 50 = 72
      expect(score).toBe(72)
    })

    it('does not add bonus for fewer than 7 tiles', () => {
      const board = createEmptyBoard()
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · C A T S U P · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // 6 tiles, no bingo bonus
      // C=3, A=1, T=1, S=1, U=1 (DL at 7,11 = 2), P=3 = 11
      // DW at center: 11 * 2 = 22
      expect(score).toBe(22)
    })
  })

  describe('edge cases', () => {
    it('returns 0 for empty move', () => {
      const board = createEmptyBoard()
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      expect(score).toBe(0)
    })

    it('handles single tile extending existing word', () => {
      // "CAT" exists, add 'S' to make "CATS"
      const board = parseBoard(`
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · ○ · · · ○ · ○ · · · ○ · ·
        ⏺︎ · · ○ · · · C A T · ○ · · ⏺︎
        · · ○ · · · ○ · ○ · · · ○ · ·
        · ○ · · · ○ · · · ○ · · · ○ ·
        · · · · ⏺︎ · · · · · ⏺︎ · · · ·
        ○ · · ⏺︎ · · · ○ · · · ⏺︎ · · ○
        · · ⏺︎ · · · ○ · ○ · · · ⏺︎ · ·
        · ⏺︎ · · · ○ · · · ○ · · · ⏺︎ ·
        ⏺︎ · · ○ · · · ⏺︎ · · · ○ · · ⏺︎
      `)
      const move = parseMove(`
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · S · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
        · · · · · · · · · · · · · · ·
      `)

      const score = calculateMoveScore({ move, board })
      // C=3 + A=1 + T=1 + S=1 = 6
      // No multipliers (S is on a regular square at 7,10)
      expect(score).toBe(6)
    })
  })

  describe('BINGO_BONUS constant', () => {
    it('exports BINGO_BONUS as 50', () => {
      expect(BINGO_BONUS).toBe(50)
    })
  })
})

// HELPERS

/** Parse a visual grid string and call a handler for each tile found */
const parseGrid = (gridStr: string, onTile: (row: number, col: number, tile: string) => void): void => {
  const lines = gridStr.trim().split('\n')
  for (let row = 0; row < lines.length; row++) {
    const cells = lines[row].trim().split(/\s+/)
    for (let col = 0; col < cells.length; col++) {
      const cell = cells[col]
      // Only treat alphabetical characters as tiles
      if (/^[A-Za-z]$/.test(cell)) {
        onTile(row, col, cell)
      }
    }
  }
}

/** Parse a board string into a BoardState */
const parseBoard = (boardStr: string): BoardState => {
  const board = createEmptyBoard()
  parseGrid(boardStr, (row, col, tile) => {
    board[row][col] = tile
  })
  return board
}

/** Parse a move string into tiles placed array */
const parseMove = (moveStr: string): Move => {
  const tiles: Move = []
  parseGrid(moveStr, (row, col, tile) => {
    tiles.push({ row, col, tile })
  })
  return tiles
}
