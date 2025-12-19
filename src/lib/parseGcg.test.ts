import { describe, expect, it } from 'vitest'
import { parseGcg, parsePosition } from './parseGcg'

describe('parsePosition', () => {
  it('parses vertical position (letter-number format)', () => {
    // H4 = vertical, column H (index 7), starting row 4 (index 3)
    expect(parsePosition('H4')).toEqual({ row: 3, col: 7, direction: 'vertical' })
  })

  it('parses horizontal position (number-letter format)', () => {
    // 4H = horizontal, row 4 (index 3), starting column H (index 7)
    expect(parsePosition('4H')).toEqual({ row: 3, col: 7, direction: 'horizontal' })
  })

  it('parses position at row 1, column A', () => {
    // A1 = vertical at column A, row 1
    expect(parsePosition('A1')).toEqual({ row: 0, col: 0, direction: 'vertical' })
    // 1A = horizontal at row 1, column A
    expect(parsePosition('1A')).toEqual({ row: 0, col: 0, direction: 'horizontal' })
  })

  it('parses position at row 15, column O', () => {
    // O15 = vertical at column O, row 15
    expect(parsePosition('O15')).toEqual({ row: 14, col: 14, direction: 'vertical' })
    // 15O = horizontal at row 15, column O
    expect(parsePosition('15O')).toEqual({ row: 14, col: 14, direction: 'horizontal' })
  })

  it('parses double-digit rows', () => {
    // A10 = vertical at column A, row 10
    expect(parsePosition('A10')).toEqual({ row: 9, col: 0, direction: 'vertical' })
    // 10A = horizontal at row 10, column A
    expect(parsePosition('10A')).toEqual({ row: 9, col: 0, direction: 'horizontal' })
  })
})

describe('parseGcg', () => {
  it('parses player pragmas', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta`

    const result = parseGcg(gcg)

    expect(result.player1).toEqual({ nickname: 'Yorra', name: 'Wayne Yorra' })
    expect(result.player2).toEqual({ nickname: 'Cresta', name: 'Michael Cresta' })
  })

  it('parses title and description', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
#title 830 point club game
#description Oct 12, 2006 - Lexington MA Club game`

    const result = parseGcg(gcg)

    expect(result.title).toBe('830 point club game')
    expect(result.description).toBe('Oct 12, 2006 - Lexington MA Club game')
  })

  it('parses a simple play move', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
>Yorra: DEJOSTU H4 JOUSTED +96 96`

    const result = parseGcg(gcg)

    expect(result.moves).toHaveLength(1)
    // H4 = vertical at column H (index 7), starting row 4 (index 3)
    // JOUSTED covers rows 4-10 (indices 3-9), passing through center at row 8 (index 7)
    expect(result.moves[0]).toEqual({
      player: 'Yorra',
      rack: 'DEJOSTU',
      type: 'play',
      position: { row: 3, col: 7, direction: 'vertical' },
      word: 'JOUSTED',
      score: 96,
      cumulative: 96,
    })
  })

  it('parses a horizontal play move', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
>Yorra: ADIKLLY 9A LADYLIKE +73 169`

    const result = parseGcg(gcg)

    // 9A = horizontal at row 9 (index 8), starting column A (index 0)
    const move = result.moves[0]
    expect(move.type).toBe('play')
    if (move.type === 'play') {
      expect(move.position).toEqual({ row: 8, col: 0, direction: 'horizontal' })
    }
  })

  it('parses an exchange move', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
>Cresta: E - +0 0`

    const result = parseGcg(gcg)

    expect(result.moves[0]).toEqual({
      player: 'Cresta',
      rack: 'E',
      type: 'exchange',
      score: 0,
      cumulative: 0,
    })
  })

  it('parses a move with a blank tile (lowercase)', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
>Yorra: ACEMRT? 7H SCAMsTER +65 285`

    const result = parseGcg(gcg)

    // 7H = horizontal at row 7 (index 6), starting column H (index 7)
    expect(result.moves[0]).toEqual({
      player: 'Yorra',
      rack: 'ACEMRT?',
      type: 'play',
      position: { row: 6, col: 7, direction: 'horizontal' },
      word: 'SCAMsTER',
      score: 65,
      cumulative: 285,
    })
  })

  it('parses challenge withdrawal (double dash)', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
>Yorra: ELNNOSS -- -70 455`

    const result = parseGcg(gcg)

    expect(result.moves[0]).toEqual({
      player: 'Yorra',
      rack: 'ELNNOSS',
      type: 'challenge',
      score: -70,
      cumulative: 455,
    })
  })

  it('parses end-game scoring with tiles in parentheses', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
>Cresta" (LN) +4 830`

    const result = parseGcg(gcg)

    expect(result.moves[0]).toEqual({
      player: 'Cresta',
      type: 'end',
      tiles: 'LN',
      score: 4,
      cumulative: 830,
    })
  })

  it('parses multiple moves in sequence', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
>Yorra: DEJOSTU H4 JOUSTED +96 96
>Cresta: E - +0 0
>Yorra: ADIKLLY 9A LADYLIKE +73 169`

    const result = parseGcg(gcg)

    expect(result.moves).toHaveLength(3)
    expect(result.moves[0].player).toBe('Yorra')
    expect(result.moves[1].player).toBe('Cresta')
    expect(result.moves[2].player).toBe('Yorra')
  })

  it('ignores #note lines', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
>Cresta: E - +0 0
#note - Cresta exchanged 7`

    const result = parseGcg(gcg)

    expect(result.moves).toHaveLength(1)
  })

  it('parses the full Cresta-Yorra game', () => {
    const gcg = `#player1 Yorra Wayne Yorra
#player2 Cresta Michael Cresta
#title 830 point club game
#description Oct 12, 2006 - Lexington MA Club game
>Yorra: DEJOSTU H4 JOUSTED +96 96
>Cresta: E - +0 0
>Yorra: ADIKLLY 9A LADYLIKE +73 169
>Cresta: AFFHIST A8 FLATFISH +239 239
>Yorra: EEGIN - +0 169
>Cresta: E - +0 0
>Yorra: EEGIN D8 EYEING +22 191
>Cresta: E - +0 0
>Yorra: AW B9 AWA +29 220
>Cresta: AO 10G ADO +10 249
>Yorra: ACEMRT? 7H SCAMsTER +65 285
>Cresta: IQUXY - +0 249
>Yorra: DDEGNRU 5B UNDERDOG +72 347
>Cresta: IOQTUXY O1 QUIXOTRY +365 614
>Yorra: AN - +0 347
>Cresta: E - +0 0
>Yorra: AN N4 AN +13 370
>Cresta: OP 6A OP +20 634
>Yorra: COR M2 COR +20 390
>Cresta: ABET D1 BATED +22 656
>Yorra: EELP 1D BLEEP +27 417
>Cresta: EIMT 11I MITE +16 672
>Yorra: BNU 3A BUNT +12 429
>Cresta: AZ 6J ZA +66 738
>Yorra: AHIR 12L HAIR +26 455
>Cresta: OWV? O11 VROWs +30 768
>Yorra: ELNNOSS 13F NONLESS +70 525
>Yorra: ELNNOSS -- -70 455
>Cresta: ORV 14L VROW +20 788
>Yorra: ELNNOSS 5K NO +14 469
>Cresta: EEGIIIR A1 GIBE +24 812
>Yorra: ENLSS 11F ES +9 478
>Cresta: EIIR 15A HEIR +8 820
>Yorra: NLS J6 ZAS +12 490
>Cresta: I M12 AIR +6 826
>Cresta" (LN) +4 830`

    const result = parseGcg(gcg)

    expect(result.player1.name).toBe('Wayne Yorra')
    expect(result.player2.name).toBe('Michael Cresta')
    expect(result.title).toBe('830 point club game')

    // Check final move
    const lastMove = result.moves[result.moves.length - 1]
    expect(lastMove.cumulative).toBe(830)

    // Check that we parsed all moves
    expect(result.moves.length).toBeGreaterThan(30)
  })
})
