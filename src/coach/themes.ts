/** Mistake categories the coach tracks, with teaching material for each. */

export type ThemeId =
  | 'hanging'
  | 'missed-capture'
  | 'fork-allowed'
  | 'fork-missed'
  | 'mate-allowed'
  | 'mate-missed'
  | 'opening'
  | 'endgame'
  | 'calculation';

export interface ThemeInfo {
  id: ThemeId;
  label: string;
  /** One-line habit to build. */
  tip: string;
  /** Learn-tab lesson that teaches the idea. */
  lesson?: string;
  /** Lichess puzzle theme ("angle") for targeted practice. */
  puzzleAngle: string;
  icon: string;
}

export const THEMES: Record<ThemeId, ThemeInfo> = {
  hanging: {
    id: 'hanging',
    label: 'Leaving pieces hanging',
    tip: 'Before every move, ask: is the piece I’m moving, and everything it was guarding, still protected?',
    lesson: 'piece-values',
    puzzleAngle: 'hangingPiece',
    icon: '♟',
  },
  'missed-capture': {
    id: 'missed-capture',
    label: 'Missing free material',
    tip: 'Every move, scan your opponent’s pieces: is any of them undefended or worth more than its attacker?',
    lesson: 'piece-values',
    puzzleAngle: 'hangingPiece',
    icon: '✋',
  },
  'fork-allowed': {
    id: 'fork-allowed',
    label: 'Walking into forks',
    tip: 'Check where enemy knights and pawns can jump next. Don’t line up two valuable pieces for them.',
    lesson: 'forks',
    puzzleAngle: 'fork',
    icon: '♞',
  },
  'fork-missed': {
    id: 'fork-missed',
    label: 'Missing forks',
    tip: 'Look for a square where one of your pieces attacks two targets at once, especially with a knight or with check.',
    lesson: 'forks',
    puzzleAngle: 'fork',
    icon: '⑂',
  },
  'mate-allowed': {
    id: 'mate-allowed',
    label: 'Allowing checkmate',
    tip: 'Watch your king: back-rank weaknesses and enemy pieces aiming at it. Ask “what checks does my opponent have?”',
    lesson: 'checkmate',
    puzzleAngle: 'mateIn1',
    icon: '♚',
  },
  'mate-missed': {
    id: 'mate-missed',
    label: 'Missing checkmates',
    tip: 'Always look at checks first, then captures, then threats. A forcing move might end the game.',
    lesson: 'basic-mates',
    puzzleAngle: 'mateIn2',
    icon: '♛',
  },
  opening: {
    id: 'opening',
    label: 'Opening play',
    tip: 'Control the center, develop knights and bishops, castle early. Don’t rush the queen out or move one piece many times.',
    lesson: 'opening-principles',
    puzzleAngle: 'opening',
    icon: '♙',
  },
  endgame: {
    id: 'endgame',
    label: 'Endgame technique',
    tip: 'In the endgame, bring your king forward and push passed pawns. Trade pieces when you’re ahead.',
    puzzleAngle: 'endgame',
    icon: '♔',
  },
  calculation: {
    id: 'calculation',
    label: 'Middlegame calculation',
    tip: 'Before you move, take a few seconds to find your opponent’s best reply.',
    puzzleAngle: 'middlegame',
    icon: '🧮',
  },
};

export const THEME_ORDER: ThemeId[] = [
  'hanging',
  'missed-capture',
  'fork-allowed',
  'fork-missed',
  'mate-allowed',
  'mate-missed',
  'opening',
  'endgame',
  'calculation',
];
