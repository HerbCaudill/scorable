## Progress log

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
