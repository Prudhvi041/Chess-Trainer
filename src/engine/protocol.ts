import type { SearchResult } from './search';

export interface PositionAnalysis {
  /** Score from the side to move's point of view (cp, mates as ±(MATE − plies)). */
  score: number;
  bestMove: string | null;
  pv: string[];
  depth: number;
}

export type EngineRequest =
  | { id: number; type: 'bot'; fen: string; moves: string[]; level: number }
  | { id: number; type: 'search'; fen: string; moves: string[]; depth?: number; timeMs?: number }
  | { id: number; type: 'analyze'; fen: string; moves: string[]; timeMs: number; depth: number };

export type EngineResponse =
  | { id: number; type: 'bot'; move: string | null }
  | { id: number; type: 'search'; result: SearchResult }
  | { id: number; type: 'progress'; done: number; total: number }
  | { id: number; type: 'analyze'; positions: PositionAnalysis[] }
  | { id: number; type: 'error'; message: string };
