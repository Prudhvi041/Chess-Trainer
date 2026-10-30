import { nextOrientation, type Orientation, type Square } from '../lib/coords';
import { revealDuration, shouldRotate, STREAK_THRESHOLD_MS, timeLimit } from '../lib/difficulty';
import type { GameState, Settings } from './types';

/**
 * Pure reducer. All randomness (next square, next orientation) and time are
 * passed in on the action so the reducer stays deterministic and testable.
 */
export type GameAction =
  | { type: 'START'; now: number; settings: Settings; target: Square }
  | {
      type: 'ANSWER';
      now: number;
      settings: Settings;
      square: Square;
      nextTarget: Square;
      rotationSeed: number;
    }
  | { type: 'TIMEOUT'; now: number; round: number }
  | { type: 'HIDE_TARGET'; round: number }
  | { type: 'RESET' };

export const initialGameState: GameState = {
  status: 'idle',
  round: 0,
  target: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  attempts: 0,
  orientation: 0,
  shownAt: 0,
  revealMs: null,
  timeLimitMs: null,
  targetHidden: false,
  responseTimes: [],
  lastCorrect: null,
  failure: null,
  rotatedRound: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      const { settings, now, target } = action;
      return {
        ...initialGameState,
        status: 'playing',
        round: state.round + 1,
        target,
        shownAt: now,
        revealMs: revealDuration(settings.mode, 0),
        timeLimitMs: timeLimit(settings.timer, settings.mode, 0),
      };
    }

    case 'ANSWER': {
      if (state.status !== 'playing' || !state.target) return state;
      const { square, now, settings, nextTarget, rotationSeed } = action;
      const elapsed = now - state.shownAt;

      if (square.id !== state.target.id) {
        return {
          ...state,
          status: 'over',
          attempts: state.attempts + 1,
          targetHidden: false,
          failure: { reason: 'wrong', target: state.target, clicked: square },
        };
      }

      const score = state.score + 1;
      const streak = elapsed <= STREAK_THRESHOLD_MS ? state.streak + 1 : 0;
      const rotate = shouldRotate(settings.difficulty, score);
      const orientation: Orientation = rotate
        ? nextOrientation(state.orientation, () => rotationSeed)
        : state.orientation;
      const round = state.round + 1;

      return {
        ...state,
        round,
        score,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        attempts: state.attempts + 1,
        target: nextTarget,
        shownAt: now,
        orientation,
        revealMs: revealDuration(settings.mode, score),
        timeLimitMs: timeLimit(settings.timer, settings.mode, score),
        targetHidden: false,
        responseTimes: [...state.responseTimes, elapsed],
        lastCorrect: { square, round },
        rotatedRound: rotate ? round : state.rotatedRound,
      };
    }

    case 'TIMEOUT': {
      if (state.status !== 'playing' || !state.target || action.round !== state.round) return state;
      return {
        ...state,
        status: 'over',
        attempts: state.attempts + 1,
        targetHidden: false,
        failure: { reason: 'timeout', target: state.target, clicked: null },
      };
    }

    case 'HIDE_TARGET':
      if (state.status !== 'playing' || action.round !== state.round) return state;
      return { ...state, targetHidden: true };

    case 'RESET':
      return { ...initialGameState, round: state.round + 1 };
  }
}
