## Progress log

### 2026-01-12: Create test games button improvements

**Problem:** The "Create test game" button was prominent (same size as "New game") and only created a single test game. Users wanted a way to quickly populate the app with multiple test games in various states.

**Solution:**

1. Changed button text to "Create test games" (plural)
2. Made button smaller and moved to bottom of screen (subtle, text-only style)
3. Creates 10 test games from all GCG files in the e2e/games directory
4. Two games are in-progress: one missing only the last move, one at mid-game
5. Remaining 8 games are finished

**Implementation:**

- Created `src/lib/gcgData.ts` - imports all GCG files as raw strings using Vite's `?raw` feature
- Updated `src/lib/createTestGame.ts`:
  - Refactored `createTestGame` to accept options (gcgContent, movesToInclude, status)
  - Uses player names from GCG files instead of hardcoded Alice/Bob
  - Added `createTestGames` function that creates games from all GCG files
- Updated `src/components/HomeScreen.tsx`:
  - Button is now small text at bottom of screen with gray styling
  - Calls `createTestGames` instead of `createTestGame`
  - Registers all player names from the created games

**Files changed:**

- `src/lib/gcgData.ts` - New file to import GCG files as raw strings
- `src/lib/createTestGame.ts` - Refactored to support multiple games
- `src/components/HomeScreen.tsx` - Updated button and handler

**Tests:** All 136 Playwright tests and 98 unit tests pass.

---

### 2026-01-12: Added statistics page with player visualizations

**Problem:** Users wanted to see player statistics including win rates and score distributions across their games.

**Solution:** Enhanced the existing StatisticsScreen to:

1. Filter to only show players with 3+ finished games (MIN_GAMES_FOR_STATS)
2. Display move score distribution histograms for each player
3. Display game score distribution histograms for each player

Created reusable components:

- `Histogram.tsx` - SVG-based histogram visualization with configurable colors (teal/amber)
- `getMoveScoresFromDoc.ts` - Extract individual move scores for a player from a GameDoc

Updated StatisticsScreen to:

- Calculate move scores by replaying each game's board state
- Track both gameScores and moveScores arrays per player
- Show empty state message when no players have 3+ games
- Display histograms side-by-side (move scores in teal, game scores in amber)

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Added filtering and histogram display
- `src/components/Histogram.tsx` - New SVG histogram component
- `src/lib/getMoveScoresFromDoc.ts` - New helper to extract move scores
- `e2e/fixtures/seed-game.ts` - Fixed to not wait for board on finished games
- `e2e/tests/statistics.test.ts` - New Playwright tests for statistics page

**Tests:** All 142 Playwright tests (136 passing, 6 skipped) and 98 unit tests pass.

---

### 2026-01-12: Moved tile counts below header on unplayed tiles screen

**Problem:** On the unplayed tiles screen, the counts ("X tiles remaining · Y played") were displayed next to the header title, which was visually cramped.

**Solution:** Moved the counts to be below the header and flush left with the tile content. The counts now appear at the top of the scrollable content area with bottom margin for spacing.

**Files changed:**

- `src/components/TileBagScreen.tsx` - Moved counts paragraph from header to content area

**Tests:** All 132 Playwright tests and 98 unit tests pass.

---

### 2026-01-12: Added drop shadows to virtual keyboard keys

**Problem:** Virtual keyboard keys had subtle `shadow-sm` shadows while other interactive elements (buttons, player panels) had more pronounced color-matched drop shadows, creating visual inconsistency.

**Solution:** Applied consistent 2px drop shadows to all keyboard keys following the established pattern:

- White letter keys and blank key: `shadow-[0_2px_0_0_var(--color-neutral-300)]`
- Gray keys (backspace, direction toggle, escape): `shadow-[0_2px_0_0_var(--color-neutral-500)]`
- Teal "Done" key: `shadow-[0_2px_0_0_var(--color-teal-700)]` (matching primary buttons)
- Added `active:shadow-none active:translate-y-[2px]` for press feedback

**Files changed:**

- `src/components/MobileKeyboard.tsx` - Updated all key button classes

**Tests:** All 132 Playwright tests and 98 unit tests pass.

---

### 2026-01-12: Added drop shadows to player panels

**Problem:** Player panels had a colored ring border but no drop shadow, making them look flat compared to the buttons which have color-matched drop shadows.

**Solution:** Added drop shadows to player panels using the same 3px solid shadow pattern as buttons. Created a `darkenColor` utility function that takes a hex color and darkens it by a configurable factor (default 70%). Active player panels get a solid colored shadow, inactive panels get a transparent shadow.

**Files changed:**

- `src/lib/utils.ts` - Added `darkenColor` helper function
- `src/lib/utils.test.ts` - Unit tests for darkenColor
- `src/components/GameScreen.tsx` - Updated player panel boxShadow to include drop shadow

**Tests:** All 138 Playwright tests and 98 unit tests pass.

---

### 2026-01-12: Reduced button border radius

**Problem:** Buttons were using `rounded-full` which made them pill-shaped (fully rounded ends), looking too round.

**Solution:** Changed buttons from `rounded-full` to `rounded-xl` for a softer but not pill-shaped appearance.

**Files changed:**

- `src/components/ui/Button.tsx` - Changed base class from `rounded-full` to `rounded-xl`

---

### 2026-01-12: Fixed footer button drop shadows being clipped

**Problem:** The action buttons in the footer (Timer, Pass, Tiles, etc.) had their drop shadows clipped/cut off because the container used `overflow-x-auto` for horizontal scrolling.

**Solution:** Added `pb-1` (4px bottom padding) to the footer container to provide space for the 3px drop shadows.

**Files changed:**

- `src/components/GameScreen.tsx` - Added `pb-1` to the action buttons container

---

### 2026-01-12: Button drop shadows now match button colors

**Problem:** Button drop shadows used generic semi-transparent black (`rgba(0,0,0,0.25)`), which looked flat and disconnected from the button colors.

**Solution:** Changed shadows to use darker variants of each button's color:

- Primary (teal) buttons: shadow uses `--color-teal-700`
- Destructive (red) buttons: shadow uses a darker oklch red
- Outline buttons: shadow uses `--color-khaki-300`
- Secondary (khaki) buttons: shadow uses `--color-khaki-800`

**Files changed:**

- `src/components/ui/Button.tsx` - Updated shadow colors for each variant

---

### 2026-01-12: Removed subtitle from home screen

Removed the "Score keeper for word games" subtitle from the home screen header area per the todo list. Simple one-line deletion from `HomeScreen.tsx`.

---

### 2026-01-12: Added explicit Pass button

**Problem:** To pass a turn, users had to click "Done" without placing tiles, which triggered a confirmation dialog. This was unintuitive and made Playwright tests more complex (requiring clicking a cell and pressing Enter to trigger the pass flow).

**Solution:** Added an explicit "Pass" button to the action buttons bar at the bottom of the game screen (using `IconHandStop`). Clicking it directly opens the pass confirmation dialog.

**Files changed:**

- `src/components/GameScreen.tsx` - Added Pass button with IconHandStop icon
- `e2e/pages/game.page.ts` - Updated `pass()` to click the Pass button instead of clicking a cell and pressing Enter; scoped `confirmPass()` to target the dialog button specifically
- `e2e/tests/pass-turn.test.ts` - Added 2 new tests for the Pass button

**Tests:** All 138 Playwright tests and 93 unit tests pass.

---

### 2026-01-11: Improved blank tile letter selection UX

**Problem:** The blank tile interface was janky - pressing space immediately opened a dialog with 26 letter buttons, interrupting the tile placement flow.

**Solution:** Deferred letter selection until move commit:

1. Press space → blank tile placed immediately (no dialog)
2. Continue placing other tiles normally
3. Press Enter/Done to commit → if there are blanks, dialog appears
4. User types the missing letter(s) using keyboard
5. Click Done to complete the move

**Files changed:**

- `src/components/BlankLetterDialog.tsx` - New component for keyboard-based letter input
- `src/components/GameScreen.tsx` - Check for unassigned blanks on commit, show dialog
- `src/components/ScrabbleBoard.tsx` - Remove `onBlankTilePlaced` callback, place blanks immediately
- `src/components/BlankTileDialog.tsx` - Deleted (replaced by BlankLetterDialog)
- `e2e/pages/game.page.ts` - New `typeBlankLetters()` method
- `e2e/fixtures/replay-game.ts` - Updated for new blank tile flow
- `e2e/tests/*.ts` - Updated blank tile tests

**Tests:** All 136 Playwright tests and 93 unit tests pass.

---

### 2026-01-11: Fixed backspace to skip over existing tiles

**Problem:** When entering tiles that span existing tiles on the board (e.g., placing letters before and after an existing word), backspace only worked up until the first existing tile was encountered. Users had to manually click on remaining new tiles to continue deleting.

**Solution:** Added a `findPreviousPosition` function in `ScrabbleBoard.tsx` that mirrors `findNextPosition` but moves backward. Updated the backspace handler to use this function with `skipExisting: true`, allowing the cursor to skip over existing tiles when finding the previous new tile to delete.

**Files changed:**

- `src/components/ScrabbleBoard.tsx` - Added `findPreviousPosition` and updated backspace logic
- `e2e/tests/board-interaction.test.ts` - Added new test "backspace skips over existing tiles"

**Tests:** All backspace-related tests pass. Note: The "space places blank tile" tests were already failing (pre-existing issue related to blank tile dialog).
