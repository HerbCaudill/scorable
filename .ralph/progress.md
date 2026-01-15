# Progress Log

## 2025-01-15: Add drag and drop support for tile management on EndGameScreen

Added drag-and-drop functionality to move tiles between player racks and the "Remaining tiles" section on the EndGameScreen, providing an intuitive alternative to tap-to-add and X-to-remove interactions.

**Problem:** On the EndGameScreen, users could only move tiles by tapping (to add from remaining to a focused rack) or clicking X icons (to remove from rack to remaining). There was no way to directly drag tiles between locations, which is a more intuitive interaction on desktop.

**Solution:** Implemented HTML5 Drag and Drop API support for tiles on the EndGameScreen:
1. **RackTileInput** - Made rack tiles draggable with `draggable` attribute, added drag/drop event handlers, visual feedback (teal border/background) when dragging over
2. **EndGameScreen** - Made remaining tiles draggable, made the remaining tiles section a drop target for removing tiles from racks, added state tracking for drag source to enable proper tile transfers

Key features:
- Tiles in player racks have `cursor-grab` styling and can be dragged to other racks or the remaining tiles section
- Remaining tiles can be dragged to any player rack
- Visual feedback: teal border and background when hovering over valid drop targets
- Disabled racks (player who ended the game) cannot receive drops and don't have draggable tiles
- The remaining tiles section is always visible as a drop target (with dashed border when tiles can be dropped there)

**Files changed:**
- `src/components/RackTileInput.tsx`:
  - Added `isDragOver` state for visual feedback
  - Added `onTileDrop` and `onTileDragStart` callback props
  - Added drag/drop event handlers (`handleDragStart`, `handleDragOver`, `handleDragLeave`, `handleDrop`)
  - Made tiles draggable with proper attributes and cursor styling
- `src/components/EndGameScreen.tsx`:
  - Added `dragSource` and `isRemainingTilesDragOver` state
  - Added drag event handlers for the remaining tiles section
  - Wired up `onTileDrop` and `onTileDragStart` to coordinate tile transfers
  - Changed remaining tiles from `<button>` to `<div>` elements (for draggable support)
  - Made remaining tiles section always visible as a drop target
- `e2e/tests/end-game.test.ts`:
  - Updated existing tests to use `[draggable='true']` selector instead of `button` for remaining tiles
  - Updated visibility checks for remaining tiles section (now uses label visibility)
  - Added 5 new tests for drag-and-drop functionality

**Tests added:**
- `e2e/tests/end-game.test.ts`:
  - "can drag tile from rack to remaining tiles section"
  - "can drag tile from remaining tiles to rack"
  - "rack tiles are draggable (have cursor-grab class)"
  - "disabled rack tiles are not draggable"
  - "remaining tiles section shows visual feedback when dragging over"

All 178 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Increase scoresheet text size from 10px to 12px

Increased the font size in the move history lists (scoresheets) displayed in player panels from 10px to 12px for better readability.

**Problem:** The text in the scoresheet (move history list showing words played and scores) was set to `text-[10px]` which is very small and difficult to read, especially on mobile devices.

**Solution:** Changed the text size from `text-[10px]` to `text-xs` (12px) in both locations where MoveHistoryList is rendered:
1. `GameScreen.tsx` - Active game view
2. `PastGameScreen.tsx` - Past game review view

This is a 20% increase in font size (10px → 12px), making the move history significantly easier to read.

**Files changed:**
- `src/components/GameScreen.tsx` - Changed MoveHistoryList className from `text-[10px]` to `text-xs`
- `src/components/PastGameScreen.tsx` - Changed MoveHistoryList className from `text-[10px]` to `text-xs`

**Tests added:**
- `e2e/tests/scoring.test.ts` - "scoresheet text is readable size (12px)"
  - Verifies the MoveHistoryList container has font-size of 12px

All 172 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Add X icon to remove tiles from player rack on EndGameScreen

Added the ability to tap a tile in a player's rack on the EndGameScreen to select it and show an X icon, which when clicked removes the tile from the rack (moving it back to the "Remaining tiles" section).

**Problem:** On the EndGameScreen, users could only remove tiles from a player's rack by using the backspace key, which removes tiles from the end of the rack. There was no way to remove a specific tile in the middle of the rack, or to use a touch-based interface to remove tiles.

**Solution:** Modified `RackTileInput.tsx` to support tile selection and removal:
1. Added `selectedTileIndex` state to track which tile is currently selected
2. When a tile is clicked, it becomes selected and shows a red X icon in the corner
3. Clicking the X icon removes the tile from the rack (the tile then appears in "Remaining tiles")
4. Clicking the same tile again deselects it
5. Clicking a different tile moves the selection to that tile
6. Selection is cleared when the rack loses focus

**Files changed:**
- `src/components/RackTileInput.tsx`:
  - Added `selectedTileIndex` state
  - Added `handleTileClick` to handle tile selection (also focuses the input)
  - Added `handleRemoveTile` to remove the selected tile
  - Added effect to clear selection when focus changes
  - Updated tile rendering to include clickable wrapper with X icon overlay

**Tests added:**
- `e2e/tests/end-game.test.ts`:
  - "tapping a tile in player rack shows X icon to remove it"
  - "clicking X icon removes tile from rack and adds to remaining tiles"
  - "tapping another tile moves X icon to that tile"
  - "tapping same tile twice deselects it and hides X icon"

All 171 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Make EndGameScreen footer background transparent

Changed the footer background on the EndGameScreen from white to transparent for better visual consistency.

**Problem:** The footer on the EndGameScreen (containing the Cancel and "Apply & end game" buttons) had a `bg-white` class that made it appear with a solid white background. This looked inconsistent with the rest of the UI design.

**Solution:** Removed the `bg-white` class from the footer div in EndGameScreen.tsx, allowing the footer background to be transparent.

**Files changed:**
- `src/components/EndGameScreen.tsx` - Removed `bg-white` from footer className

**Tests added:**
- `e2e/tests/end-game.test.ts` - "footer has transparent background"
  - Verifies the footer doesn't have bg-white class
  - Verifies the computed backgroundColor is "rgba(0, 0, 0, 0)" (transparent)

All 166 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-14: Add README with application description

Added a comprehensive README.md describing the Scorable application for end users.

**Problem:** The README was empty, providing no information about what the app does or how to use it.

**Solution:** Created a user-facing README covering:
- App description and purpose (score-keeping for Scrabble/word games)
- Feature list (scoring, timers, move correction, challenges, statistics, multi-device sync, offline support)
- Installation instructions (web and PWA)
- Usage guide (starting games, recording moves, timers, corrections, challenges, ending games)
- Development setup and commands
- Tech stack overview

**Files changed:**
- `README.md` - Complete rewrite with user documentation

All 153 Playwright tests and 108 Vitest unit tests pass.

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

## 2025-01-15: Fix dialog z-index to appear above footer buttons

Fixed a visual bug where footer action buttons (Timer, Pass, Tiles, End, Delete) would appear in front of dialog backdrops instead of behind them, potentially allowing accidental clicks on buttons when a dialog should be blocking interaction.

**Problem:** The dialog components (DialogOverlay, DialogContent, AlertDialogOverlay, AlertDialogContent) used `z-50`, while footer buttons on GameScreen and PastGameScreen used `z-60`, and the mobile keyboard used `z-70`. This meant when a dialog was open, the footer buttons would visually appear on top of the semi-transparent backdrop.

**Solution:** Increased the z-index of dialog overlays and content from `z-50` to `z-80`, ensuring dialogs always appear above other UI elements including footer buttons and the mobile keyboard.

**Files changed:**
- `src/components/ui/dialog.tsx` - Changed `z-50` to `z-80` in DialogOverlay and DialogContent
- `src/components/ui/alert-dialog.tsx` - Changed `z-50` to `z-80` in AlertDialogOverlay and AlertDialogContent

**Tests added:**
- `e2e/tests/past-games.test.ts` - "delete confirm dialog appears above footer buttons"
  - Verifies the dialog backdrop is visible when Delete is clicked
  - Verifies the dialog backdrop's z-index (80) is higher than the button container's z-index (60)
  - Verifies the dialog can be cancelled and backdrop disappears

All 154 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Fix mobile keyboard ghost click on Escape key

Extended the ghost click prevention to cover the Escape key (hide keyboard button) in addition to the Enter key.

**Problem:** When hiding the mobile keyboard via the downward chevron button (Escape key), touch events could pass through to elements underneath, such as the Delete button in the footer. The existing fix only covered the Enter/Done key, not the Escape/hide key.

**Solution:** Extended the click blocking code in `handleKeyPress` to include both "Enter" and "Escape" keys. When either key is pressed (both of which hide the keyboard), a temporary capture-phase click listener is added that prevents any clicks for ~400ms, blocking ghost clicks from reaching elements underneath.

**Files changed:**
- `src/components/MobileKeyboard.tsx` - Extended the click blocking condition from `key === "Enter"` to `key === "Enter" || key === "Escape"`

**Also fixed:**
- `playwright.config.ts` - Changed test server port from 5174 to 5175 to avoid conflicts with other development servers running on the same machine

All 154 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Improved insufficient tiles error display in EndGameScreen

Enhanced the rack validation error display to show a visual tile component and improved wording.

**Problem:** When entering rack tiles on the EndGameScreen, validation errors showed plain text like "Too many Q tiles (1 entered, 0 available)" which was hard to scan and inconsistent with the visual tile-based UI elsewhere in the app.

**Solution:** Changed the error display to:
1. Show the actual Tile component for the problematic tile (matching the visual style used elsewhere)
2. Simplified wording:
   - When 0 tiles remaining: "[tile] none left"
   - When some tiles remaining but not enough: "[tile] X entered, but only Y left"

**Files changed:**
- `src/components/RackTileInput.tsx`:
  - Changed `error` prop type from `string` to `RackValidationError` object
  - Updated error display to use Tile component with flex layout
  - Implemented conditional wording based on available tile count
- `src/components/EndGameScreen.tsx`:
  - Changed `getErrorForPlayer()` return type from `string | undefined` to `RackValidationError | undefined`
  - Now returns the error object directly instead of formatting a string

**Tests updated:**
- `e2e/tests/end-game.test.ts`:
  - Updated "validates rack tiles against remaining" test to use new error format
  - Added new test "rack error shows tile component with appropriate message" that verifies:
    - The tile component is visible in the error
    - "none left" message appears when available is 0
    - "X entered, but only Y left" message appears when available > 0 but insufficient

All 155 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Add mobile keyboard support to EndGameScreen

Added a mobile keyboard for entering rack tiles on the EndGameScreen, fixing three related issues:
1. No keyboard appearing on mobile when tapping rack input fields
2. Cancel/Apply buttons not visible when keyboard is shown
3. Focus ring styling (now uses teal border instead of ring)

**Problem:** On mobile devices, the EndGameScreen's rack input fields used `onKeyDown` events which require a physical keyboard. Mobile users had no way to enter or edit tile letters since no virtual keyboard would appear.

**Solution:** Created a new `RackKeyboard` component (simplified version of `MobileKeyboard` without direction toggle) and integrated it into `EndGameScreen`:
1. Added `RackKeyboard.tsx` - a streamlined keyboard with A-Z, blank, backspace, and hide buttons
2. Modified `RackTileInput.tsx` to accept `isFocused` and `onFocusChange` props for controlled focus state
3. Updated `EndGameScreen.tsx` to:
   - Track which player's rack is focused (`focusedPlayerIndex` state)
   - Show `RackKeyboard` when on mobile and a rack is focused
   - Add padding to footer when keyboard is visible so buttons remain accessible
   - Changed from `h-screen` to `h-dvh` for proper mobile viewport handling
4. Changed rack input border to teal when focused (instead of focus ring)

**Files changed:**
- `src/components/RackKeyboard.tsx` - New component (simplified mobile keyboard)
- `src/components/RackTileInput.tsx` - Added `isFocused`, `onFocusChange` props; teal border on focus
- `src/components/EndGameScreen.tsx` - Integrated mobile keyboard, focus tracking, viewport fix

**Tests added:**
- `e2e/tests/end-game.test.ts`:
  - "mobile keyboard appears when clicking rack input" - verifies keyboard shows/hides
  - "mobile keyboard input adds tiles to rack" - verifies typing via touch events
  - "focused rack input shows teal border" - verifies visual focus indicator

All 158 Playwright tests and 108 Vitest unit tests pass (excluding one pre-existing flaky test).

## 2025-01-15: Make drop shadow colors match border colors

Standardized the 3D drop shadow colors across the app to match the element's border color, improving visual consistency.

**Problem:** Several elements had drop shadows using black/gray `rgba(0,0,0,...)` colors that didn't match their border colors:
1. HomeScreen logo tile: Had black shadow (`rgba(0,0,0,0.15)`) but amber styling
2. StatisticsScreen player cards: Had black shadow (`rgba(0,0,0,0.1)`) but no border
3. Outline button variant: Had khaki-300 shadow but default gray border

**Solution:** Updated shadows to use CSS variables matching border colors:
1. **Logo tile** (`HomeScreen.tsx`): Added `border-amber-300` and changed shadow to `var(--color-amber-300)`
2. **Player cards** (`StatisticsScreen.tsx`): Added `border-neutral-300` and changed shadow to `var(--color-neutral-300)`
3. **Outline button** (`button.tsx`): Changed shadow from `var(--color-khaki-300)` to `var(--color-neutral-300)` to match the default border

This follows the established pattern where shadows are the same color as borders (e.g., player panels use player color for both border and shadow).

**Files changed:**
- `src/components/ui/button.tsx` - Changed outline variant shadow from khaki-300 to neutral-300
- `src/components/HomeScreen.tsx` - Added amber-300 border and shadow to logo tile
- `src/components/StatisticsScreen.tsx` - Added neutral-300 border and shadow to player cards

**Tests added:**
- `e2e/tests/home-screen.test.ts` - "logo tile has matching border and shadow colors"
  - Verifies the logo has amber-300 border class
  - Verifies the shadow uses oklch color (from CSS variable) not black rgba
- `e2e/tests/statistics.test.ts` - "player cards have matching border and shadow colors"
  - Verifies cards have neutral-300 border class
  - Verifies the shadow uses oklch color (from CSS variable) not black rgba

All 160 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Add blinking cursor to RackTileInput on EndGameScreen

Added a blinking cursor to the rack tile input on the EndGameScreen to provide visual feedback when the input is focused.

**Problem:** On the EndGameScreen, when users clicked on a player's rack input field to type tiles, there was no visual cursor to indicate where new tiles would be added. This made it confusing to know if the input was focused and ready for typing.

**Solution:** Added a teal blinking cursor element that appears after the tiles when the input is focused and not disabled:
1. Added a new `animate-blink` CSS animation in `index.css` with `step-end` timing for a crisp on/off effect
2. Added a cursor div (`h-6 w-0.5 animate-blink bg-teal-500`) to `RackTileInput.tsx` that only shows when `isFocused && !disabled`

**Files changed:**
- `src/components/RackTileInput.tsx` - Added blinking cursor element after tiles
- `src/index.css` - Added `@keyframes blink` animation and `.animate-blink` class

**Tests added:**
- `e2e/tests/end-game.test.ts` - Two new tests:
  - "focused rack input shows blinking cursor" - Verifies cursor appears with blink animation when input is focused
  - "disabled rack input does not show cursor when clicked" - Verifies cursor doesn't appear on disabled inputs

All 162 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Add unaccounted tiles display to EndGameScreen

Added a new "Unaccounted tiles" section to the EndGameScreen that shows tiles that haven't been assigned to any player's rack yet. When a player's rack input is focused, tapping an unaccounted tile adds it to their rack.

**Problem:** On the EndGameScreen, for 3+ player games or when manually adjusting 2-player game racks, users had to remember or look up which tiles were still unassigned. There was no visual representation of the tiles that needed to be distributed among players.

**Solution:** Added an "Unaccounted tiles" section between the "Who ended the game?" selection and the player racks:
1. Calculates unaccounted tiles by subtracting assigned tiles (across all player racks) from remaining tiles (unplayed tiles in the game)
2. Displays each unaccounted tile as a clickable button with the Tile component
3. When a player's rack is focused, shows "(tap to add)" hint and enables clicking tiles to add them to the focused rack
4. When no rack is focused, tiles are dimmed (50% opacity) and disabled

**Files changed:**
- `src/components/EndGameScreen.tsx`:
  - Added `Tile` component import
  - Added `unaccountedTiles` useMemo calculation (placed after `playerRacks` state to avoid circular dependency)
  - Added `handleUnaccountedTileClick` callback to add tiles to focused rack
  - Added "Unaccounted tiles" UI section with conditional rendering and styling

**Tests added:**
- `e2e/tests/end-game.test.ts` - Three new tests:
  - "unaccounted tiles appear when tiles are cleared from rack" - Verifies section appears when tiles are removed from auto-populated rack
  - "tapping unaccounted tile adds it to focused player rack" - Verifies tap-to-add functionality moves tiles correctly
  - "unaccounted tiles are disabled when no rack is focused" - Verifies tiles are dimmed and hint is hidden when no rack is focused

All 165 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Fix flaky e2e test - wait for hash navigation

Fixed a flaky test in the statistics test suite that was intermittently failing due to a race condition in hash-based navigation.

**Problem:** The test "average game score label has vertical spacing from chart in DotPlot" was intermittently failing because the `seedGame` fixture wasn't properly waiting for hash navigation to complete. When creating multiple games in sequence, the `window.location.hash = documentId` navigation in `page.evaluate()` wasn't being processed by the React app before `waitForSelector` tried to find the board element.

**Solution:** Added an explicit `waitForFunction` call to ensure the browser's hash has been updated before waiting for the board element:

```typescript
await page.waitForFunction(
  expectedHash => window.location.hash === `#${expectedHash}`,
  gameId,
  { timeout: 5000 },
)
await page.waitForSelector('[role="grid"][aria-label="Scrabble board"]', { timeout: 5000 })
```

This ensures deterministic behavior by waiting for:
1. The hash to be updated in the browser
2. The board element to appear (with explicit timeout)

**Files changed:**
- `e2e/fixtures/seed-game.ts` - Added waitForFunction for hash navigation before waitForSelector

All 165 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Move "Remaining tiles" section below player racks on EndGameScreen

Moved the unaccounted tiles section to appear below the player racks (instead of above them) and changed the label from "Unaccounted tiles" to "Remaining tiles" for clarity.

**Problem:** On the EndGameScreen, the unaccounted tiles were displayed above the player rack entries, which was not intuitive. Users would see tiles to assign before seeing where to assign them. The label "Unaccounted tiles" was also confusing - "Remaining tiles" better describes what they are.

**Solution:**
1. Moved the unaccounted tiles section in EndGameScreen.tsx from before the player racks to after them
2. Changed the label from "Unaccounted tiles" to "Remaining tiles"
3. Changed margin from `mb-6` to `mt-6` since it now comes after the player sections

**Files changed:**
- `src/components/EndGameScreen.tsx` - Moved unaccounted tiles section after player racks, renamed label to "Remaining tiles"
- `e2e/tests/end-game.test.ts` - Updated test assertions to use "Remaining tiles" instead of "Unaccounted tiles"

**Tests added:**
- `e2e/tests/end-game.test.ts` - "remaining tiles section appears below player racks"
  - Verifies the Remaining tiles section's Y position is below the last player section's bottom edge

All 167 Playwright tests and 108 Vitest unit tests pass.

## 2025-01-15: Remove borders and padding from player divs on EndGameScreen

Removed the visual borders and padding from the player section divs on the EndGameScreen for a cleaner appearance.

**Problem:** The player sections on the EndGameScreen had `rounded-lg border p-3` classes which added visible borders and padding around each player's name and rack input. This visual treatment made the UI look cluttered.

**Solution:** Removed the `rounded-lg border p-3` classes from the player section container in EndGameScreen.tsx. Added a `data-testid` attribute (`player-rack-{index}`) to enable reliable test selection after removing the CSS classes that tests were using for locators.

**Files changed:**
- `src/components/EndGameScreen.tsx` - Removed `rounded-lg border p-3` from player section div, added `data-testid="player-rack-{index}"` attribute
- `e2e/pages/game.page.ts` - Updated `getPlayerSection()` method to use `[data-testid^="player-rack-"]` selector instead of `.rounded-lg.border.p-3`
- `e2e/tests/end-game.test.ts` - Updated all occurrences of `.rounded-lg.border.p-3` selector to use the new testid-based selector

**Tests added:**
- `e2e/tests/end-game.test.ts` - "player divs have no borders or padding"
  - Verifies player section elements don't have border, rounded-lg, or p-3 classes

All 173 Playwright tests and 108 Vitest unit tests pass.
