import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, COURSE, findLesson, nextLessonId } from '../learn/curriculum';
import { createGame, legalMovesFrom, toUci, tryMove } from '../learn/chess';
import { solveStars } from '../learn/stars';
import { squareFromId } from '../lib/coords';
import type { MoveStep } from '../learn/types';

const isSquare = (s: string) => squareFromId(s) !== undefined;

/** Every legal move (UCI) in a position, with promotions expanded. */
const allMoves = (fen: string) => createGame(fen).moves({ verbose: true }).map(toUci);

function satisfies(fen: string, uci: string, accept: MoveStep['solution'][number]['accept']) {
  const g = createGame(fen);
  if (!tryMove(g, uci)) return false;
  if (accept === 'mate') return g.isCheckmate();
  if (accept === 'check') return g.inCheck();
  return accept.includes(uci);
}

describe('curriculum', () => {
  it('has unique lesson ids usable as URL hashes', () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    expect(COURSE).toHaveLength(4);
    expect(findLesson('castling')?.unit.id).toBe('rules');
    expect(nextLessonId(ALL_LESSONS[0].id)).toBe(ALL_LESSONS[1].id);
  });

  for (const lesson of ALL_LESSONS) {
    describe(lesson.title, () => {
      lesson.steps.forEach((step, i) => {
        it(`step ${i + 1} (${step.kind}): ${step.title}`, () => {
          expect(() => createGame(step.fen)).not.toThrow();
          for (const sq of step.highlights ?? []) expect(isSquare(sq)).toBe(true);
          for (const [a, b] of step.arrows ?? []) expect(isSquare(a) && isSquare(b)).toBe(true);

          switch (step.kind) {
            case 'click':
              expect(step.answers.every(isSquare)).toBe(true);
              expect(step.count ?? 1).toBeLessThanOrEqual(step.answers.length);
              break;
            case 'select': {
              const moves = legalMovesFrom(createGame(step.fen), step.from);
              expect(moves.length).toBeGreaterThan(0);
              break;
            }
            case 'stars': {
              const par = solveStars(step.fen, step.stars);
              expect(par, 'stars must be collectable').not.toBeNull();
              break;
            }
            case 'move': {
              let fen = step.fen;
              for (const stage of step.solution) {
                const moves = allMoves(fen);
                const winning = moves.filter((m) => satisfies(fen, m, stage.accept));
                expect(winning.length, `no move satisfies ${JSON.stringify(stage.accept)}`).toBeGreaterThan(0);
                const g = createGame(fen);
                tryMove(g, winning[0]);
                if (stage.reply) expect(tryMove(g, stage.reply), `reply ${stage.reply}`).not.toBeNull();
                fen = g.fen();
              }
              for (const uci of Object.keys(step.wrong ?? {})) {
                expect(allMoves(step.fen), `wrong move ${uci} should be legal`).toContain(uci);
                expect(satisfies(step.fen, uci, step.solution[0].accept)).toBe(false);
              }
              break;
            }
          }
        });
      });
    });
  }
});

describe('exercise specifics', () => {
  const step = (lessonId: string, title: string) =>
    findLesson(lessonId)!.lesson.steps.find((s) => s.title === title)!;
  const destinations = (lessonId: string, title: string) => {
    const s = step(lessonId, title);
    if (s.kind !== 'select') throw new Error('not select');
    return legalMovesFrom(createGame(s.fen), s.from).map((m) => m.to).sort();
  };

  it('select exercises match the explanations', () => {
    expect(destinations('the-rook', 'Blocked paths')).toEqual(['a4', 'b4', 'c4', 'd1', 'd2', 'd3', 'd5', 'e4', 'f4']);
    expect(destinations('the-bishop', 'Your turn')).toHaveLength(8);
    expect(destinations('the-king', 'Danger squares')).toEqual(['c3', 'c4', 'd3', 'e3', 'e4']);
    expect(destinations('the-knight', 'It jumps!')).toHaveLength(8);
    expect(destinations('the-pawn', 'Your turn')).toEqual(['b3', 'b4', 'c3']);
  });

  it('check-escape puzzles have exactly one legal move', () => {
    const cap = step('check', 'Escape by capturing');
    const block = step('check', 'Escape by blocking');
    expect(allMoves(cap.fen)).toEqual(['e4e1']);
    expect(allMoves(block.fen)).toEqual(['e3c1']);
  });

  it('kingside castling is illegal when f1 is attacked', () => {
    const s = step('castling', 'Which side?');
    expect(allMoves(s.fen)).not.toContain('e1g1');
    expect(allMoves(s.fen)).toContain('e1c1');
  });

  it('the stalemate trap really is stalemate', () => {
    const g = createGame(step('stalemate', 'Mate, not stalemate').fen);
    tryMove(g, 'c1c7');
    expect(g.isStalemate()).toBe(true);
  });

  it('explained positions are what the text says', () => {
    expect(createGame(step('stalemate', 'No moves, no check').fen).isStalemate()).toBe(true);
    expect(createGame(step('checkmate', 'Game over').fen).isCheckmate()).toBe(true);
    expect(createGame(step('check', 'Check!').fen).inCheck()).toBe(true);
  });

  it('star puzzles have sensible par values', () => {
    const pars = ALL_LESSONS.flatMap((l) => l.steps)
      .filter((s) => s.kind === 'stars')
      .map((s) => (s.kind === 'stars' ? solveStars(s.fen, s.stars) : null));
    expect(pars.every((p) => p !== null && p <= 8)).toBe(true);
  });
});
