### To do

- [ ] Add an explicit "pass" button and use that in playwright replay tests
- [ ] The "Create test game" button should be smaller, should be at the bottom of the screen, and should say "Create test games". It should create as many test games as we have gcg files. Two of them should be in progress. One of the in progress games should be done except for the last move.
- [ ] The buttons are too round
- [ ] The buttons' drop shadow should always be a darker version of the button color
- [ ] Lose the "Score keeper for word games" subtitle
- [ ] The drop shadows for the buttons in the footer are getting cut off
- [ ] The player panels should have drop shadows too
- [ ] The keys on the virtual keyboard should have drop shadows too
- [ ] On the tiles screen, the counts should be below the header and flush left
- [ ] The choose-a-letter-for-a-wildcard interface is janky. Wait until the move is committed, then show a dialog that asks for the missing letter or letters by showing the word with blank(s) to be filled in. We don't need a button for every letter - we already have a virtual keyboard, just ask the user to type the missing letter(s). The "Done" button on the keyboard finishes committing the move.
- [ ] On the home page add a "statistics" button: it should show how many games each player has won out of the total number of games played, and visualizations analyzing each player's distribution of move scores and game scores. Only players with more than two games should be included.

---

### Done

- [x] When entering tiles, the backspace should skip over tiles that were already on the board. I should be able to backspace my entire entry, even where it spans existing tiles. Currently I can backspace up until the first existing tile we encounter, then I have to manually click on the remaining tiles to continue backspacing.
