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
├── App.tsx              # Root component with screen routing
├── components/          # React components
│   ├── ui/             # shadcn/ui primitives (button, input, select, dialog, alert-dialog, dropdown-menu, sonner)
│   ├── HomeScreen.tsx  # Welcome screen, past games, resume/new game
│   ├── PlayerSetupScreen.tsx  # Player selection (2-4 players)
│   ├── PlayerSetup.tsx # Player name input with autocomplete
│   ├── GameScreen.tsx  # Main gameplay: board, timers, scoring, history
│   ├── ScrabbleBoard.tsx  # 15x15 interactive board with multipliers
│   ├── EndGameScreen.tsx  # End game flow with rack input and adjustments
│   ├── MoveHistoryList.tsx  # Move history with edit support via long-press
│   ├── PastGameScreen.tsx  # View completed games
│   ├── TileBagScreen.tsx  # Display remaining tiles (also UnplayedTilesScreen)
│   ├── StatisticsScreen.tsx  # Game statistics and analytics
│   ├── Timer.tsx       # Player timer with visual progress
│   ├── Tile.tsx        # Individual tile display
│   ├── ConfirmDialog.tsx  # Confirmation dialogs for pass/end game
│   ├── RackTileInput.tsx  # Keyboard input for rack tiles
│   ├── MobileKeyboard.tsx  # On-screen keyboard for mobile devices
│   ├── BlankLetterDialog.tsx  # Dialog for selecting blank tile letter
│   ├── BackButton.tsx  # Navigation back button
│   ├── Header.tsx     # Reusable header with back button, title, and right content
│   ├── SwipeToDelete.tsx  # Swipe gesture component for deleting items
│   └── Histogram.tsx   # Histogram visualization component
├── lib/                # Business logic & types
│   ├── types.ts        # All type definitions (Game, Move, Player, GameMove with challenges, etc.)
│   ├── automergeTypes.ts  # Automerge-specific type definitions
│   ├── gameStore.ts    # Zustand store with persistence
│   ├── localStore.ts   # LocalStorage utilities
│   ├── calculateMoveScore.ts  # Scoring with multipliers & bingo bonus
│   ├── calculateEndGameAdjustments.ts  # End game score adjustments
│   ├── validateMove.ts # Move validation rules
│   ├── validateRackTiles.ts  # Validate rack tiles against remaining tiles
│   ├── checkTileOveruse.ts  # Detect when tiles exceed available supply
│   ├── parseGcg.ts     # Parse GCG (game notation) files
│   ├── gcgData.ts      # GCG game data utilities
│   ├── tileValues.ts   # Standard Scrabble letter values
│   ├── constants.ts    # Tile distribution and game constants
│   ├── repo.ts         # Automerge-repo setup for local-first sync
│   ├── wordList.ts     # Word validation and dictionary
│   ├── useGame.ts      # React hook for game state
│   ├── useGameId.ts    # React hook for game ID management
│   ├── useRoute.ts     # React hook for routing
│   ├── useLongPress.ts # React hook for long-press gestures
│   ├── boardLayout.ts  # Board layout constants and utilities
│   ├── boardStateToMove.ts  # Convert board state to move
│   ├── createEmptyBoard.ts  # Create empty board state
│   ├── createTestGame.ts  # Test game creation utilities
│   ├── getPlayerScore.ts  # Calculate player score
│   ├── getPlayerScoreFromDoc.ts  # Get player score from Automerge doc
│   ├── getMoveScoresFromDoc.ts  # Get move scores from Automerge doc
│   ├── getPlayerMoveHistory.ts  # Get player move history
│   ├── getRemainingTileCount.ts  # Count remaining tiles
│   ├── getRemainingTiles.ts  # Get remaining tiles
│   ├── getPlayedTiles.ts  # Get played tiles from board
│   ├── getScoresWithWinner.ts  # Calculate scores with winner
│   ├── getSortedTileEntries.ts  # Sort tile entries
│   ├── getSquareType.ts  # Get square type for position
│   ├── getTileValue.ts # Get point value for tile
│   ├── getWordsFromMove.ts  # Extract words from move
│   ├── isBlankTile.ts  # Check if tile is blank
│   ├── formatDate.ts   # Date formatting utilities
│   ├── cx.ts          # Classname concatenation utility
│   └── utils.ts       # General utilities
├── stories/            # Storybook files for component development
└── index.css           # Tailwind config, custom colors, fonts
e2e/                    # Playwright end-to-end tests
├── tests/              # Test specs (game-flow, scoring, persistence, etc.)
├── pages/              # Page objects for test abstraction
├── fixtures/           # Test fixtures and helpers
└── games/              # GCG game files for score verification
spec/                   # Specification and wireframes
```

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Zustand** for state management (persists to localStorage)
- **Automerge** for local-first sync and sharing via URL
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives)
- **Vitest** for unit testing, **Playwright** for e2e, **Storybook** for components

## Key types (`src/lib/types.ts`)

```typescript
type Position = { row: number; col: number } // 0-14
type Move = Array<Position & { tile: string }>
type Adjustment = { rackTiles: string[]; deduction: number; bonus: number }
type FailedChallenge = { words: string[] } // Valid words that were challenged
type SuccessfulChallenge = { words: string[] } // Invalid words successfully challenged
type GameMove = {
  playerIndex: number
  tilesPlaced: Move
  adjustment?: Adjustment
  failedChallenge?: FailedChallenge
  successfulChallenge?: SuccessfulChallenge
}
type BoardState = Array<Array<string | null>> // 15x15 grid
type GameStatus = "setup" | "playing" | "paused" | "finished"
type Player = { name: string; timeRemainingMs: number; color: string }
type TimerEvent = { type: "start" | "pause" | "switch"; timestamp: number; playerIndex: number }
type Game = {
  players: Player[]
  currentPlayerIndex: number
  board: BoardState
  moves: GameMove[]
  timerEvents: TimerEvent[]
  status: GameStatus
  createdAt: number
  updatedAt: number
}
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

## Navigation and ending games

- **Back** button (top left): Always visible. Stops timer and returns to home. Game stays "active" and can be resumed.
- **End** button (bottom): Only shows when tiles remaining <= threshold. Goes to EndGameScreen for rack entry and final adjustments. Game becomes "finished" and appears in Past games.
- **Undo/Redo** buttons (top right): Navigate through game history.

The threshold for showing "End" is `(playerCount - 1) * 7` tiles (e.g., 7 tiles for 2 players).

## End game flow

When a player goes out or the game ends normally:

1. Enter remaining tiles on each player's rack
2. System validates racks against remaining tiles
3. Final adjustments: player who went out gets sum of opponents' rack values

## Testing

- **Unit tests**: `src/lib/*.test.ts` - scoring, validation, end game adjustments
- **E2E tests**: `e2e/tests/*.test.ts` - game flow, persistence, score verification against GCG files

Run `pnpm test` for unit tests, `pnpm test:pw` for Playwright.
