# Progress Log

## 2025-01-14: Right-align best move score label on histogram

Changed the "best:" label on the move score histogram to be right-aligned instead of anchored to the x-position of the best score value.

**Problem:** The best move score label (e.g., `best: ZESTY (88)`) was positioned based on where the best score value fell on the x-axis, which could cause it to be awkwardly positioned or conflict with other elements.

**Solution:** Changed the label positioning from using `left: ${clampedPos}%` with `-translate-x-1/2` to simply using `right: 0`, making it consistently right-aligned below the x-axis.

**Files changed:**
- `src/components/Histogram.tsx` - Updated the "best" label positioning to use `right-0` class instead of calculating x-position

All 149 Playwright tests pass.

## 2025-01-14: Add vertical padding to Header component

Added `py-2` (8px vertical padding) to the Header component to give it consistent vertical spacing across all screens.

**Problem:** The Header component had no vertical padding, making it feel cramped against surrounding content.

**Solution:** Added `py-2` class to the Header's root div, which applies 8px of padding above and below the header content.

**Files changed:**
- `src/components/Header.tsx` - Added `py-2` to the flex container

All 149 Playwright tests pass.

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

## 2025-01-14: Clickable "best" label on game scores DotPlot

Made the "best:" label on the game scores dot plot clickable. Clicking the label now focuses the corresponding best-score dot and displays its tooltip, matching the behavior of clicking on the dot directly.

**Problem:** Users could click on individual dots in the game score dot plot to see details, but the "best:" label (which highlights the highest scoring game) was not interactive. This was inconsistent since the label is visually prominent and users might expect to be able to click it.

**Solution:** Added an `onClick` handler to the "best" label `<span>` element in the DotPlot component that:
1. Finds the `bestDot` (already computed for drawing the connecting line)
2. Sets/toggles `selectedIndex` to that dot's index, showing/hiding the tooltip
3. Added `cursor-pointer` class when a bestDot exists to indicate clickability

**Files changed:**
- `src/components/DotPlot.tsx` - Added onClick handler and cursor-pointer class to the "best" label

**Tests added:**
- `e2e/tests/statistics.test.ts` - "clicking best game score label focuses the corresponding dot and shows tooltip"
  - Verifies clicking the label shows the tooltip
  - Verifies the corresponding dot gets the selected ring
  - Verifies clicking again hides the tooltip

All 150 Playwright tests pass.
