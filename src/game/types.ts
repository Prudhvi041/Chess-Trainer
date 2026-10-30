import type { Orientation, Square } from '../lib/coords';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'memory';
export type GameStatus = 'idle' | 'playing' | 'over';
export type FailReason = 'wrong' | 'timeout';

export interface Settings {
  difficulty: Difficulty;
  mode: GameMode;
  timer: boolean;
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'medium',
  mode: 'classic',
  timer: false,
  sound: true,
};

export interface Failure {
  reason: FailReason;
  target: Square;
  clicked: Square | null;
}

export interface GameState {
  status: GameStatus;
  /** Increments for every new target — used as an animation / effect key. */
  round: number;
  target: Square | null;
  score: number;
  /** Consecutive answers faster than STREAK_THRESHOLD_MS. */
  streak: number;
  bestStreak: number;
  attempts: number;
  orientation: Orientation;
  /** performance.now() when the current target appeared. */
  shownAt: number;
  revealMs: number | null;
  timeLimitMs: number | null;
  targetHidden: boolean;
  responseTimes: number[];
  lastCorrect: { square: Square; round: number } | null;
  failure: Failure | null;
  /** Round on which the board last rotated (Hard). */
  rotatedRound: number | null;
}

/** Summary handed to stats / game-over UI when a run ends. */
export interface GameSummary {
  score: number;
  attempts: number;
  correct: number;
  bestStreak: number;
  responseTimes: number[];
  fastestMs: number | null;
  failure: Failure;
  settings: Settings;
}
