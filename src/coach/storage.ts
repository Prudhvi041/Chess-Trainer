import { useCallback, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import type { GameReview } from './review';
import type { ThemeId } from './themes';

export type GameResult = 'win' | 'loss' | 'draw';

export interface GameRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  startFen: string;
  moves: string[];
  userColor: 'w' | 'b';
  level: number;
  result?: GameResult;
  reason?: string;
  review?: GameReview;
}

export interface Drill {
  id: string;
  gameId: string;
  fen: string;
  bestMove: string;
  /** Engine score (side to move) of the best move, for judging alternatives. */
  bestScore: number;
  playedSan: string;
  bestSan: string;
  themes: ThemeId[];
  box: number;
  due: number;
}

const MAX_GAMES = 30;
const MAX_DRILLS = 80;
const DAY = 24 * 3600 * 1000;
/** Spaced-repetition intervals per box (box 5 = mastered). */
export const DRILL_INTERVALS = [0, DAY, 3 * DAY, 7 * DAY, 21 * DAY];

export function useGameStore() {
  const [games, setGames] = usePersistentState<GameRecord[]>('games', []);
  const [drills, setDrills] = usePersistentState<Drill[]>('drills', []);

  const saveGame = useCallback(
    (record: GameRecord) =>
      setGames((list) => {
        const rest = list.filter((g) => g.id !== record.id);
        return [record, ...rest].sort((a, b) => b.startedAt - a.startedAt).slice(0, MAX_GAMES);
      }),
    [setGames],
  );

  const deleteGame = useCallback((id: string) => setGames((list) => list.filter((g) => g.id !== id)), [setGames]);

  const addDrills = useCallback(
    (items: Drill[]) =>
      setDrills((list) => {
        const ids = new Set(list.map((d) => d.id));
        const merged = [...list, ...items.filter((d) => !ids.has(d.id))];
        // drop mastered first, then oldest
        merged.sort((a, b) => (a.box >= 5 ? 1 : 0) - (b.box >= 5 ? 1 : 0));
        return merged.slice(0, MAX_DRILLS);
      }),
    [setDrills],
  );

  const gradeDrill = useCallback(
    (id: string, correct: boolean) =>
      setDrills((list) =>
        list.map((d) => {
          if (d.id !== id) return d;
          const box = correct ? Math.min(5, d.box + 1) : 0;
          return { ...d, box, due: Date.now() + (box >= 5 ? 365 * DAY : correct ? DRILL_INTERVALS[box] : 10 * 60 * 1000) };
        }),
      ),
    [setDrills],
  );

  const resetCoach = useCallback(() => {
    setGames([]);
    setDrills([]);
  }, [setGames, setDrills]);

  const dueDrills = useMemo(() => {
    const now = Date.now();
    return drills.filter((d) => d.box < 5 && d.due <= now).sort((a, b) => a.due - b.due);
  }, [drills]);

  const current = useMemo(() => games.find((g) => !g.result) ?? null, [games]);

  return { games, drills, dueDrills, current, saveGame, deleteGame, addDrills, gradeDrill, resetCoach };
}

export const newGameId = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
