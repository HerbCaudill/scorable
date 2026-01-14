# Progress Log

## 2025-01-14: Blank tile letter dialog in edit mode

Fixed a bug where adding blank tiles when correcting/editing a move didn't show the letter-selection dialog. Users now see the same `BlankLetterDialog` UI when placing blank tiles during edit mode as they do when entering a move for the first time.

**Problem:** When editing a move and placing a blank tile (space key), the save would silently commit without asking for the letter the blank represents. This was inconsistent with normal move entry, which shows a dialog.

**Solution:** Added blank tile detection to `handleSaveEdit()` in GameScreen.tsx, mirroring the logic already present in `handleEndTurn()`:
1. Check for unassigned blanks (`tile === " "`) in the move
2. If found, show `BlankLetterDialog` before saving
3. On dialog completion, assign letters (lowercase = blank) and save via `updateMove()`

**Files changed:**
- `src/components/GameScreen.tsx`:
  - Added `pendingEditBlankTiles` state for tracking blanks during edit mode
  - Added `handleEditBlankLettersComplete` and `handleEditBlankLettersCancel` callbacks
  - Modified `handleSaveEdit()` to check for unassigned blanks before saving
  - Added second `BlankLetterDialog` instance for edit mode

**Tests added:**
- `e2e/tests/move-correction.test.ts` - "adding blank tile during edit mode shows letter dialog"
  - Verifies the dialog appears when placing a blank during edit
  - Verifies the score is updated correctly (blank = 0 points)

All 149 Playwright tests pass.

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
