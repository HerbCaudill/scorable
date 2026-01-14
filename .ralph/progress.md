# Progress Log

## 2025-01-14: Blank tile letter styling - yellow instead of gray

Changed the visual styling of blank tile letters from 25% opacity (appearing gray) to yellow (text-yellow-600) in both locations where blank tiles are displayed:

1. **Game board (Tile.tsx)**: The letter displayed on a blank tile now appears in yellow-600 color instead of the default text color with opacity.

2. **Scoresheet (MoveHistoryList.tsx)**: In the move history, blank letters within words now appear in yellow-600 to distinguish them from regular letters.

**Files changed:**
- `src/components/Tile.tsx` - Changed from `opacity-25` to `text-yellow-600` for blank tile letters
- `src/components/MoveHistoryList.tsx` - Changed from `opacity-25` to `text-yellow-600` for blank letters in word display

**Tests added:**
- `e2e/tests/scoring.test.ts` - Added two new tests:
  - "blank tile letter is displayed in yellow on board" - verifies the blank tile has the aria-label and different styling
  - "blank tile letter is displayed in yellow on scoresheet" - verifies blank letters have different color than regular letters

All 148 Playwright tests pass.
