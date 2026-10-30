# ♞ Rank & File — Chess Coordinate Trainer

A premium, minimal web game that trains you to **instantly recognize chessboard coordinates**.
A square name appears (e.g. **E4**) — click it on the board. One miss ends the run.

Built with **React 18 + TypeScript + Tailwind CSS + Vite**.

## Features

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
├── App.tsx                  # Composition root: wires state, stats, sounds, modals
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
│   ├── Board.tsx / BoardSquare.tsx (memoized) / BoardOverlay.tsx
│   ├── TargetDisplay.tsx, ScoreBoard.tsx
│   ├── SettingsPanel.tsx, BadgeShelf.tsx, BadgeMedal.tsx, QuickStats.tsx, StatGrid.tsx
│   ├── GameOverModal.tsx, StatsModal.tsx, ToastStack.tsx, Header.tsx
│   └── ui/                  # Button, Card, Modal, SegmentedControl, Toggle, icons
└── __tests__/               # coords + reducer tests
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

MIT
