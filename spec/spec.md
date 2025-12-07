# Scrabble score keeper

This is a web application designed to be used by people playing Scrabble in person on a physical board.

## Features

### Scoring

A player can enter moves on an on-screen scrabble board. The app scores each move and keeps track of each player's running score.

### Timekeeping

The app has a chess-style clock where each player has N minutes available, and their thinking time for each turn is deducted from their total time. The clock can be paused and restarted.

### Sharing

Multiple players can see the same game and keep score collaboratively. 7This is done in a local-first way: Game data is stored locally and synced.

## Interface

<img src='./1.png' width='300'>

On opening the app, I can start a new game, resume an ongoing game, or see past games.

<img src='./2.png' width='300'>

The first thing I have to do is identify the players.

<img src='./3.png' width='300'>

I can enter a new player name, or choose a name that's been used in a previous game. (These are listed in descending order of frequency.)

<img src='./4.png' width='300'>

Once I've entered all the player names, I can start the game.

<img src='./5.png' width='300'>

I explicitly start the timer once the first player is ready.

<img src='./6.png' width='300'>

After each turn, I enter the word played onto the board and the next player's clock activates.
