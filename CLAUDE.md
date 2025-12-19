# Scrabble Score-Keeping App

An app for keeping score during Scrabble games.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server |
| `pnpm test` | Run Vitest tests |
| `pnpm storybook` | Component development |
| `pnpm build` | Production build |

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui primitives (Button, Input, Dropdown, Select)
│   ├── App.tsx         # Root component with screen routing
│   ├── HomeScreen.tsx  # Welcome screen, past games, resume/new game
│   ├── PlayerSetupScreen.tsx  # Player selection (2-4 players)
│   ├── GameScreen.tsx  # Main gameplay: board, timers, scoring, history
│   └── ScrabbleBoard.tsx  # 15x15 interactive board with multipliers
├── lib/                # Business logic & types
│   ├── types.ts        # All type definitions (Game, Move, Player, etc.)
│   ├── gameStore.ts    # Zustand store with persistence
│   ├── calculateMoveScore.ts  # Scoring with multipliers & bingo bonus
│   ├── validateMove.ts # Move validation rules
│   ├── tileValues.ts   # Standard Scrabble letter values
│   └── utils.ts        # Class name helpers
├── stories/            # Storybook files for component development
└── index.css           # Tailwind config, custom colors, fonts
spec/                   # Specification and wireframes
```

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Zustand** for state management (persists to localStorage)
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives)
- **Vitest** for testing, **Storybook** for component development

## Key Types (`src/lib/types.ts`)

```typescript
type Move = Array<{ row: number; col: number; tile: string }>
type GameMove = { playerIndex: number; tilesPlaced: Move }
type BoardState = Array<Array<string | null>>  // 15x15 grid
type GameStatus = 'setup' | 'playing' | 'paused' | 'finished'
type Player = { name: string; timeRemainingMs: number; color: string }
```

## State Management (`src/lib/gameStore.ts`)

Zustand store with actions:
- `startGame(playerNames)` / `endGame()` / `pauseGame()` / `resumeGame()`
- `commitMove(move)` - validates, scores, updates board, advances turn
- `startTimer()` / `stopTimer()` / `updatePlayerTime()`
- Player records persisted for autocomplete

## Scoring Logic (`src/lib/calculateMoveScore.ts`)

- Letter multipliers: DL (2x), TL (3x)
- Word multipliers: DW (2x), TW (3x)
- Multipliers only apply to newly placed tiles
- Cross words scored automatically
- 50-point bingo bonus for 7-tile moves
- Blank tiles (space) = 0 points

## Board Interaction (`src/components/ScrabbleBoard.tsx`)

- Click to place cursor, type letters to place tiles
- Arrow keys change direction, Backspace removes tiles
- Space key places blank tile
- Teal = current move tiles, Amber = existing tiles
- Visual multiplier indicators (dots, bulls-eye for center)

## Move Validation Rules (`src/lib/validateMove.ts`)

1. First move must include center square (7,7)
2. All tiles must be in a single line (horizontal OR vertical)
3. Subsequent moves must connect to existing tiles
4. No gaps allowed in words

## Testing

Tests are in `src/lib/*.test.ts`. Run with `pnpm test`.

The main test suite covers score calculation with 30+ test cases for multipliers, cross words, blanks, and bingo bonus.
