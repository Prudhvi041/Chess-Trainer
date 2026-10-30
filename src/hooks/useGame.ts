import { useCallback, useEffect, useReducer, useRef } from 'react';
import { randomSquare, type Square } from '../lib/coords';
import { shouldRotate } from '../lib/difficulty';
import { gameReducer, initialGameState } from '../game/reducer';
import type { GameState, GameSummary, Settings } from '../game/types';

export interface GameEvents {
  onStart?: () => void;
  onCorrect?: (info: { score: number; elapsedMs: number; rotated: boolean }) => void;
  onGameOver?: (summary: GameSummary) => void;
}

/**
 * Owns the game state machine plus the time-based side effects
 * (memory-mode reveal window and timer-mode countdown).
 */
export function useGame(settings: Settings, events: GameEvents = {}) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // Refs let stable callbacks read the latest values without re-subscribing.
  const stateRef = useRef<GameState>(state);
  const settingsRef = useRef(settings);
  const eventsRef = useRef(events);
  stateRef.current = state;
  settingsRef.current = settings;
  eventsRef.current = events;

  // Fire onGameOver exactly once per finished run.
  const reportedRound = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== 'over' || !state.failure || reportedRound.current === state.round) return;
    reportedRound.current = state.round;
    eventsRef.current.onGameOver?.({
      score: state.score,
      attempts: state.attempts,
      correct: state.score,
      bestStreak: state.bestStreak,
      responseTimes: state.responseTimes,
      fastestMs: state.responseTimes.length ? Math.min(...state.responseTimes) : null,
      failure: state.failure,
      settings: settingsRef.current,
    });
  }, [state]);

  const start = useCallback(() => {
    dispatch({ type: 'START', now: performance.now(), settings: settingsRef.current, target: randomSquare() });
    eventsRef.current.onStart?.();
  }, []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const answer = useCallback((square: Square) => {
    const current = stateRef.current;
    if (current.status !== 'playing' || !current.target) return;
    const now = performance.now();
    const correct = square.id === current.target.id;
    dispatch({
      type: 'ANSWER',
      now,
      square,
      settings: settingsRef.current,
      nextTarget: randomSquare(current.target),
      rotationSeed: Math.random(),
    });
    if (correct) {
      const score = current.score + 1;
      const rotated = shouldRotate(settingsRef.current.difficulty, score);
      eventsRef.current.onCorrect?.({ score, elapsedMs: now - current.shownAt, rotated });
    }
  }, []);

  // Memory mode: hide the target after the reveal window.
  useEffect(() => {
    if (state.status !== 'playing' || state.revealMs == null) return;
    const round = state.round;
    const id = window.setTimeout(() => dispatch({ type: 'HIDE_TARGET', round }), state.revealMs);
    return () => window.clearTimeout(id);
  }, [state.status, state.round, state.revealMs]);

  // Timer mode: fail when the countdown runs out.
  useEffect(() => {
    if (state.status !== 'playing' || state.timeLimitMs == null) return;
    const round = state.round;
    const remaining = state.timeLimitMs - (performance.now() - state.shownAt);
    const id = window.setTimeout(
      () => dispatch({ type: 'TIMEOUT', now: performance.now(), round }),
      Math.max(0, remaining),
    );
    return () => window.clearTimeout(id);
  }, [state.status, state.round, state.timeLimitMs, state.shownAt]);

  return { state, start, answer, reset };
}
