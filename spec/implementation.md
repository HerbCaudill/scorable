# Implementation Plan - Scrabble Score Keeper

**Approach**: Mobile-first responsive design from the start. All phases include mobile-responsive UI considerations.

**Design Philosophy**: Minimal, monochromatic aesthetic. Focus on clarity and usability over decoration. Use shadcn/ui component patterns for consistency.

**Development Process**: Design and build components in Storybook first for visual validation, then integrate with data models and state management.

## Phase 0: Storybook setup & screen design

- [x] Set up Storybook for React
- [x] Create base component stories (Button, Input, Select, etc.)
- [x] Establish minimal, monochromatic design system in Storybook
- [x] Design and prototype all screens in Storybook:
  - [x] Home screen (new game / past games)
  - [x] Player setup screen
  - [x] Game play screen (board, scores, move entry)
- [x] Document component patterns and usage
- [x] Validate layouts and interactions across screen sizes
- [x] Build reusable component foundations before integration

## Phase 1: Scrabble board UI

- [x] Create 15x15 Scrabble board grid
- [x] Render board squares with correct multipliers:
  - DL (Double Letter): normal (light) square with two dots
  - TL (Triple Letter): normal (light) square with three dots
  - DW (Double Word): reversed (dark) square with two dots
  - TW (Triple Word): reversed (dark) square with three dots
  - A bulls-eye in the center indicating the starting position
- [x] Mobile-responsive board scaling (fits viewport with proper aspect ratio)

## Phase 2: Player setup screen

- [x] Player name input/selection form (up to 4 players)
- [x] Dropdown with previously-used player names (sorted by frequency)
- [x] Support for entering new player names
- [x] "Start game" button (enabled when at least 2 players entered)
- [x] Storybook stories for form states (empty, partial, complete)

## Phase 3: Core data models & state management

- [x] Define TypeScript types for:
  - `Player` (name, score, time remaining)
  - `Game` (players, current turn, board state, history)
  - `Move` (player, word, score, timestamp)
- [x] Set up Zustand store for game state

## Phase 4: Navigation & screens

- [x] Create main router with screens:
  - Home (New game / Resume / Past games)
  - Player setup (enter/select player names)
  - Game play (board, timer, scoring)
- [x] Implement navigation between screens
- [x] Mobile-responsive layout (touch-friendly, full viewport utilization)
- [x] Build screen component stories in Storybook first

## Phase 5: Home screen

- [x] Display "New game" button
- [x] Display "Past games" section with previous game results
- [ ] Implement game resume functionality
- [x] Mobile-responsive layout with proper touch targets (min 44x44px)
- [x] Storybook stories for layout variations (with/without past games)
- [x] Minimal, monochromatic design (black/white/gray only)

## Phase 6: Move entry & scoring

- [x] Interface to enter word played
- [x] Calculate score based on:
  - Tile values
  - Board multipliers
  - Bingo bonus (50 points if using all 7 tiles)
- [x] Record move to game history
- [x] Update running scores

## Phase 7: Game history & results

- [x] Display game history (moves made, scores per turn)
- [x] Show final scores at game end
- [x] Store completed games in localStorage
- [x] Display past games on home screen

## Phase 8: Multiplayer sync (local first)

- [ ] Set up Automerge document for collaborative state
- [ ] Configure automerge-repo for persistence
- [ ] Allow multiple players to view same game in real-time
- [ ] Sync state across browser tabs and local devices
- [ ] Handle offline changes and merge conflicts automatically

## Phase 9: Timer system

- [ ] Implement chess-style clock UI
- [ ] Each player gets configurable time (default 30 minutes)
- [ ] Timer starts when "Start timer" button clicked
- [ ] Advance timer to next player after move entry
- [ ] Pause/resume functionality
- [ ] Visual indication of active player's timer
- [ ] Mobile-friendly display (large, readable timer fonts)

## Tech stack

- **State Management**: Zustand (lightweight, simple)
- **Local-First Sync**: Automerge + automerge-repo (CRDT-based, offline-first)
- **UI Framework**: React 19 with Tailwind CSS
- **Components**: shadcn/ui (Button, Input, Select, etc.)
- **Component Development**: Storybook (visual development and documentation)
- **Build**: Vite
- **Language**: TypeScript
- **Design**: Minimal, monochromatic (black/white/gray palette)

## Current status

- React app scaffolded with Vite
- Tailwind CSS configured
- **Phase 0-4 complete**: Full UI component library, screens, and navigation
- **Phase 5 mostly complete**: Home screen functional, resume feature pending
- **Phase 6 complete**: Move entry with keyboard-based board editing, full scoring engine
- **Phase 7 partially complete**: Past games stored/displayed, in-game history UI pending
- Ready to continue with: Game resume, in-game history display, or Phase 8 (Automerge sync)
