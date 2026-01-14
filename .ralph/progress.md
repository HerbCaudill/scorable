## Progress log

### 2026-01-14: Disabled tooltips on move score histograms

**Problem:** The move score histograms on the statistics page showed tooltips when hovering over bars. Since there are many moves per player and the histogram already shows the distribution visually, tooltips were unnecessary noise that distracted from the important information (avg and best scores).

**Solution:** Added a `showTooltip` prop to the Histogram component that defaults to `true` for backward compatibility. When `false`:

1. The tooltip element is not rendered
2. Hover handlers are not attached to bars
3. The cursor doesn't change to pointer on hover
4. Bars don't dim when hovering other bars

Updated StatisticsScreen to pass `showTooltip={false}` to the move score Histogram.

**Files changed:**

- `src/components/Histogram.tsx` - Added `showTooltip` prop, conditionally render tooltip and hover handlers
- `src/components/StatisticsScreen.tsx` - Pass `showTooltip={false}` to move scores Histogram

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Refactored edit mode header to use standard Header component

**Problem:** When correcting a move, the "Editing move" heading was displayed as a separate `<div>` below the header, and the cancel/save buttons were custom-styled inline. This was inconsistent with other screens that used the standard `Header` component.

**Solution:** Updated GameScreen to use the Header component properly in edit mode:

1. **Title in header** - Moved "Editing move" text to the Header's `title` prop instead of a separate div
2. **Back button as cancel** - The back button now triggers `handleCancelEdit` when in edit mode (using the standard `BackButton` component from Header)
3. **Save button** - Simplified from "Save edit" to just "Save" in the right content area
4. **Removed separate cancel button** - No longer needed since back button serves this purpose

This makes the edit mode header consistent with other screens like EndGameScreen and TileBagScreen.

**Files changed:**

- `src/components/GameScreen.tsx` - Updated Header usage for edit mode, removed separate "Editing move" div, removed IconX import
- `e2e/pages/game.page.ts` - Updated `cancelEdit()` to click the "Back" button, updated `saveEdit()` to look for "Save" instead of "Save edit"

**Tests:** All 143 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Documented GCG games with challenge notation

**Task:** Find GCG games that include both failed and successful challenges.

**Findings:**

The GCG format distinguishes between two challenge outcomes:

- **Successful challenge** (invalid word removed): Notation is `>Player: RACK -- -SCORE CUMULATIVE`
- **Failed challenge** (valid word kept, challenger loses points): Notation is `>Player: RACK (challenge) +BONUS CUMULATIVE`

**Existing file with both challenge types:**

`e2e/games/ct17123.gcg` already contains both types of challenges:

- Lines 7 and 16: Successful challenges with `-- -15` and `-- -31` (word was invalid, removed from board)
- Line 30: Failed challenge with `(challenge) +5` (word was valid, challenger lost 5 points)

This file can be used for testing challenge functionality in the app.

**Other files with challenges:**

- `anno57595.gcg`: Two failed challenges only (`(challenge) +5`)
- `anno57741.gcg`: One failed challenge only (`(challenge) +5`)
- `ct38790.gcg`: One successful challenge only (`-- -80`)
- `cresta-yorra-2006.gcg`: One successful challenge only (`-- -70`)

**Note:** The current GCG parser (`src/lib/parseGcg.ts`) handles the `--` notation for successful challenges but does not yet handle the `(challenge)` notation for failed challenges. This may need to be implemented if challenge testing is expanded.

---

### 2026-01-13: Renamed app to "Scorable"

**Task:** Change the name of the app from "Scrabble" to "Scorable" throughout the repository.

**Changes made:**

1. **package.json** - Changed `name` from "scrabble" to "scorable"
2. **index.html** - Updated `<title>` and `apple-mobile-web-app-title` meta tag to "Scorable"
3. **vite.config.ts** - Updated PWA manifest `name`, `short_name`, and `description` to use "Scorable" and generic wording
4. **src/lib/gameStore.ts** - Changed storage key from "scrabble-game-storage" to "scorable-game-storage"
5. **src/lib/localStore.ts** - Changed storage key from "scrabble-local-storage" to "scorable-local-storage"
6. **src/lib/repo.ts** - Changed IndexedDB storage name from "scrabble-games" to "scorable-games"
7. **e2e/fixtures/seed-game.ts** - Updated storage key reference for tests
8. **CLAUDE.md** - Updated app title and description

**Note:** Internal code references (like `ScrabbleBoard` component name, comments explaining game rules, and the `@herbcaudill/scrabble-words` dictionary package) were intentionally kept unchanged as they are technical identifiers rather than user-facing branding.

**Tests:** All 143 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Added more vertical padding around player statistics cards

**Problem:** The player statistics cards on the statistics screen felt cramped vertically. The padding inside cards was equal on all sides (`p-4`) and the gap between cards was only 16px.

**Solution:** Increased vertical spacing in the StatisticsScreen:

1. Changed player card padding from `p-4` to `px-4 py-6` (more vertical padding inside cards)
2. Changed gap between cards from `gap-4` to `gap-6` (more space between cards)

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Updated card and container classes

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Added padding inside avg/best labels and margin around them

**Problem:** The avg and best score labels on the statistics page charts had minimal internal padding (`px-1` only) and no vertical padding, making them look cramped. The labels also needed more margin/space around them for better visual separation.

**Solution:** Updated both DotPlot and Histogram components:

1. **Internal padding** - Changed label padding from `px-1` to `px-1.5 py-0.5` for better internal spacing
2. **Avg label margin** - Increased top padding of chart container from `pt-5` to `pt-6` in Histogram to give more space for the avg label
3. **Best label margin** - Moved best label down from `top-3` to `top-4` and increased axis labels container height from `h-4` to `h-10` to accommodate the label with space below the axis numbers
4. **Reference line positioning** - Updated reference line from `top-5` to `top-6` in Histogram to match new container padding

**Files changed:**

- `src/components/Histogram.tsx` - Updated label padding, container padding, axis labels height, and reference line position
- `src/components/DotPlot.tsx` - Updated label padding and axis labels height

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Made average and best score numbers bold in labels

**Problem:** The average and best score labels on the statistics page (e.g., "avg: 25", "best: 40") displayed both the text and the number in the same font weight, making it hard to quickly scan the key values.

**Solution:** Updated the `ReferenceLine` type in both Histogram and DotPlot components to include an optional `labelValue` property. When provided, the value is rendered in bold (`font-bold`) after the label text. Updated StatisticsScreen to pass the label text (e.g., "avg:") separately from the numeric value, so the numbers appear bold while the text stays regular weight.

**Files changed:**

- `src/components/Histogram.tsx` - Added `labelValue` property to ReferenceLine type, render value with `font-bold`
- `src/components/DotPlot.tsx` - Same changes as Histogram
- `src/components/StatisticsScreen.tsx` - Updated referenceLines to use separate `label` and `labelValue` props

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Made move scores histogram taller with padding for avg label

**Problem:** The move scores histogram on the statistics screen was too short at 40px height, and the avg label at the top of the chart was positioned at `top-0` which could cause it to overlap with chart elements.

**Solution:** Updated the Histogram component:

1. Increased chart height from 40px to 56px for better visibility
2. Added `pt-5` (20px) padding at the top of the relative container to create space for the avg label
3. Updated the vertical reference line to start at `top-5` (after the padding) and span 56px height
4. Adjusted tooltip positioning from `-top-6` to `top-0` to work with the new padding

This gives the avg label dedicated space above the chart, ensuring it never touches the histogram bars.

**Files changed:**

- `src/components/Histogram.tsx` - Increased height, added top padding, adjusted reference line and tooltip positioning

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Styled reference lines and labels with graph colors

**Problem:** The vertical reference lines for average scores were 2px thick and neutral gray. The avg/best labels had no background color, making them hard to see against the chart.

**Solution:** Updated both DotPlot and Histogram components:

1. **Vertical lines** - Changed from `w-0.5` (2px) to `w-px` (1px), and from `bg-neutral-500` to graph-colored (`bg-teal-600` for teal charts, `bg-amber-600` for amber charts)
2. **Tick marks** - Same color change as vertical lines
3. **Labels** - Added solid color background matching the graph color (teal-600/amber-600), white text, rounded corners, and horizontal padding (`px-1`)

This creates a cohesive visual style where reference lines and labels match the chart's color scheme.

**Files changed:**

- `src/components/Histogram.tsx` - Updated avg label, best label, vertical lines, and tick marks with graph-colored styling
- `src/components/DotPlot.tsx` - Same changes as Histogram

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Added colons after avg and best labels on statistics page

**Problem:** The avg and best score labels on the dot plot charts said "avg 32" and "best 194" without colons, which looked inconsistent with typical label formatting.

**Solution:** Added colons after "avg" and "best" in all reference line labels in StatisticsScreen.tsx:

- Move scores: `avg: 32`, `best: 45`
- Game scores: `avg: 320`, `best: 389`

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Updated reference line labels to include colons

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Fixed avg/best label overlap on statistics page

**Problem:** The avg and best score labels on the dot plot charts were both positioned on the same row below the x-axis, causing them to overlap when their values were close together.

**Solution:** Moved the avg label to the top of the chart, flush left against the vertical line, while keeping the best label below the x-axis:

1. Added avg labels at the top of the chart area, positioned `top-0` with `left: calc(xPos% + 4px)` to be flush right of the vertical line
2. Best labels remain below the axis with `top-3` positioning
3. Labels now have clear separation and never overlap

**Files changed:**

- `src/components/DotPlot.tsx` - Split label rendering: avg at top of chart, best below axis

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Positioned dot plot tooltips next to selected dot

**Problem:** When clicking a dot on the statistics page dot plots, the tooltip was always positioned in a fixed location above the center of the chart. Users had to look back and forth between the tooltip and the selected dot to understand which data point they were viewing.

**Solution:** Modified the tooltip positioning in the DotPlot component to appear directly above the selected dot:

1. Moved the tooltip inside the chart div (same container as dots) so `bottom` positioning works correctly
2. Calculate tooltip position using the selected dot's `x` percentage and `stackIndex`
3. Position tooltip at `bottom: stackIndex * dotSpacing + dotSize + 4` (4px gap above the dot)
4. Use `left: selectedDot.x%` with `-translate-x-1/2` to center the tooltip horizontally over the dot

The tooltip now appears right above whichever dot is selected, making it immediately clear which data point the user is viewing.

**Files changed:**

- `src/components/DotPlot.tsx` - Moved tooltip inside chart div, calculate position from selected dot

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Enabled scrolling on past games list

**Problem:** The list of past games on the home screen could overflow the viewport when there were many games, with no way to scroll through them.

**Solution:** Made the past games section scrollable:

1. Added `min-h-0 flex-1` to the past games container so it can shrink and expand within the flex layout
2. Added `overflow-y-auto` to the list itself to enable vertical scrolling
3. Made the spacer conditional - only renders when there are no past games (so the test button stays at bottom)

The past games section now takes up available space and scrolls when the list is too long to fit.

**Files changed:**

- `src/components/HomeScreen.tsx` - Added flex-1/min-h-0 to section, overflow-y-auto to list, conditional spacer

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Made avg/best labels larger and axis numbers smaller

**Problem:** The reference line labels (avg/best) on the dot plots were the same size as the axis numbers, making them hard to distinguish. The task was to make the labels more prominent and the axis numbers less prominent.

**Solution:** In the DotPlot component:

1. Changed axis numbers (0, 100, 500) from `text-xs` to `text-[10px]` (smaller)
2. Changed reference line labels (avg/best) from `text-[10px]` to `text-xs` (larger)

This creates a clearer visual hierarchy where the important reference values stand out more than the scale markers.

**Files changed:**

- `src/components/DotPlot.tsx` - Swapped font sizes for axis numbers and reference labels

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Changed statistics player panel shadows to solid

**Problem:** The drop shadows on the player panels in the statistics page used a blurry spread shadow (`shadow-[0_2px_8px_rgba(0,0,0,0.1)]`) which looked inconsistent with other elements in the app that use solid, horizontally centered shadows.

**Solution:** Changed the shadow style from `shadow-[0_2px_8px_rgba(0,0,0,0.1)]` to `shadow-[0_3px_0_0_rgba(0,0,0,0.1)]`. This creates a solid shadow directly below the panel with no blur or spread, matching the style used on buttons and the logo tile.

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Updated player card shadow class

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Made avg line prominent, removed line for best scores

**Problem:** On the statistics page dot plots, both the average and best score reference lines had identical dashed line styling, making it hard to distinguish between them. Users wanted the average line to be more prominent and the best score to only show a label (no line).

**Solution:** Added a `type` property to the `ReferenceLine` type that can be `"avg"` or `"best"`:

1. **Average lines** - Show a solid 2px line (`w-0.5 bg-neutral-500`) and tick mark, more prominent than before
2. **Best lines** - Only show the label below the axis, no vertical line or tick mark

The filtering is done by checking `line.type !== "best"` when rendering vertical lines and tick marks.

**Files changed:**

- `src/components/DotPlot.tsx` - Added `type` property to ReferenceLine, filter out "best" type from vertical line and tick mark rendering, made lines solid and darker
- `src/components/StatisticsScreen.tsx` - Added `type: "avg"` and `type: "best"` to reference lines for both move and game score dot plots

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Added more space between statistics sections and made headings bold

**Problem:** The Move scores and Game scores sections on the statistics page were too close together, and the section headings weren't visually prominent enough.

**Solution:**

1. Increased margin between sections from `mb-4` to `mb-6`
2. Changed heading font weight from `font-medium` to `font-bold`

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Updated section margin and heading font weight

**Tests:** All 142 Playwright tests and 104 unit tests pass.

---

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

---

### 2026-01-13: Fixed scrolling on past games list and statistics page

**Problem:** The list of past games on the home screen and the statistics page content couldn't be scrolled when there was more content than fit in the viewport. The root elements had `h-dvh overflow-hidden` set globally, but the inner screen containers used `min-h-screen` which allowed them to expand infinitely instead of becoming scrollable.

**Solution:** Fixed the flexbox layout constraints to enable proper scrolling:

1. **HomeScreen.tsx:**
   - Changed outer container from `min-h-screen` to `h-full` (respects parent's fixed height)
   - Added `min-h-0` to the inner flex container (allows it to shrink below content size)
   - Added `min-h-0 flex-1` to the past games scrollable container
   - Added `scrollbar-none` class to hide scrollbars while keeping scroll functionality

2. **StatisticsScreen.tsx:**
   - Changed outer container from `min-h-screen` to `h-full overflow-y-auto`
   - Added `scrollbar-none` class to hide scrollbars
   - Added `pb-6` to inner container for bottom padding

3. **New Playwright test:**
   - Added "past games list container has proper overflow styling" test to verify CSS properties

**Files changed:**

- `src/components/HomeScreen.tsx` - Updated flex layout for scrolling
- `src/components/StatisticsScreen.tsx` - Updated flex layout for scrolling
- `e2e/tests/past-games.test.ts` - Added test for scroll container styling

**Tests:** All 143 Playwright tests and 104 unit tests pass.

---

### 2026-01-13: Made padding around the app consistent

**Problem:** On the game screen, different elements had inconsistent left alignment:

- The Header component had its own internal `p-2` padding, adding extra spacing
- The board was centered within its container rather than left-aligned
- This caused the back arrow, board, player panels, and action buttons to not align with each other

**Solution:** Removed internal padding from elements to let the container handle spacing:

1. **Header.tsx** - Removed `p-2` from the internal flex container. The Header now has no internal padding, allowing the parent container to control spacing.

2. **GameScreen.tsx** - Removed `flex flex-col items-center` from the board area wrapper, leaving just `w-full`. The board now fills its container width and aligns with other elements.

The main container's `p-2` now provides consistent 8px padding for all elements:

- Back arrow
- Board
- Player panels (via `-mx-2 px-2` for horizontal scroll)
- Action buttons (via `-mx-2 px-2` for horizontal scroll)

**Files changed:**

- `src/components/Header.tsx` - Removed `p-2` from flex container
- `src/components/GameScreen.tsx` - Simplified board area wrapper classes

**Tests:** All 143 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Show test games button only when no games exist

**Problem:** The "Create test games" button was always visible at the bottom of the home screen, even when games already existed. It should only appear when there are no games (both active and finished lists are empty).

**Solution:** Added conditional rendering to only show the button and its spacer when `activeGames.length === 0 && finishedGames.length === 0`.

**Files changed:**

- `src/components/HomeScreen.tsx` - Wrapped test games button in conditional render
- `e2e/tests/home-screen.test.ts` - Added two new tests: "shows Create test games button when no games exist" and "hides Create test games button when games exist"

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Made active player panel ring 1px thick

**Problem:** The ring around the active player's panel was 3px thick, which was too prominent and visually heavy.

**Solution:** Changed the box-shadow from `0 0 0 3px ${player.color}` to `0 0 0 1px ${player.color}` for the active player panel. The inactive player panels already had 1px rings, so now both states are consistent.

**Files changed:**

- `src/components/GameScreen.tsx` - Changed active player panel ring from 3px to 1px

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Fixed test games button positioning on iPhone

**Problem:** The "Create test games" button was pushed to the very bottom of the screen using a `flex-1` spacer. On iPhone, this made the button too low and potentially awkward to reach, especially with the safe area at the bottom.

**Solution:** Moved the test games button to appear directly below the "New game" button instead of at the bottom of the screen. Removed the `flex-1` spacer that was pushing the button down.

**Files changed:**

- `src/components/HomeScreen.tsx` - Moved test games button into the main actions div, removed spacer

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Fixed histogram and dot plot spacing

**Problem:** Two visual issues with the statistics page charts:

1. Histogram bars had gaps between them and didn't touch the x-axis line due to `gap-1` in the wrapper container and `gap-0.5` between bars
2. The dot plot had inconsistent spacing - dots touched the x-axis (bottom: 0) but there was `gap-1` between the chart and axis

**Solution:** Fixed both components for consistent spacing:

1. **Histogram.tsx:**
   - Removed `gap-1` from the outer wrapper flex container (was creating gap between chart and axis)
   - Removed `gap-0.5` from the bars container so bars abut each other
   - Removed `rounded-t` from bars so they have square tops (better for abutting the axis line visually)

2. **DotPlot.tsx:**
   - Removed `gap-1` from the outer wrapper flex container
   - Added `dotSpacing` padding at the bottom of the chart area so spacing between dots and axis matches the spacing between dots
   - Updated dot positioning to add `dotSpacing` to the bottom position
   - Updated tooltip positioning to account for the new padding

**Files changed:**

- `src/components/Histogram.tsx` - Removed gaps, bars now abut x-axis
- `src/components/DotPlot.tsx` - Added consistent bottom spacing matching dot spacing

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Auto-focus next player slot until two players selected

**Problem:** When setting up a new game, users had to manually click on each player slot to add players. This required extra taps, especially for the common case of adding just two players.

**Solution:** After selecting or adding a player, if fewer than 2 players have been entered, automatically open the dropdown for the next empty slot:

1. In `handleSelectPlayer`, after updating the players array, check if `enteredCount < 2`
2. If so, find the next empty slot (index > current) and set `activeDropdown` to that index
3. If no previous players are available for that slot, also set `isAddingNew = true` to show the input field directly
4. Radix DropdownMenu handles closing the current dropdown and opening the new one when `activeDropdown` state changes

**Page object updates:**

- Added `aria-expanded` check in `clickPlayerSlot` to avoid toggling an already-open dropdown
- Added explicit `waitFor`, `click`, and `fill` sequence for the input to ensure proper focus
- These changes handle the race condition where the dropdown auto-opens but the test also tries to click the slot

**Files changed:**

- `src/components/PlayerSetup.tsx` - Added auto-open logic in `handleSelectPlayer`
- `e2e/pages/player-setup.page.ts` - Updated to handle auto-opened dropdowns correctly

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Show more ticks on axes in statistics charts

**Problem:** The statistics page charts (Histogram and DotPlot) only showed min and max values on the x-axis (e.g., "0" and "100" for move scores, "0" and "500" for game scores). This made it hard to read intermediate values at a glance.

**Solution:** Added a `generateTicks` function to both components that calculates nice round tick values for any axis range:

1. The function determines a nice step size based on the range (aiming for ~4-5 ticks)
2. Steps are rounded to nice values (multiples of 1, 2, 5, 10, 20, 50, etc.)
3. Ticks are placed at round numbers between min and max (e.g., 20, 40, 60, 80 for a 0-100 range)
4. Added tick marks (1px gray lines) on the axis at each tick position
5. Added tick labels below the axis at each position

Results:

- Move scores (0-100): shows 0, 20, 40, 60, 80, 100
- Game scores (0-500): shows 0, 100, 200, 300, 400, 500

**Files changed:**

- `src/components/Histogram.tsx` - Added `generateTicks` function, tick marks on axis, tick labels
- `src/components/DotPlot.tsx` - Added same `generateTicks` function, tick marks on axis, tick labels

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Center avg label on line in statistics charts

**Problem:** The avg labels on the statistics page charts (Histogram and DotPlot) were positioned flush left against the vertical reference line using `left: calc(${xPos}% + 4px)`. The task asked to center the label on the line instead.

**Solution:** Updated both components to center the avg label horizontally on the line:

1. Changed positioning from `left: calc(${xPos}% + 4px)` to `left: ${xPos}%`
2. Added `-translate-x-1/2` class to center the label on that position
3. Increased top padding in Histogram from `pt-6` to `pt-7` to ensure the label doesn't overlap with bars
4. Updated the reference line in Histogram from `top-6` to `top-7` to match the new padding
5. Updated comment to reflect "centered on the vertical line" instead of "flush left against the vertical line"

**Files changed:**

- `src/components/Histogram.tsx` - Centered avg label, increased top padding
- `src/components/DotPlot.tsx` - Centered avg label, updated comment

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Show words in best move score labels

**Problem:** The statistics screen showed the best move score as just a number (e.g., "best: 45"), but users wanted to see which word(s) earned that score.

**Solution:** Extended the statistics calculation to track the word(s) that achieved the best move score:

1. Added `bestMoveLabel` field to `PlayerStats` type to store the word(s) from the best-scoring move(s)
2. After finding moves with the max score, extract word labels from each move's label (format: "WORD for X")
3. If multiple different words achieved the same max score, join them with commas (e.g., "QUIZ, QUAY")
4. Display the best move as "best: WORD (score)" instead of just "best: score"

The label is extracted using a regex match on the existing MoveData.label format.

**Files changed:**

- `src/components/StatisticsScreen.tsx` - Added bestMoveLabel calculation and display

**Tests:** All 145 Playwright tests and 104 unit tests pass.

---

### 2026-01-14: Draw line from best game score label to dot

**Problem:** On the statistics page, the "best" label for game scores was positioned below the x-axis, but it wasn't visually connected to the corresponding dot that represented the best game.

**Solution:** Added a vertical line connecting the "best" label to its corresponding dot in the DotPlot component:

1. When rendering a "best" reference line, find the positioned dot whose value matches the reference line value
2. Calculate the line height from the bottom of the axis labels area up to the dot's position
3. Draw a 1px colored line (amber for game scores) from the label up through the axis to the dot
4. The line uses the same color as other reference lines (`bg-amber-600` for amber charts)

The line makes it immediately clear which dot represents the best game score.

**Files changed:**

- `src/components/DotPlot.tsx` - Added connecting line from "best" label to corresponding dot

**Tests:** All 145 Playwright tests and 104 unit tests pass.
