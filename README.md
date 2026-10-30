# ♞ Rank & File: Chess Trainer

A premium web app with two sections:

- **Learn**: an interactive beginner chess course (19 lessons, 4 units). Short explanations, then hands-on practice on a real board.
- **Train**: a coordinate memory game. A square name appears (e.g. **E4**); click it. One miss ends the run.

Built with **React 18 + TypeScript + Tailwind CSS + Vite**, with [chess.js](https://github.com/jhlywa/chess.js) for move rules.

## Learn: beginner course

| Unit | Lessons |
|---|---|
| **1. The board** | Meet the chessboard · Setting up the pieces |
| **2. How the pieces move** | Rook · Bishop · Queen · King · Knight · Pawn · Capturing |
| **3. Special rules** | Check · Checkmate · Stalemate · Castling · En passant · Promotion |
| **4. Basic strategy** | Piece values · Opening principles · Tactics: the fork · Basic checkmates |

Every lesson mixes five step types:

| Step | What the learner does |
|---|---|
| **Learn** | Reads a short explanation with highlighted squares and arrows on the board. |
| **Find the square** | Clicks the right square(s), e.g. where the queen starts. |
| **Mark the moves** | Marks every square a piece can reach, then checks: correct, wrong and missed squares are shown. |
| **Collect the stars** | Moves a piece to collect stars; the app computes the fewest possible moves as a target. |
| **Your move** | Finds the right move or sequence (with scripted opponent replies): checks, mates, castling, en passant, promotion, forks… Wrong moves get specific feedback (e.g. "That's stalemate!") and are taken back. |

Pieces move by **click** or **drag-and-drop** (mouse and touch). Includes hints, reset, promotion picker, progress saved in `localStorage`, and shareable lesson links (`#lesson-castling`).

Every exercise is verified automatically: `src/__tests__/curriculum.test.ts` loads each position, proves every star puzzle is solvable, and plays every solution and scripted reply through chess.js.

### Adding a lesson

Lessons are plain data in `src/learn/curriculum.ts` (types in `src/learn/types.ts`). Add a `Lesson` object to a unit and run `npm test`. The tests will tell you if a position or solution is wrong.

## Train: coordinate game

| | |
|---|---|
| **Classic mode** | Target stays visible until you click. |
| **Memory mode** | Target is shown for 1 s, then hidden. Gets harder as you score: the reveal window shrinks (1000 ms → 350 ms), the timer tightens, and board labels disappear at 20 points. |
| **Timer** | Optional 3-second limit per square; timeout ends the run. |
| **Easy** | Rank and file glow as you hover. |
| **Medium** | Standard board. |
| **Hard** | Board turns to a random new orientation (White, Black, or sideways) every 5 correct answers. |
| **Stats** | Games played, highest score, average score, fastest response, lifetime accuracy, best streak — saved in `localStorage`. |
| **Badges** | 🥉 Bronze 10 · 🥈 Silver 25 · 🥇 Gold 50 · ♚ Master 100 |
| **Streak** | Consecutive answers under 1.5 s. |
| **Polish** | Dark/light theme (follows system), synthesized sound effects (no audio files), smooth animations, reduced-motion support, keyboard (Space/Enter to start), fully responsive. |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
```

## Project structure

```
src/
├── App.tsx                  # Shell: header, hash routing (#train / #learn / #lesson-<id>), theme, sound
├── features/
│   ├── train/TrainView.tsx  # Coordinate game screen
│   └── learn/               # CourseHome, LessonPlayer, StepRunner, useLessonStep (exercise engine),
│                            # useLearnProgress, PromotionPicker, RichText
├── learn/
│   ├── curriculum.ts        # All lessons as data
│   ├── types.ts             # Step / Lesson / Unit model
│   ├── chess.ts             # chess.js helpers
│   └── stars.ts             # BFS solver for star puzzles
├── game/
│   ├── types.ts             # Settings, GameState, GameSummary
│   └── reducer.ts           # Pure state machine (randomness/time passed in → testable)
├── hooks/
│   ├── useGame.ts           # Reducer + reveal/countdown timers + game events
│   ├── useStats.ts          # Persistent lifetime statistics
│   ├── usePersistentState.ts
│   ├── useTheme.ts
│   └── useToasts.ts
├── lib/
│   ├── coords.ts            # Programmatic squares, orientations, edge labels
│   ├── difficulty.ts        # All tuning rules in one place
│   ├── badges.ts
│   ├── sound.ts             # Web Audio synth
│   ├── storage.ts           # Safe, namespaced localStorage
│   └── format.ts
├── components/
│   ├── chess/               # ChessBoard (click + drag, arrows, stars, marks) and original SVG piece set
│   ├── BoardFrame.tsx       # Shared wooden frame with coordinates
│   ├── Board.tsx / BoardSquare.tsx (memoized) / BoardOverlay.tsx
│   ├── TargetDisplay.tsx, ScoreBoard.tsx
│   ├── SettingsPanel.tsx, BadgeShelf.tsx, BadgeMedal.tsx, QuickStats.tsx, StatGrid.tsx
│   ├── GameOverModal.tsx, StatsModal.tsx, ToastStack.tsx, Header.tsx
│   └── ui/                  # Button, Card, Modal, SegmentedControl, Toggle, icons
└── __tests__/               # coords, reducer and full-curriculum tests
```

### Design notes

- **State**: a single `useReducer` state machine (`idle → playing → over`). The reducer is pure; the hook supplies `performance.now()` and random values, so game rules are unit-tested without mocks.
- **Performance**: squares are stable objects and `BoardSquare` is `memo`ized; the countdown bar is a CSS animation, not a JS interval.
- **Tuning**: every difficulty number lives in `src/lib/difficulty.ts`.

## Deploy to GitHub Pages

1. Push this repo to GitHub (branch `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) tests, builds and publishes on every push to `main`.

`vite.config.ts` uses `base: './'`, so the build works under `/<repo-name>/` with no changes.

## License

MIT. The chess piece artwork is original to this project and covered by the same license.
