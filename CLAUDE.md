# Scrabble score-keeping app

An app for keeping score during Scrabble games.

## Quick reference

| Command          | Purpose                |
| ---------------- | ---------------------- |
| `pnpm dev`       | Start dev server       |
| `pnpm test`      | Run Vitest tests       |
| `pnpm test:pw`   | Run Playwright tests   |
| `pnpm storybook` | Component development  |
| `pnpm build`     | Production build       |
| `pnpm format`    | Format code (Prettier) |

## Project structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui primitives (Button, Input, Dropdown, Select)
│   ├── App.tsx          # Root component with screen routing
│   ├── HomeScreen.tsx   # Welcome screen, past games, resume/new game
│   ├── PlayerSetupScreen.tsx  # Player selection (2-4 players)
│   ├── GameScreen.tsx   # Main gameplay: board, timers, scoring, history
│   ├── ScrabbleBoard.tsx  # 15x15 interactive board with multipliers
│   ├── EndGameScreen.tsx  # End game flow with rack input and adjustments
│   ├── MoveHistoryList.tsx  # Move history with edit support via long-press
│   ├── PastGameScreen.tsx  # View completed games
│   ├── TileBagScreen.tsx  # Display remaining tiles
│   ├── Timer.tsx        # Player timer with visual progress
│   ├── Tile.tsx         # Individual tile display
│   ├── ConfirmDialog.tsx  # Confirmation dialogs for pass/end game
│   └── RackTileInput.tsx  # Keyboard input for rack tiles
├── lib/                 # Business logic & types
│   ├── types.ts         # All type definitions (Game, Move, Player, etc.)
│   ├── gameStore.ts     # Zustand store with persistence
│   ├── calculateMoveScore.ts  # Scoring with multipliers & bingo bonus
│   ├── calculateEndGameAdjustments.ts  # End game score adjustments
│   ├── validateMove.ts  # Move validation rules
│   ├── validateRackTiles.ts  # Validate rack tiles against remaining tiles
│   ├── checkTileOveruse.ts  # Detect when tiles exceed available supply
│   ├── parseGcg.ts      # Parse GCG (game notation) files
│   ├── tileValues.ts    # Standard Scrabble letter values
│   ├── constants.ts     # Tile distribution and game constants
│   ├── repo.ts          # Automerge-repo setup for local-first sync
│   └── useGame.ts       # React hook for game state
├── stories/             # Storybook files for component development
└── index.css            # Tailwind config, custom colors, fonts
e2e/                     # Playwright end-to-end tests
├── tests/               # Test specs (game-flow, scoring, persistence, etc.)
├── pages/               # Page objects for test abstraction
├── fixtures/            # Test fixtures and helpers
└── games/               # GCG game files for score verification
spec/                    # Specification and wireframes
```

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Zustand** for state management (persists to localStorage)
- **Automerge** for local-first sync and sharing via URL
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives)
- **Vitest** for unit testing, **Playwright** for e2e, **Storybook** for components

## Key types (`src/lib/types.ts`)

```typescript
type Move = Array<{ row: number; col: number; tile: string }>
type GameMove = { playerIndex: number; tilesPlaced: Move }
type BoardState = Array<Array<string | null>> // 15x15 grid
type GameStatus = "setup" | "playing" | "paused" | "finished"
type Player = { name: string; timeRemainingMs: number; color: string }
```

## State management (`src/lib/gameStore.ts`)

Zustand store with actions:

- `startGame(playerNames)` / `endGame()` / `pauseGame()` / `resumeGame()`
- `commitMove(move)` - validates, scores, updates board, advances turn
- `editMove(moveIndex, move)` - correct a previous move
- `startTimer()` / `stopTimer()` / `updatePlayerTime()`
- `applyEndGameAdjustments(racks)` - calculate final score adjustments
- Player records persisted for autocomplete

## Scoring logic (`src/lib/calculateMoveScore.ts`)

- Letter multipliers: DL (2x), TL (3x)
- Word multipliers: DW (2x), TW (3x)
- Multipliers only apply to newly placed tiles
- Cross words scored automatically
- 50-point bingo bonus for 7-tile moves
- Blank tiles (space) = 0 points

## Board interaction (`src/components/ScrabbleBoard.tsx`)

- Click to place cursor, type letters to place tiles
- Arrow keys change direction, Backspace removes tiles
- Space key places blank tile, Enter commits move
- Teal = current move tiles, Amber = existing tiles
- Visual multiplier indicators (dots, bulls-eye for center)

## Move validation rules (`src/lib/validateMove.ts`)

1. First move must include center square (7,7)
2. All tiles must be in a single line (horizontal OR vertical)
3. Subsequent moves must connect to existing tiles
4. No gaps allowed in words

## Move correction

Long-press on a move in the history to edit it. The board shows the state before that move, allowing tile placement corrections.

## Ending vs quitting games

Games can be ended or quit depending on how many tiles remain:

- **End** (tiles <= threshold): Shows when few tiles remain. Goes to EndGameScreen for rack entry and final adjustments. Game becomes "finished" and appears in Past games.
- **Quit** (tiles > threshold): Shows when many tiles remain. Stops timer and exits to home. Game stays "active" and can be resumed or deleted later.

The threshold is `(playerCount - 1) * 7` tiles (e.g., 7 tiles for 2 players).

## End game flow

When a player goes out or the game ends normally:

1. Enter remaining tiles on each player's rack
2. System validates racks against remaining tiles
3. Final adjustments: player who went out gets sum of opponents' rack values

## Testing

- **Unit tests**: `src/lib/*.test.ts` - scoring, validation, end game adjustments
- **E2E tests**: `e2e/tests/*.test.ts` - game flow, persistence, score verification against GCG files

Run `pnpm test` for unit tests, `pnpm test:pw` for Playwright.
