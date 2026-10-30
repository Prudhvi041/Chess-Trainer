import { Chess } from 'chess.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChessBoard, type ToneArrow } from '../../components/chess/ChessBoard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { reviewGame, type MoveClass } from '../../coach/review';
import type { Drill, GameRecord } from '../../coach/storage';
import { THEMES } from '../../coach/themes';
import { BOT_LEVELS } from '../../engine/levels';
import { useEngine } from '../../hooks/useEngine';
import { piecesOf } from '../../learn/chess';
import { cn } from '../../lib/format';
import { EvalGraph } from './EvalGraph';
import { CLASS_SYMBOL, CLASS_TEXT, MoveList } from './MoveList';

interface Props {
  record: GameRecord;
  onSave: (r: GameRecord) => void;
  onAddDrills: (d: Drill[]) => void;
  onExit: () => void;
  onOpenLesson: (id: string) => void;
  onPuzzles: (angle: string) => void;
}

const ANALYSIS = { timeMs: 220, depth: 10 };

const CLASS_LABEL: Record<MoveClass, string> = {
  best: 'Best move',
  good: 'Good move',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
};

export function ReviewScreen({ record, onSave, onAddDrills, onExit, onOpenLesson, onPuzzles }: Props) {
  const engine = useEngine();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const review = record.review;
  // selected = index of the move just played (−1 = start position)
  const [ply, setPly] = useState<number>(-1);

  // Run the analysis once if this game hasn't been reviewed yet.
  useEffect(() => {
    if (review) return;
    let alive = true;
    setProgress({ done: 0, total: record.moves.length + 1 });
    engine
      .analyze(record.startFen, record.moves, ANALYSIS, (done, total) => alive && setProgress({ done, total }))
      .then((positions) => {
        if (!alive) return;
        const r = reviewGame(record.startFen, record.moves, positions, record.userColor);
        onSave({ ...record, review: r });
        // Turn the user's mistakes into practice drills.
        const g = new Chess(record.startFen);
        const drills: Drill[] = [];
        r.moves.forEach((m, i) => {
          if (m.color === record.userColor && (m.cls === 'mistake' || m.cls === 'blunder') && m.bestMove && m.bestSan) {
            drills.push({
              id: `${record.id}-${i}`,
              gameId: record.id,
              fen: g.fen(),
              bestMove: m.bestMove,
              bestScore: positions[i].score,
              playedSan: m.san,
              bestSan: m.bestSan,
              themes: m.themes,
              box: 0,
              due: Date.now(),
            });
          }
          g.move({ from: m.uci.slice(0, 2), to: m.uci.slice(2, 4), promotion: m.uci[4] });
        });
        onAddDrills(drills);
        // jump to the first user mistake
        const first = r.moves.findIndex((m) => m.color === record.userColor && (m.cls === 'mistake' || m.cls === 'blunder'));
        setPly(first >= 0 ? first : r.moves.length - 1);
        setProgress(null);
      })
      .catch((e: Error) => alive && e.message !== 'cancelled' && setError(e.message));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id, !!review]);

  const positions = useMemo(() => {
    const g = new Chess(record.startFen);
    const fens = [g.fen()];
    for (const m of record.moves) {
      g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
      fens.push(g.fen());
    }
    return fens;
  }, [record]);

  const go = useCallback(
    (p: number) => setPly(Math.max(-1, Math.min(record.moves.length - 1, p))),
    [record.moves.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'ArrowLeft') go(ply - 1);
      else if (e.key === 'ArrowRight') go(ply + 1);
      else if (e.key === 'Home') go(-1);
      else if (e.key === 'End') go(record.moves.length - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ply, go, record.moves.length]);

  const level = BOT_LEVELS[record.level - 1];
  const mv = review && ply >= 0 ? review.moves[ply] : null;
  const showBest = mv && mv.bestMove && mv.bestMove !== mv.uci && mv.cls !== 'good';
  const boardFen = positions[ply + 1];
  const board = useMemo(() => piecesOf(new Chess(boardFen)), [boardFen]);
  const arrows: ToneArrow[] = [];
  if (mv && showBest) {
    arrows.push({ from: mv.bestMove!.slice(0, 2), to: mv.bestMove!.slice(2, 4), tone: 'green' });
    if (mv.replyMove && mv.cls !== 'inaccuracy')
      arrows.push({ from: mv.replyMove.slice(0, 2), to: mv.replyMove.slice(2, 4), tone: 'red' });
  }
  const userMistakes = review?.moves
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.color === record.userColor && (m.cls === 'mistake' || m.cls === 'blunder'));

  if (error) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="font-semibold">Analysis failed</p>
        <p className="mt-1 text-sm text-ink-400">{error}</p>
        <Button className="mt-4" onClick={onExit}>
          Back
        </Button>
      </Card>
    );
  }

  if (!review) {
    const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gold-400/30 border-t-gold-400" />
        <h2 className="mt-5 font-display text-2xl font-semibold">Reviewing your game…</h2>
        <p className="mt-1 text-sm text-ink-400">
          The engine is checking all {record.moves.length} moves. This runs on your device and takes a few seconds.
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-900/[0.06] dark:bg-white/[0.08]">
          <div className="h-full rounded-full bg-gold-400 transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 font-mono text-xs text-ink-400">{pct}%</p>
      </Card>
    );
  }

  const you = record.userColor;
  const bot: 'w' | 'b' = you === 'w' ? 'b' : 'w';
  const sans = review.moves.map((m) => m.san);
  const gameThemes = Object.entries(review.userThemes).filter(([, n]) => n) as [keyof typeof THEMES, number][];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="mx-auto flex w-full flex-col gap-3" style={{ maxWidth: 'max(320px, min(620px, calc(100dvh - 300px)))' }}>
        <ChessBoard
          pieces={board}
          flip={you === 'b'}
          lastMove={mv ? [mv.uci.slice(0, 2), mv.uci.slice(2, 4)] : null}
          toneArrows={arrows}
        />
        <div className="flex items-center justify-center gap-1">
          {[
            ['⏮', -1, 'First position'],
            ['◀', ply - 1, 'Previous move'],
            ['▶', ply + 1, 'Next move'],
            ['⏭', record.moves.length - 1, 'Last position'],
          ].map(([icon, target, label]) => (
            <Button key={label as string} variant="ghost" size="sm" aria-label={label as string} onClick={() => go(target as number)} className="w-12 text-base">
              {icon}
            </Button>
          ))}
        </div>
        <EvalGraph evals={review.evals} classes={review.moves.map((m) => m.cls)} sans={sans} selected={ply >= 0 ? ply : null} onSelect={go} />
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <button onClick={onExit} className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
              ← Play
            </button>
            <span className="text-xs text-ink-400">
              vs Bot · Level {level.level} {level.name}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {([
              { who: 'You', color: you },
              { who: 'Bot', color: bot },
            ] as const).map(({ who, color }) => (
              <div key={who} className={cn('rounded-2xl p-3', who === 'You' ? 'bg-gold-400/10 ring-1 ring-inset ring-gold-400/30' : 'bg-ink-900/[0.04] dark:bg-white/[0.05]')}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">{who} · accuracy</div>
                <div className="mt-0.5 font-display text-3xl font-semibold">{Math.round(review.accuracy[color])}%</div>
                <div className="mt-1 flex gap-2 text-[11px] font-semibold">
                  <span className={CLASS_TEXT.blunder}>{review.counts[color].blunder} ??</span>
                  <span className={CLASS_TEXT.mistake}>{review.counts[color].mistake} ?</span>
                  <span className={CLASS_TEXT.inaccuracy}>{review.counts[color].inaccuracy} ?!</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          {mv ? (
            <div key={ply} className="animate-fade-in">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm text-ink-400">
                  {Math.floor(ply / 2) + 1}
                  {mv.color === 'b' ? '…' : '.'}
                </span>
                <span className="font-display text-2xl font-semibold">
                  {mv.san}
                  {CLASS_SYMBOL[mv.cls] && <span className={CLASS_TEXT[mv.cls]}>{CLASS_SYMBOL[mv.cls]}</span>}
                </span>
                <span className={cn('ml-auto text-xs font-semibold uppercase tracking-wider', CLASS_TEXT[mv.cls] ?? 'text-emerald-600 dark:text-emerald-400')}>
                  {CLASS_LABEL[mv.cls]}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-200">
                {mv.color === you ? '' : 'Bot’s move. '}
                {mv.explanation}
              </p>
              {showBest && (
                <p className="mt-2 flex flex-wrap gap-3 text-xs text-ink-400">
                  <span>
                    <span className="mr-1 inline-block h-2 w-3 rounded-sm bg-emerald-600/80 align-middle" />
                    best move
                  </span>
                  {mv.replyMove && mv.cls !== 'inaccuracy' && (
                    <span>
                      <span className="mr-1 inline-block h-2 w-3 rounded-sm bg-rose-600/75 align-middle" />
                      opponent’s threat
                    </span>
                  )}
                </p>
              )}
              {mv.color === you && mv.themes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mv.themes.map((t) => (
                    <span key={t} className="rounded-full bg-ink-900/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink-600 dark:bg-white/[0.07] dark:text-ink-200">
                      {THEMES[t].label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-500 dark:text-ink-300">Starting position. Use ▶ or the → key to step through the game.</p>
          )}
          {userMistakes && userMistakes.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink-200/70 pt-3 dark:border-white/[0.06]">
              <span className="mr-1 text-xs text-ink-400">Your mistakes:</span>
              {userMistakes.map(({ m, i }) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={cn(
                    'rounded-lg px-2 py-0.5 font-mono text-xs font-semibold ring-1 ring-inset transition',
                    i === ply ? 'bg-gold-400/25 ring-gold-400/60' : 'ring-ink-900/10 hover:bg-ink-900/5 dark:ring-white/10 dark:hover:bg-white/10',
                    CLASS_TEXT[m.cls],
                  )}
                >
                  {Math.floor(i / 2) + 1}
                  {m.color === 'b' ? '…' : '.'}
                  {m.san}
                </button>
              ))}
            </div>
          )}
        </Card>

        <MoveList startFen={record.startFen} moves={record.moves} classes={review.moves.map((m) => m.cls)} selected={ply >= 0 ? ply : null} onSelect={go} className="max-h-48" />

        {(gameThemes.length > 0 || review.habits.length > 0) && (
          <Card className="p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Coach’s notes</h3>
            <ul className="mt-2 space-y-2 text-sm text-ink-600 dark:text-ink-200">
              {review.habits.map((h) => (
                <li key={h} className="flex gap-2">
                  <span>♙</span>
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-2">
              {gameThemes
                .filter(([t]) => t !== 'opening' && t !== 'endgame')
                .map(([t, n]) => (
                  <div key={t} className="flex items-center gap-2 rounded-xl bg-ink-900/[0.03] px-3 py-2 dark:bg-white/[0.04]">
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold">{THEMES[t].label}</span>
                      <span className="text-ink-400"> ×{n}</span>
                    </span>
                    {THEMES[t].lesson && (
                      <Button size="sm" variant="ghost" onClick={() => onOpenLesson(THEMES[t].lesson!)}>
                        Lesson
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => onPuzzles(THEMES[t].puzzleAngle)}>
                      Puzzles
                    </Button>
                  </div>
                ))}
            </div>
            {userMistakes && userMistakes.length > 0 && (
              <p className="mt-3 text-xs text-ink-400">
                {userMistakes.length} position{userMistakes.length > 1 ? 's' : ''} from this game were added to “Fix my mistakes”.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
