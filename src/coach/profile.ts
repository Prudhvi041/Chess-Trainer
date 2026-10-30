import type { GameRecord } from './storage';
import { THEME_ORDER, type ThemeId } from './themes';

export interface FocusArea {
  theme: ThemeId;
  count: number;
  /** In how many of the analysed games it appeared. */
  games: number;
}

export interface CoachProfile {
  analyzedGames: number;
  focus: FocusArea[];
  /** User accuracy per analysed game, oldest → newest. */
  accuracy: number[];
  record: { win: number; loss: number; draw: number };
}

/** Rank the user's recurring mistake types over their most recent analysed games. */
export function buildProfile(games: readonly GameRecord[], window = 15): CoachProfile {
  const finished = games.filter((g) => g.result);
  const analysed = finished.filter((g) => g.review).sort((a, b) => b.startedAt - a.startedAt).slice(0, window);
  const totals = new Map<ThemeId, FocusArea>();
  for (const g of analysed) {
    for (const [theme, n] of Object.entries(g.review!.userThemes) as [ThemeId, number][]) {
      if (!n) continue;
      const f = totals.get(theme) ?? { theme, count: 0, games: 0 };
      f.count += n;
      f.games += 1;
      totals.set(theme, f);
    }
  }
  const focus = [...totals.values()].sort(
    (a, b) => b.count - a.count || b.games - a.games || THEME_ORDER.indexOf(a.theme) - THEME_ORDER.indexOf(b.theme),
  );
  return {
    analyzedGames: analysed.length,
    focus,
    accuracy: analysed
      .slice()
      .reverse()
      .map((g) => g.review!.accuracy[g.userColor]),
    record: {
      win: finished.filter((g) => g.result === 'win').length,
      loss: finished.filter((g) => g.result === 'loss').length,
      draw: finished.filter((g) => g.result === 'draw').length,
    },
  };
}
