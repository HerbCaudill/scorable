## Progress log

### 2026-01-13: Changed statistics page tooltips from hover to click/tap

**Problem:** The dot plot tooltips on the statistics page used hover-based interaction (`onMouseEnter`), which doesn't work on mobile/touch devices. Since the app is primarily used on mobile, users couldn't see move or game details on their phones.

**Solution:** Changed the interaction model from hover to click/tap:

1. **Click to select** - Clicking/tapping a dot shows its tooltip
2. **Click same dot to deselect** - Clicking the same dot again hides the tooltip
3. **Click outside to dismiss** - Clicking anywhere outside the dot plot also hides the tooltip

Implementation:
- Renamed `hoveredIndex` state to `selectedIndex`
- Changed `onMouseEnter` to `onClick` with toggle behavior
- Removed `onMouseLeave` handler from container
- Added `useEffect` with document-level `mousedown` and `touchstart` listeners to detect clicks outside
- Added `containerRef` to identify when clicks are outside the component

**Files changed:**

- `src/components/DotPlot.tsx` - Changed from hover to click/tap interaction
- `e2e/fixtures/seed-game.ts` - Added `clearStorage` parameter to `seedFinishedGame`
- `e2e/tests/statistics.test.ts` - Added 2 new tests for click behavior

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Filtered outlier scores from statistics and added more normal-scoring games

**Problem:** The statistics screen was showing some extreme scores (games >500 points, moves >100 points) that skewed the visualizations and made them less relatable to typical gameplay. Additionally, some test games included these outlier scores.

**Solution:** Two-part fix:

1. **Filtered outliers from statistics display:**
   - Added `MAX_GAME_SCORE = 500` and `MAX_MOVE_SCORE = 100` constants in StatisticsScreen
   - Filter out game data points where value > 500
   - Filter out move data points where value > 100
   - Averages and "best" values are now calculated from filtered data only

2. **Removed outlier games and added normal-scoring games:**
   - Removed `anno57697.gcg` (final score 538) and `anno57721.gcg` (final score 623, with 194 and 104 point moves) from gcgFiles
   - Downloaded 10 new games from cross-tables.com with normal scores:
     - ct17123.gcg (442 vs 381)
     - ct5939.gcg (413 vs 348)
     - ct4158.gcg (352 vs 311)
     - ct4048.gcg (453 vs 390)
     - ct2221.gcg (409 vs 348)
     - ct741.gcg (457 vs 242)
     - ct54545.gcg (406 vs 374)
     - ct20031.gcg (402 vs 296)
     - ct15827.gcg (397 vs 353)
     - ct38790.gcg (379 vs 437)
   - All new games have scores ≤500 and moves ≤100

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Added score filtering constants and logic
- `src/lib/gcgData.ts` - Removed outlier games, added 10 new cross-tables.com imports
- `e2e/games/ct*.gcg` - 10 new GCG files added

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Fixed dot overflow in DotPlot component

**Problem:** The DotPlot component had a fixed height of 48px, but when many data points fell into the same bin, the stacked dots could overflow the container since the minimum dot size was 4px.

**Solution:** Made the chart height dynamic based on the tallest stack:

1. Changed to a fixed dot size of 6px with 1px spacing between dots
2. Calculate required height as `maxStackHeight * dotSpacing`
3. Chart height is `Math.max(48, requiredHeight)` - minimum 48px but grows to fit all dots

This ensures dots never overflow while maintaining consistent dot sizes across all charts.

**Files changed:**

- `src/components/DotPlot.tsx` - Dynamic height calculation based on tallest stack

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Anchored best and average scores to dot plot charts

**Problem:** The statistics page showed avg and best scores as numbers to the right of the charts, but users wanted these values visually anchored to the chart itself.

**Solution:** Added reference lines to the DotPlot component:

1. **Vertical dashed lines** - Drawn through the chart area at the x-position of each reference value
2. **Tick marks** - Small vertical marks on the x-axis line where reference lines cross
3. **Labels below axis** - "avg 35" and "best 194" labels positioned on a second row below the min/max axis labels

The reference lines are configurable via a new `referenceLines` prop that accepts an array of `{ value: number, label: string }` objects.

**Files changed:**

- `src/components/DotPlot.tsx` - Added `ReferenceLine` type and `referenceLines` prop, render vertical lines, tick marks, and labels
- `src/components/StatisticsScreen.tsx` - Removed separate avg/best display, now passes referenceLines to DotPlot for both move and game scores

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Replaced histogram with dot plot visualization

**Problem:** Histograms on the statistics screen showed binned data but you couldn't see individual games or moves. Users wanted to hover over specific data points to see details about each game/move.

**Solution:** Created a new DotPlot component that shows each data point as an individual dot:

1. **Dot placement** - Data points are placed along the x-axis according to their value, then stacked vertically within bins to avoid overlap
2. **Hover tooltips** - Hovering over a dot shows information:
   - Move scores: shows the word and score (e.g., "OVAL for 17")
   - Game scores: shows the date, opponent, and score (e.g., "Jan 13 vs Bob: 389")
3. **Visual feedback** - Non-hovered dots dim to 30% opacity, hovered dot gets a ring highlight
4. **Same axis ranges** - All players' plots use the same min/max for easy comparison

**New files:**

- `src/components/DotPlot.tsx` - New dot plot visualization component
- `src/lib/getMoveDataFromDoc.ts` - Get move scores with word labels for tooltips
- `src/lib/getGameDataFromDoc.ts` - Get game scores with date/opponent labels for tooltips

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Updated to use DotPlot instead of Histogram, switched to new data helpers

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Fixed build chunk size warning with bundle splitting

**Problem:** Build showed warning about chunks being larger than 500KB. The main bundle was 31MB due to the Scrabble dictionary and Automerge being bundled together with app code.

**Solution:** Added Rollup `manualChunks` configuration to split the bundle into logical pieces:

1. **word-list** (~31MB) - Scrabble dictionary with definitions (csw21)
2. **automerge** (~184KB) - CRDT library for sync
3. **react** (~11KB) - React core
4. **radix** (~86KB) - Radix UI components

Also increased `chunkSizeWarningLimit` to 32MB since the dictionary is intentionally large and cannot be reduced without losing word definitions.

**Results:**

- Main app bundle reduced from 31MB to 411KB (97% reduction)
- All dependencies now cached independently
- No more build warnings

**Files changed:**

- `vite.config.ts` - Added build.rollupOptions.output.manualChunks and chunkSizeWarningLimit

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Refactored PastGameScreen to match GameScreen layout

**Problem:** The PastGameScreen had a different layout than GameScreen, with separate score display cards, a full-width delete button, and move history in a different format.

**Solution:** Refactored PastGameScreen to use the same layout structure as GameScreen:

1. **Player panels** - Same card structure with header containing name, score, and move history below
2. **Winner indicator** - Trophy icon shown in the winner's panel header (instead of separate "Winner" badge)
3. **Footer** - Horizontal scrolling footer with Delete button (same style as GameScreen)
4. **Board** - Same centered layout, read-only (no editing capability)
5. **Removed** - Date display from header (not needed for past games)

The layout now matches the GameScreen with these key differences:

- No timer controls (game is finished)
- No editing controls (undo/redo, pass, etc.)
- Winner trophy icon on winning player's panel
- Only Delete button in footer

**Files changed:**

- `src/components/PastGameScreen.tsx` - Complete layout refactor

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Added hover tooltips to histogram bars

**Problem:** Users couldn't see the exact values represented by histogram bars without hovering.

**Solution:** Added hover functionality to histogram bars:

1. When hovering over a bar, a tooltip appears showing the bin range and count (e.g., "20-29: 5")
2. Non-hovered bars dim to 50% opacity to highlight the focused bar
3. Used React state to track which bar is hovered
4. Tooltip is positioned above the bars and centered

**Files changed:**

- `src/components/Histogram.tsx` - Added useState for hoveredBin, tooltip rendering, onMouseEnter/onMouseLeave handlers, and opacity transition

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Made histograms more granular

**Problem:** Histograms on the statistics screen used 5-12 bins which didn't provide enough granularity to see the distribution of scores clearly.

**Solution:** Increased the bin count range from 5-12 to 10-20 bins, allowing for more detailed visualization of score distributions.

**Files changed:**

- `src/components/Histogram.tsx` - Changed binCount calculation from `Math.min(12, Math.max(5, data.length))` to `Math.min(20, Math.max(10, data.length))`

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Restructured statistics card with separate move and game score sections

**Problem:** Player statistics cards showed a grid of stats (Games, Wins, Best game, Avg game, Avg move, Best move, Moves) which was visually cluttered and didn't clearly separate move-level and game-level statistics.

**Solution:** Reorganized each player's statistics card into two distinct sections:

1. **Move Scores** - Shows histogram with avg and best values on the right
2. **Game Scores** - Shows histogram with avg and best values on the right

Each section has:

- A section header ("Move scores" / "Game scores")
- The histogram on the left (using full available width)
- Avg and best values stacked vertically on the right

Also made the Histogram component's `label` prop optional, since the section headers now provide context.

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Restructured player card layout with two sections
- `src/components/Histogram.tsx` - Made label prop optional, conditionally render label only when provided

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Fixed histogram axis labels overlapping

**Problem:** Histogram x-axis labels were bumping into each other because labels were positioned absolutely with centering (-translate-x-1/2), causing the edge labels to overlap or extend beyond the container.

**Solution:** Simplified the x-axis label rendering to use flexbox with `justify-between` to naturally align the min label on the left and max label on the right. Removed the `getXAxisTicks()` function and complex positioning logic. Now only shows the min and max values, which prevents overlap.

**Files changed:**

- `src/components/Histogram.tsx` - Replaced absolute positioning with flexbox, removed unused `getXAxisTicks` function

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Made histogram axes start at zero with round max numbers

**Problem:** Histogram axes were using the actual min/max values from the data, which could result in awkward starting points and non-round numbers on the axis labels.

**Solution:** Changed the histogram ranges in StatisticsScreen to always start at 0 and round up the max value to a nice round number (10, 20, 50, 100, 200, 500, etc.). Added a `roundUpToNice()` helper function that chooses multipliers of 1, 2, 5, or 10 at the appropriate magnitude.

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Added `roundUpToNice()` function and updated `histogramRanges` to use min: 0 and round max values

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Added x-axis line to histograms

**Problem:** Histograms on the statistics screen showed tick labels at the bottom but didn't have a visible x-axis line, making the chart look incomplete.

**Solution:** Added a 1px horizontal line (`h-px bg-neutral-300`) between the histogram bars and the axis labels to provide a clear visual baseline for the chart.

**Files changed:**

- `src/components/Histogram.tsx` - Added x-axis line div in both the single-value case and the normal histogram case

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Removed ranking header and ordinal badges from statistics screen

**Problem:** The statistics screen had a "Player rankings / X games" header line and ordinal rank badges (1, 2, 3...) next to each player's name, which added visual clutter.

**Solution:** Removed the "Player rankings" header with the game count, and removed the ordinal rank badge circles next to player names. Player cards now just show the name on the left and win rate on the right.

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Removed ranking header div and ordinal rank badge elements, removed unused `cx` import

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Excluded cresta-yorra game from test game generation

**Problem:** The cresta-yorra-2006.gcg file (the highest scoring Scrabble game of all time with scores of 830 to 490) was included in the test game generation, which skewed the statistics on the statistics screen with unrealistic outlier values.

**Solution:** Removed the cresta-yorra-2006 import and entry from `gcgData.ts`. The file is still retained in the `e2e/games/` directory and used by the score verification tests (which have their own hardcoded list of GCG files), but it's no longer included when creating test games via the "Create test games" button.

**Files changed:**

- `src/lib/gcgData.ts` - Removed cresta-yorra-2006 import and array entry

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Added white background and drop shadow to statistics player cards

**Problem:** Player cards on the statistics screen used a plain border (`border`) without a background color, making them look flat compared to other elements in the app that use white backgrounds with drop shadows.

**Solution:** Changed the player card styling from `rounded-lg border p-4` to `rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.1)]`. This gives the cards a white background with a subtle drop shadow that matches the elevated look of player panels in the game screen.

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Updated player card className

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Removed border under header

**Problem:** The `Header` component had a `border` prop that added a bottom border (`border-b`), and it was being used in `TileBagScreen` and `EndGameScreen`. This created an unnecessary visual element.

**Solution:** Removed the `border` prop from all usages and from the Header component itself:

1. Removed `border` from `<Header>` in `TileBagScreen.tsx`
2. Removed `border` from `<Header>` in `EndGameScreen.tsx`
3. Removed the `border` prop and related logic from `Header.tsx`

**Files changed:**

- `src/components/TileBagScreen.tsx` - Removed `border` prop from Header
- `src/components/EndGameScreen.tsx` - Removed `border` prop from Header
- `src/components/Header.tsx` - Removed `border` prop entirely

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Made games completed count less prominent on statistics screen

**Problem:** The "games completed" block on the statistics screen was too prominent - it was displayed as a large centered block with a 3xl font size and rounded background, taking up unnecessary visual space.

**Solution:** Replaced the large prominent block with a subtle inline display:

1. When player stats are shown: Added "X games" text next to the "Player rankings" header, right-aligned in a small gray font
2. When no player stats yet: Added "X games completed" below the "Complete at least 3 games" message in a subtle style

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Removed prominent summary block, added subtle inline count in both states
- `e2e/tests/statistics.test.ts` - Updated test to look for new text format

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Randomized starting player in test game generation

**Problem:** Test games always had Alice (player1 in GCG files) playing first. This made the test games less varied and didn't test the scenario where Bob starts first.

**Solution:** Added a `swapPlayers` option to the test game creation functions:

1. `convertGcgToMoves` now accepts a `swapPlayers` parameter that swaps player indices
2. `createTestGame` now accepts a `swapPlayers` option and also swaps the player order in the game document
3. `createTestGames` randomly sets `swapPlayers` for each game using `Math.random() < 0.5`

**Files changed:**

- `src/lib/createTestGame.ts` - Added swapPlayers parameter and random selection

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Added move score statistics to statistics screen

**Problem:** The statistics screen showed game-level statistics (games played, wins, avg game score, best game score) but didn't show move-level statistics, which are useful for understanding a player's per-move performance.

**Solution:** Extended the PlayerStats type and statistics calculation to include:

1. `avgMoveScore` - Average score across all moves
2. `maxMoveScore` - Best single move score

Updated the UI to display these in a reorganized two-row stats grid:

- Row 1: Games, Wins, Best game (3 columns)
- Row 2: Avg game, Avg move, Best move, Moves (4 columns)

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Added avgMoveScore and maxMoveScore to PlayerStats type, calculation, and display

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Added x-axis to histogram component

**Problem:** The histograms on the statistics screen showed min/max values at the bottom with the label in the middle, but didn't have a proper x-axis with tick marks to help users understand the scale.

**Solution:** Restructured the Histogram component to show:

1. Label at the top (moved from bottom)
2. X-axis with tick marks below the bars showing min, middle (if range is large enough), and max values
3. Used absolute positioning for tick marks with percentage-based placement

The changes make the histograms more readable and easier to interpret.

**Files changed:**

- `src/components/Histogram.tsx` - Restructured layout, added `getXAxisTicks` helper function

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Use same axes for all player histograms

**Problem:** On the statistics screen, each player's histogram calculated its own min/max from its own data. This made it difficult to compare players visually since the scales were different.

**Solution:** Added `minValue` and `maxValue` props to the `Histogram` component, then calculated shared ranges across all players in `StatisticsScreen`. Now all move score histograms share the same axis, and all game score histograms share the same axis, making visual comparison meaningful.

**Files changed:**

- `src/components/Histogram.tsx` - Added optional `minValue` and `maxValue` props
- `src/components/StatisticsScreen.tsx` - Calculate shared ranges and pass to Histogram components

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Changed New game button icon to layout-grid-add

**Problem:** The New game button used a sparkles icon (IconSparkles) which didn't clearly convey "new game" semantics.

**Solution:** Replaced IconSparkles with IconLayoutGridAdd, which better represents creating a new game grid.

**Files changed:**

- `src/components/HomeScreen.tsx` - Changed icon import and usage

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Created reusable Header component

**Problem:** Headers across different screens were implemented inconsistently with duplicated code. Each screen had its own ad-hoc header implementation with back buttons, titles, and right-side content arranged differently.

**Solution:** Created a reusable `Header` component that provides:

- Optional back button (via `onBack` prop)
- Optional title (via `title` prop)
- Optional right-side content (via `rightContent` prop)
- Optional border-bottom (via `border` prop)

Updated all screens to use the new Header component:

- `StatisticsScreen.tsx` - Uses Header with title and back button
- `TileBagScreen.tsx` (UnplayedTilesScreen) - Uses Header with title, back button, and border
- `EndGameScreen.tsx` - Uses Header with title, back button, and border
- `PlayerSetupScreen.tsx` - Uses Header with title "New game" and back button
- `PastGameScreen.tsx` - Uses Header with back button, border, and date on right side
- `GameScreen.tsx` - Uses Header with back button and undo/redo buttons on right (or cancel/save when editing)

**Files changed:**

- `src/components/Header.tsx` - New component
- `src/components/StatisticsScreen.tsx` - Updated to use Header
- `src/components/TileBagScreen.tsx` - Updated to use Header
- `src/components/EndGameScreen.tsx` - Updated to use Header
- `src/components/PlayerSetupScreen.tsx` - Updated to use Header
- `src/components/PastGameScreen.tsx` - Updated to use Header
- `src/components/GameScreen.tsx` - Updated to use Header
- `CLAUDE.md` - Added Header component to project structure

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Removed "Back" text from back button

**Problem:** The back button had both an arrow icon and the word "Back", which was redundant and took up more space than necessary.

**Solution:** Removed the "Back" text, leaving just the left arrow icon. Added `aria-label="Back"` to maintain accessibility for screen readers and to keep Playwright tests working (they find buttons by accessible name).

**Files changed:**

- `src/components/BackButton.tsx` - Removed text, added aria-label

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Increased padding on xs buttons

**Problem:** XS-sized buttons had minimal horizontal padding (8px/6px with icons), making them feel cramped and inconsistent with the rest of the UI.

**Solution:** Increased horizontal padding for xs buttons:

- Changed from `px-2` (8px) to `px-3` (12px)
- Changed from `px-1.5` (6px) to `px-2.5` (10px) for buttons with icons

This gives xs buttons slightly more breathing room while maintaining their compact size.

**Files changed:**

- `src/components/ui/button.tsx` - Updated xs size variant padding

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Word form lookup for dictionary definitions

**Problem:** When displaying check or challenge results, some words (like "AAHED", "AAHING") showed "no definition" because they are forms of a base word (like "AAH") and the dictionary entry only has a crossRef to the base word, not the full definition.

**Solution:** Enhanced word lookup to follow crossRef links:

1. Added `getWordDefinitionWithFallback` function that checks if a word has no definitions but has a crossRef
2. If crossRef exists, it looks up the base word and returns its definitions
3. Updated the `WordWithDefinition` component to display both the word form and base word (e.g., "AAHED (form of AAH): to exclaim in surprise")

**Files changed:**

- `src/lib/wordList.ts` - Added `getWordDefinitionWithFallback` function and `WordDefinitionResult` type
- `src/lib/wordList.test.ts` - New unit tests for word form lookup
- `src/components/GameScreen.tsx` - Updated to use `getWordDefinitionWithFallback` and display base word reference

**Tests:** All 140 Playwright tests and 104 unit tests pass.

---

### 2026-01-12: Standardized player names in test games to Alice and Bob

**Problem:** Test games created from GCG files used various player names (Brian/Elise, Noah/Mike, Jerry/Noah, Kaia/Heidi Robertson, Yorra/Cresta, etc.), making it harder to follow the games and less consistent for testing.

**Solution:** Updated all GCG files to use "Alice" for player1 and "Bob" for player2. This standardization makes test games more predictable and easier to follow.

**Files changed:**

- `e2e/games/anno57595.gcg` - Changed Brian/Elise to Alice/Bob
- `e2e/games/anno57629.gcg` - Changed Noah/Mike to Alice/Bob
- `e2e/games/anno57680.gcg` - Changed Caleb Pittman/Anita Rackham to Alice/Bob
- `e2e/games/anno57691.gcg` - Changed Jerry/Noah to Alice/Bob
- `e2e/games/anno57697.gcg` - Changed Noah/Keith to Alice/Bob
- `e2e/games/anno57701.gcg` - Changed Noah/Jason to Alice/Bob
- `e2e/games/anno57721.gcg` - Changed Jackson Smylie/Steve Bush to Alice/Bob
- `e2e/games/anno57741.gcg` - Changed Kaia/Heidi Robertson to Alice/Bob
- `e2e/games/cresta-yorra-2006.gcg` - Changed Wayne Yorra/Michael Cresta to Alice/Bob
- `e2e/games/near-end-game.gcg` - Already had Alice/Bob (no change)

**Tests:** All 140 Playwright tests and 98 unit tests pass.

---

### 2026-01-12: Added 10% white background to transparent buttons

**Problem:** Ghost variant buttons (used for Back, Undo, and Redo buttons) were completely transparent with no background, which could make them hard to see against various backgrounds.

**Solution:** Added a subtle 10% white background (`bg-white/10`) to the ghost button variant in the button component. This provides just enough visual presence while maintaining the "ghost" aesthetic.

**Files changed:**

- `src/components/ui/button.tsx` - Updated ghost variant to include `bg-white/10`

**Tests:** All 140 Playwright tests and 98 unit tests pass.

---

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
