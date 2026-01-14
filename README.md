# Scorable

A mobile-friendly score-keeping app for Scrabble and other word games. Track scores, manage player
timers, correct moves, challenge words, and view game statistics.

## Features

- **Accurate scoring**: Automatic calculation of letter/word multipliers, cross-words, and bingo
  bonuses
- **Player timers**: Individual chess-style countdown timers for each player
- **Move correction**: Long-press any move to edit it and recalculate scores
- **Word challenges**: Challenge opponents' words against the official dictionary (CSW21)
- **End game adjustments**: Automatic rack deductions and bonuses when a player goes out
- **Statistics**: Track average and best scores across games for each player
- **Multi-device sync**: Share games between devices via URL (local-first using Automerge CRDTs)
- **Offline support**: Works without internet (PWA with full offline capability)
- **2-4 players**: Supports games with any number of players

## Installation

### As a web app

Visit the deployed URL and use it directly in your browser.

### As a mobile app (PWA)

1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap "Add to Home Screen" from the share menu
3. The app will install and work offline

## Usage

### Starting a game

1. Tap **New game** on the home screen
2. Select or add players (2-4)
3. Start playing!

### Recording moves

1. Tap a cell on the board to place the cursor
2. Type letters to place tiles (use Space for blank tiles)
3. Tap the active player's panel or press Enter to commit the move
4. The score is calculated automatically

### Player timers

- Tap **Start Timer** to begin the countdown
- Timers automatically pause during move entry and switch when turns change
- Each player has an independent 25-minute timer by default

### Correcting moves

- Long-press on any move in the history to enter edit mode
- Modify the tiles and save to recalculate all subsequent scores

### Challenging words

- After a move, tap on it and select **Challenge**
- Valid words: failed challenge is recorded (5-point penalty in tournament play)
- Invalid words: move is removed and the player loses their turn

### Ending a game

When tiles run low, the **End** button appears:

1. Select which player went out (or "No one" for a blocked game)
2. Enter each player's remaining rack tiles
3. Final adjustments are calculated automatically

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test        # Unit tests (Vitest)
pnpm test:pw     # E2E tests (Playwright)
pnpm test:all    # All tests + type checking

# Other commands
pnpm storybook   # Component development
pnpm build       # Production build
pnpm format      # Format code (Prettier)
```

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4 + shadcn/ui
- Automerge for local-first sync
- Zustand for state management
- Vitest + Playwright for testing

## License

MIT
