# Progress Log

## 2025-01-14: Add vertical spacing between avg label and chart in DotPlot

Added approximately 1em (~28px) of vertical space between the average game score label and the chart dots on the statistics screen, while keeping the reference line extending all the way from the label to the x-axis.

**Problem:** The average label at the top of the DotPlot (game scores chart) was positioned directly at `top-0`, meaning the dots could stack up very close to the label, potentially overlapping or looking cramped.

**Solution:** Added a `labelAreaHeight` constant (28px) that is conditionally included when the chart has an avg reference line:
1. The label area height is added to the total chart container height
2. The dots are still positioned from the bottom, so they now have 28px of clearance from the label
3. The reference line uses `h-full` class so it automatically extends the full height (including the label area)
4. Only added when there's an avg line to avoid unnecessary padding for charts without avg reference

**Files changed:**
- `src/components/DotPlot.tsx` - Added `hasAvgLine` check and `labelAreaHeight` constant, updated `chartHeightWithPadding` calculation

**Tests added:**
- `e2e/tests/statistics.test.ts` - "average game score label has vertical spacing from chart in DotPlot"
  - Verifies the avg label is visible with amber background
  - Verifies the reference line extends full height
  - Verifies the chart container is at least 83px tall (min chart height + label area)

All 152 Playwright tests pass.

## 2025-01-14: Fix best game score line positioning in DotPlot

Fixed the connecting line between the "best:" label and the best game score dot on the statistics screen. Previously, the line extended incorrectly - it went above the dot and below the label.

**Problem:** The line was drawn from `bottom: 0` of the label area with a height calculated to go all the way up through the chart, but this caused it to extend beyond both the label and the dot.

**Solution:** Recalculated the line positioning to:
1. Start at the top of the label (at `top-4` = 16px from top of label area)
2. End at the center of the dot (not above it)

The key changes:
- `lineStartFromBottom`: Position the line's bottom edge at `24px` (40px label area height - 16px top offset), aligning with the top of the label
- `lineHeight`: Calculate the distance from the top of the label, through the 1px x-axis line, up to the center of the dot

**Files changed:**
- `src/components/DotPlot.tsx` - Rewrote the line height and position calculations for the best score connecting line

All 150 Playwright tests pass.

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

## 2025-01-14: Fix average move score line in Histogram to extend from label to x-axis

Fixed the average reference line in the move score histogram on the statistics screen. Previously, the line only covered the chart area and didn't extend up to the "avg:" label at the top.

**Problem:** The average reference line was positioned with `top-7` (starting 28px from the top of the container) with a height of 56px. This meant it only covered the chart area (the histogram bars), but didn't extend up through the 28px label area to connect with the "avg:" label at the top.

**Solution:** Changed the line positioning to start from `top-0` with a height of 84px (28px label area + 56px chart height). This makes the line extend from the top of the label area all the way down to the x-axis.

The key changes:
- `top-7` → `top-0` to start the line at the top of the container
- `height: 56` → `height: 84` to extend through both the label area and chart area

**Files changed:**
- `src/components/Histogram.tsx` - Updated the reference line positioning from `top-7` to `top-0` and height from 56px to 84px

**Tests added:**
- `e2e/tests/statistics.test.ts` - "average move score line extends from label to x-axis"
  - Verifies the line has the correct height (84px) to extend from label to x-axis

All 151 Playwright tests pass.

## 2025-01-14: Populate blank tile letters when importing GCG games

Fixed a bug where blank tiles in imported GCG games lost their letter representation. Previously, lowercase letters in GCG word data (which indicate blank tiles playing as that letter) were converted to spaces (`" "`), meaning users had to re-assign letters to blanks when viewing imported games. Now the letter representation is preserved.

**Problem:** In GCG format, lowercase letters indicate blank tiles playing as that letter (e.g., `SCAMsTER` has a blank playing as 'S'). The import code was converting these lowercase letters to spaces (`" "`), losing the information about what letter each blank represented. This required users to manually re-assign letters when viewing imported games.

**Solution:** Modified the GCG-to-game conversion functions to preserve lowercase letters instead of converting them to spaces. The app already uses lowercase letters to represent assigned blank tiles internally, so no other changes were needed.

**Files changed:**
- `e2e/fixtures/gcgToGame.ts` - Changed `wordToTiles()` to keep the original character instead of converting lowercase to space
- `src/lib/createTestGame.ts` - Changed `convertGcgToMoves()` to keep the original letter instead of converting lowercase to space

**Tests added:**
- `src/lib/createTestGame.test.ts` - New test file with 4 tests:
  - "preserves blank tile letters (lowercase) when converting GCG to game"
  - "handles multiple blank tiles in a single word"
  - "handles blank at the end of a word (VROWs)"
  - "handles blank in the middle of a word (SCAMsTER)"
- `e2e/tests/scoring.test.ts` - Added test "imported games display blank tiles with assigned letters"

All 153 Playwright tests and 108 Vitest unit tests pass.
