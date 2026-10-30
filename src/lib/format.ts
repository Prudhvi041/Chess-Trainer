export const formatMs = (ms: number | null | undefined): string =>
  ms == null || !Number.isFinite(ms) ? '—' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;

export const formatPercent = (value: number | null): string =>
  value == null || !Number.isFinite(value) ? '—' : `${Math.round(value * 100)}%`;

export const average = (values: readonly number[]): number | null =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');
