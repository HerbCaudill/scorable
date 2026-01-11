## Progress log

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
