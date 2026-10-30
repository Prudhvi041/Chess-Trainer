import { describe, expect, it } from 'vitest';
import { gameReducer, initialGameState } from '../game/reducer';
import { DEFAULT_SETTINGS, type Settings } from '../game/types';
import { squareFromId } from '../lib/coords';

const sq = (id: string) => squareFromId(id)!;
const start = (settings: Settings = DEFAULT_SETTINGS) =>
  gameReducer(initialGameState, { type: 'START', now: 0, settings, target: sq('e4') });

describe('gameReducer', () => {
  it('scores a correct answer and moves to the next target', () => {
    const s = gameReducer(start(), {
      type: 'ANSWER',
      now: 800,
      settings: DEFAULT_SETTINGS,
      square: sq('e4'),
      nextTarget: sq('a1'),
      rotationSeed: 0,
    });
    expect(s.score).toBe(1);
    expect(s.target?.id).toBe('a1');
    expect(s.streak).toBe(1);
    expect(s.responseTimes).toEqual([800]);
    expect(s.status).toBe('playing');
  });

  it('ends the game on a wrong click', () => {
    const s = gameReducer(start(), {
      type: 'ANSWER',
      now: 500,
      settings: DEFAULT_SETTINGS,
      square: sq('d5'),
      nextTarget: sq('a1'),
      rotationSeed: 0,
    });
    expect(s.status).toBe('over');
    expect(s.failure).toMatchObject({ reason: 'wrong' });
    expect(s.failure?.clicked?.id).toBe('d5');
    expect(s.failure?.target.id).toBe('e4');
  });

  it('resets the speed streak on slow answers', () => {
    const s = gameReducer(start(), {
      type: 'ANSWER',
      now: 2500,
      settings: DEFAULT_SETTINGS,
      square: sq('e4'),
      nextTarget: sq('a1'),
      rotationSeed: 0,
    });
    expect(s.score).toBe(1);
    expect(s.streak).toBe(0);
  });

  it('ignores stale timeouts and applies current ones', () => {
    const settings = { ...DEFAULT_SETTINGS, timer: true };
    const s0 = start(settings);
    expect(s0.timeLimitMs).toBe(3000);
    expect(gameReducer(s0, { type: 'TIMEOUT', now: 3000, round: s0.round - 1 })).toBe(s0);
    const s1 = gameReducer(s0, { type: 'TIMEOUT', now: 3000, round: s0.round });
    expect(s1.status).toBe('over');
    expect(s1.failure?.reason).toBe('timeout');
  });

  it('rotates the board every 5 points on hard', () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, difficulty: 'hard' };
    let s = start(settings);
    for (let i = 0; i < 5; i++) {
      s = gameReducer(s, {
        type: 'ANSWER',
        now: s.shownAt + 100,
        settings,
        square: s.target!,
        nextTarget: sq(i % 2 ? 'a1' : 'h8'),
        rotationSeed: 0.4,
      });
      if (i < 4) expect(s.orientation).toBe(0);
    }
    expect(s.orientation).not.toBe(0);
    expect(s.rotatedRound).toBe(s.round);
  });

  it('memory mode hides the target and shrinks the reveal window', () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, mode: 'memory' };
    const s = start(settings);
    expect(s.revealMs).toBe(1000);
    const hidden = gameReducer(s, { type: 'HIDE_TARGET', round: s.round });
    expect(hidden.targetHidden).toBe(true);
  });
});
