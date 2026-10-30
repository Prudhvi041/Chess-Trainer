import { useCallback, useMemo } from 'react';
import type { GameSummary } from '../game/types';
import { usePersistentState } from './usePersistentState';

export interface Stats {
  gamesPlayed: number;
  highestScore: number;
  totalScore: number;
  fastestMs: number | null;
  totalCorrect: number;
  totalAttempts: number;
  bestStreak: number;
  totalResponseMs: number;
}

export const EMPTY_STATS: Stats = {
  gamesPlayed: 0,
  highestScore: 0,
  totalScore: 0,
  fastestMs: null,
  totalCorrect: 0,
  totalAttempts: 0,
  bestStreak: 0,
  totalResponseMs: 0,
};

export function applySummary(stats: Stats, s: GameSummary): Stats {
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    highestScore: Math.max(stats.highestScore, s.score),
    totalScore: stats.totalScore + s.score,
    fastestMs:
      s.fastestMs == null
        ? stats.fastestMs
        : stats.fastestMs == null
          ? s.fastestMs
          : Math.min(stats.fastestMs, s.fastestMs),
    totalCorrect: stats.totalCorrect + s.correct,
    totalAttempts: stats.totalAttempts + s.attempts,
    bestStreak: Math.max(stats.bestStreak, s.bestStreak),
    totalResponseMs: stats.totalResponseMs + s.responseTimes.reduce((a, b) => a + b, 0),
  };
}

export function useStats() {
  const [stats, setStats] = usePersistentState<Stats>('stats', EMPTY_STATS);

  const recordGame = useCallback((summary: GameSummary) => setStats((s) => applySummary(s, summary)), [setStats]);
  const resetStats = useCallback(() => setStats(EMPTY_STATS), [setStats]);

  const derived = useMemo(
    () => ({
      averageScore: stats.gamesPlayed ? stats.totalScore / stats.gamesPlayed : null,
      accuracy: stats.totalAttempts ? stats.totalCorrect / stats.totalAttempts : null,
      averageResponseMs: stats.totalCorrect ? stats.totalResponseMs / stats.totalCorrect : null,
    }),
    [stats],
  );

  return { stats, ...derived, recordGame, resetStats };
}
