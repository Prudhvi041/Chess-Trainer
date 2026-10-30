export type BadgeId = 'bronze' | 'silver' | 'gold' | 'master';

export interface Badge {
  id: BadgeId;
  name: string;
  threshold: number;
  /** Unicode chess glyph used as the medallion emblem. */
  glyph: string;
  /** Tailwind gradient classes for the medallion face. */
  gradient: string;
  ring: string;
  text: string;
}

export const BADGES: readonly Badge[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    threshold: 10,
    glyph: '♟',
    gradient: 'from-[#E7B58A] via-[#B4774A] to-[#7A4A28]',
    ring: 'ring-[#B4774A]/40',
    text: 'text-[#B4774A]',
  },
  {
    id: 'silver',
    name: 'Silver',
    threshold: 25,
    glyph: '♞',
    gradient: 'from-[#F4F6F8] via-[#B8C0C8] to-[#7C8792]',
    ring: 'ring-[#B8C0C8]/50',
    text: 'text-[#8E99A4] dark:text-[#C3CBD3]',
  },
  {
    id: 'gold',
    name: 'Gold',
    threshold: 50,
    glyph: '♜',
    gradient: 'from-[#FFF1B8] via-[#E2B93B] to-[#9A7121]',
    ring: 'ring-gold-400/50',
    text: 'text-gold-500 dark:text-gold-300',
  },
  {
    id: 'master',
    name: 'Master',
    threshold: 100,
    glyph: '♚',
    gradient: 'from-[#E9D5FF] via-[#8B5CF6] to-[#3B1D7A]',
    ring: 'ring-violet-400/50',
    text: 'text-violet-500 dark:text-violet-300',
  },
];

/** Highest badge earned for a score, or null. */
export function badgeForScore(score: number): Badge | null {
  let earned: Badge | null = null;
  for (const badge of BADGES) if (score >= badge.threshold) earned = badge;
  return earned;
}

/** The next badge still to unlock for a score, or null if all are earned. */
export function nextBadge(score: number): Badge | null {
  return BADGES.find((b) => score < b.threshold) ?? null;
}

/** Badge reached exactly at this score (used for in-game unlock toasts). */
export function badgeReachedAt(score: number): Badge | null {
  return BADGES.find((b) => b.threshold === score) ?? null;
}
