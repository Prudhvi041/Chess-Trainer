import type { Difficulty, GameMode } from '../game/types';

/** Answers faster than this keep the speed streak alive. */
export const STREAK_THRESHOLD_MS = 1500;

/** Base time limit when Timer mode is on. */
export const BASE_TIME_LIMIT_MS = 3000;

/** In Hard mode the board turns after this many correct answers. */
export const ROTATE_EVERY = 5;

/**
 * Memory mode: how long the target stays visible.
 * Starts at 1000 ms and shrinks by 75 ms every 5 points, floor 350 ms.
 */
export function revealDuration(mode: GameMode, score: number): number | null {
  if (mode !== 'memory') return null;
  return Math.max(350, 1000 - Math.floor(score / 5) * 75);
}

/**
 * Timer mode: 3 s per answer. In Memory mode the window also tightens
 * as the score grows (−150 ms every 10 points, floor 1.8 s).
 */
export function timeLimit(timerEnabled: boolean, mode: GameMode, score: number): number | null {
  if (!timerEnabled) return null;
  if (mode !== 'memory') return BASE_TIME_LIMIT_MS;
  return Math.max(1800, BASE_TIME_LIMIT_MS - Math.floor(score / 10) * 150);
}

/** Memory mode: board edge labels disappear once you reach 20 points. */
export const LABELS_HIDE_AT = 20;
export function hideBoardLabels(mode: GameMode, score: number): boolean {
  return mode === 'memory' && score >= LABELS_HIDE_AT;
}

export function shouldRotate(difficulty: Difficulty, score: number): boolean {
  return difficulty === 'hard' && score > 0 && score % ROTATE_EVERY === 0;
}

/** Short human description of the current pressure, shown under the target. */
export function describeLevel(mode: GameMode, score: number): string | null {
  if (mode !== 'memory') return null;
  const level = Math.floor(score / 5) + 1;
  return `Level ${level}`;
}
