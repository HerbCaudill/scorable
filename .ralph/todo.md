### To do

- [ ] the "apply and end game" footer background should be transparent, not white
- [ ] bump up the text size in the scoresheet

End game screen:

- [ ] When I touch a tile on a player's rack, it should display an X icon in the corner, which moves it to the unaccounted list
- [ ] Remove the borders and padding from the player divs
- [ ] Support drag and drop between the players' racks and the unaccounted list

### Done

- [x] show the tiles that haven't been accounted for. If one of the players' input is focused, tapping on one of those tiles should move it to their rack
- [x] when the fake input is focused and we're "typing" tiles, we need a fake cursor
- [x] All drop shadows should be the same color as the element's border
- [x] not getting a keyboard on mobile (EndGameScreen)
- [x] not seeing the Cancel/Apply & end game buttons on mobile (EndGameScreen)
- [x] don't need a focus ring on the tile inputs, make the border itself teal (EndGameScreen)

- [x] Describe this application in the README.
- [x] When importing games, populate the letter represented by blank tiles
- [x] Allow about 1em of vertical space between the average game score label and the chart itself, but extend the line all the way to the label
- [x] The average word score line should start at the x-axis and go all the way up to the label. Currently it extends below the x-axis and ends below the label.
- [x] The line should go from the best game score label to the best game score dot (currently it extends above the dot and below the label)
- [x] Clicking on the best game score label should focus the corresponding dot and display the tooltip
- [x] On the move score chart, just right-align the label (e.g. `best: ZESTY (88)`) rather than anchoring it to a point on the chart
- [x] The header needs a little bit of vertical spacing
- [x] If I add a blank tile when correcting, I should see the same UI for specifying the letter as I do when entering a move in the first place
- [x] Make the "ghost" letter that a blank tile represents yellow instead of gray, both in the scoresheet and the game board
- [x] the header doesn't need that much vertical padding
- [x] link game score tooltips to the game
- [x] draw a line from best game score label to that game's dot
- [x] on the chart, center the `avg: X` label on the line. And allow enough space at the top of the chart so the label doesn't overlap with any of the chart elements
- [x] Show more ticks on axes
- [x] Don't show tooltips on word score histograms
- [x] For best moves score, include words
- [x] New game: focus next player automatically until there are two players
- [x] On histogram, bars should abut x-axis. On game score chart, spacing between dots and axis should match spacing between dots
- [x] Test games button is too low on the screen on iPhone
- [x] make the ring around the active player panel just 1 px
- [x] show the test games button if there are no games (not only on first run)
- [x] the "create test games" button should only appear on first use
- [x] make padding around the app consistent - on the game screen, the arrow and the board and the first panel and the first button should all be left-aligned
- [x] when correcting, the "Editing move" heading as well as the cancel/save buttons should use the standard header component
- [x] Find some games that include both failed and successful challenges
- [x] Change the name of the app to Scorable throughout the repo
- [x] Fix scrolling on past games list and statistics page
- [x] add more vertical padding around each player's statistics
- [x] Add a little padding inside the average and best labels, as well as margin around them
- [x] Make average and best scores bold (just the number, not the text part of the label)
- [x] Make the move scores chart a bit taller, and add some padding at top so that the average label isn't touching any of the elements of the chart itself
- [x] Make the vertical lines showing the average 1px thick and a darker version of the graph color. Give the average and best labels a solid color background of that same color.
- [x] The move score chart should go back to being a histogram - there are just too many moves
- [x] On the statistics page add colons after `avg` and `best`
- [x] On the statistics page sometimes the avg and best labels overlap each other. let's put the avg label on the top of the chart, flush left against the line
- [x] Position tooltips next to the selected dot instead of fixed position above chart
- [x] Enable scrolling on the list of past games
- [x] The average/best score labels should be one increment larger, and the numbers on the axis should be smaller
- [x] The drop shadows on the player panels on the statistics page should be solid and horizontally centered, like they are on other elements
- [x] Make the vertical line for average scores more prominent. For the best scores, we don't need a line - just the label
- [x] Add more space between the move score and game score sections, and make the headings bold
- [x] On the statistics page, move & game info should appear on tap or click rather than hover (since this is primarily used on mobile)
- [x] fix footer buttons z-index - currently showing up in front of the backdrop for dialogs
- [x] When hiding mobile keyboard, click event also passes to the delete button below the keyboard
- [x] insufficient tiles dialog: Show the tile component rather than just the letter, and change wording to "[tile]: none left" or "[tile]: X entered, but only Y left"
