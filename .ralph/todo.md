### To do

(empty)

### Done

- [x] Refactor PastGameScreen to use same layout as GameScreen
  - [x] Use the same player panel structure (header + move history)
  - [x] Show winner indicator on the winning player's panel
  - [x] Use same horizontal scrolling footer with action buttons
  - [x] Move delete button to footer
  - [x] Board should be read-only (no editing capability)
  - [x] Remove header date display

- [x] show histogram values when hovering over bars
- [x] make the histograms a little more granular
- [x] make two separate sections on each player's statistics card - move scores and game scores, each with a histogram, average, and best. Get rid of the game, win, and move counts.

- [x] Fix histogram axis labels bumping into each other
- [x] Make histogram axes start at zero and go up to round numbers
- [x] On histograms, show x axis as a line without ticks
- [x] On the statistics screen, remove "Player rankings / X games" header and ordinal rank badges
- [x] Exclude cresta-yorra game from test games (it's the highest scoring game of all time and skews statistics)
- [x] On the statistics screen, give each player's card a white background and a drop shadow.
- [x] Get rid of border under header
- [x] On the statistics screen, make the "games completed" block much less prominent
- [x] When generating test games, randomize whether Alice or Bob starts first
- [x] On the statistics screen, show average and maximum move scores in addition to game scores
- [x] On the statistics screen, use the same axes for each player's histograms
- [x] Use the layout-grid-add icon for the new game button
- [x] Make a header component for consistency, and use it throughout
- [x] Remove the word "Back" from the back button
- [x] Add a little padding around the xs buttons
- [x] When a word in the dictionary doesn't have a definition, it's probably because it's a form of another word. Look up the other word and use its definition (when displaying check or challenge results)
- [x] The names on the test games should all be Alice and Bob
- [x] Buttons that are currently transparent should have a 10% white background
- [x] No need for a confirmation when pressing the pass button - you can always undo
- [x] The "Create test game" button should be smaller, should be at the bottom of the screen, and should say "Create test games". It should create as many test games as we have gcg files. Two of them should be in progress. One of the in progress games should be done except for the last move.
- [x] On the home page add a "statistics" button: it should show how many games each player has won out of the total number of games played, and visualizations analyzing each player's distribution of move scores and game scores. Only players with more than two games should be included.
- [x] On the tiles screen, the counts should be below the header and flush left
- [x] The keys on the virtual keyboard should have drop shadows too
- [x] The player panels should have drop shadows too
- [x] The choose-a-letter-for-a-wildcard interface is janky. Wait until the move is committed, then show a dialog that asks for the missing letter or letters by showing the word with blank(s) to be filled in. We don't need a button for every letter - we already have a virtual keyboard, just ask the user to type the missing letter(s). The "Done" button on the keyboard finishes committing the move.
- [x] When entering tiles, the backspace should skip over tiles that were already on the board. I should be able to backspace my entire entry, even where it spans existing tiles. Currently I can backspace up until the first existing tile we encounter, then I have to manually click on the remaining tiles to continue backspacing.
- [x] Add an explicit "pass" button and use that in playwright replay tests
- [x] Remove "Score keeper for word games" subtitle from home screen
- [x] The buttons' drop shadow should always be a darker version of the button color
- [x] The drop shadows for the buttons in the footer are getting cut off
- [x] The buttons are too round
