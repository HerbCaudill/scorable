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

- [ ] Player name input/selection form (up to 4 players)
- [ ] Dropdown with previously-used player names (sorted by frequency)
- [ ] Support for entering new player names
- [ ] "Start game" button (enabled when at least 2 players entered)
- [ ] Storybook stories for form states (empty, partial, complete)

## Phase 3: Core data models & state management

- [ ] Define TypeScript types for:
  - `Player` (name, score, time remaining)
  - `Game` (players, current turn, board state, history)
  - `Move` (player, word, score, timestamp)
- [ ] Set up Zustand store for game state
- [ ] Configure Automerge document structure for CRDT-based sync
- [ ] Implement local-first sync with automerge-repo

## Phase 4: Navigation & screens

- [ ] Create main router with screens:
  - Home (New game / Resume / Past games)
  - Player setup (enter/select player names)
  - Game play (board, timer, scoring)
- [ ] Implement navigation between screens
- [ ] Mobile-responsive layout (touch-friendly, full viewport utilization)
- [ ] Build screen component stories in Storybook first

## Phase 5: Home screen

- [ ] Display "New game" button
- [ ] Display "Past games" section with previous game results
- [ ] Implement game resume functionality
- [ ] Mobile-responsive layout with proper touch targets (min 44x44px)
- [ ] Storybook stories for layout variations (with/without past games)
- [ ] Minimal, monochromatic design (black/white/gray only)

## Phase 6: Move entry & scoring

- [ ] Interface to enter word played
- [ ] Calculate score based on:
  - Tile values
  - Board multipliers
  - Bingo bonus (50 points if using all 7 tiles)
- [ ] Record move to game history
- [ ] Update running scores

## Phase 7: Game history & results

- [ ] Display game history (moves made, scores per turn)
- [ ] Show final scores at game end
- [ ] Store completed games in localStorage
- [ ] Display past games on home screen

## Phase 8: Multiplayer sync (local first)

- [ ] Set up Automerge document for collaborative state
- [ ] Configure automerge-repo for persistence
- [ ] Allow multiple players to view same game in real-time
- [ ] Sync state across browser tabs and local devices
- [ ] Handle offline changes and merge conflicts automatically

## Phase 9: Timer system (low priority)

- [ ] Implement chess-style clock UI
- [ ] Each player gets configurable time (default 30 minutes)
- [ ] Timer starts when "Start timer" button clicked
- [ ] Advance timer to next player after move entry
- [ ] Pause/resume functionality
- [ ] Visual indication of active player's timer
- [ ] Mobile-friendly display (large, readable timer fonts)

## Phase 10: Testing & refinement

- [ ] Cross-browser testing (mobile and desktop)
- [ ] Device testing (various screen sizes, orientations)

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
- **Phase 0 complete**: Storybook set up with component library and screen designs
  - Button, Input, Select components with stories
  - Home screen, Player setup screen, and Game play screen designs
  - Minimal, monochromatic design system established
- Ready to start Phase 1: Core data models & state management
