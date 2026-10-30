import { Chess } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChessBoard, type ToneArrow } from '../../components/chess/ChessBoard';
import { Piece, type PieceType } from '../../components/chess/pieces';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { GameRecord, GameResult } from '../../coach/storage';
import { BOT_LEVELS } from '../../engine/levels';
import { useEngine } from '../../hooks/useEngine';
import { useMoveInput } from '../../hooks/useMoveInput';
import { cn } from '../../lib/format';
import type { SoundName } from '../../lib/sound';
import { PromotionPicker } from '../learn/PromotionPicker';
import { MoveList } from './MoveList';

interface Props {
  record: GameRecord;
  onSave: (r: GameRecord) => void;
  onReview: (id: string) => void;
  onNewGame: () => void;
  onExit: () => void;
  play: (s: SoundName) => void;
}

const BOT_MIN_DELAY = 450;
const VALUES: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const START_COUNTS: Record<PieceType, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

function outcome(g: Chess, userColor: 'w' | 'b'): { result: GameResult; reason: string } | null {
  if (g.isCheckmate()) {
    const loser = g.turn();
    return { result: loser === userColor ? 'loss' : 'win', reason: 'checkmate' };
  }
  if (g.isStalemate()) return { result: 'draw', reason: 'stalemate' };
  if (g.isThreefoldRepetition()) return { result: 'draw', reason: 'repetition' };
  if (g.isInsufficientMaterial()) return { result: 'draw', reason: 'insufficient material' };
  if (g.isDraw()) return { result: 'draw', reason: '50-move rule' };
  return null;
}

export function GameScreen({ record: initial, onSave, onReview, onNewGame, onExit, play }: Props) {
  const engine = useEngine();
  const game = useMemo(() => {
    const g = new Chess(initial.startFen);
    for (const m of initial.moves) g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);
  const [record, setRecord] = useState(initial);
  const [version, setVersion] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState<ToneArrow | null>(null);
  const [flipped, setFlipped] = useState(initial.userColor === 'b');
  const [confirmResign, setConfirmResign] = useState(false);
  const [lastMove, setLastMove] = useState<[string, string] | null>(() => {
    const h = game.history({ verbose: true }).at(-1);
    return h ? [h.from, h.to] : null;
  });
  const recordRef = useRef(record);
  recordRef.current = record;

  const level = BOT_LEVELS[record.level - 1];
  const over = !!record.result;
  const userTurn = !over && game.turn() === record.userColor;

  const commit = useCallback(
    (next: GameRecord) => {
      setRecord(next);
      onSave(next);
    },
    [onSave],
  );

  const applyMove = useCallback(
    (uci: string, byUser: boolean) => {
      const mv = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      setLastMove([mv.from, mv.to]);
      setHint(null);
      setVersion((v) => v + 1);
      play(game.isCheckmate() ? (byUser ? 'badge' : 'wrong') : mv.captured ? 'capture' : 'move');
      const base = recordRef.current;
      const end = outcome(game, base.userColor);
      commit({
        ...base,
        moves: [...base.moves, uci],
        ...(end ? { result: end.result, reason: end.reason, endedAt: Date.now() } : {}),
      });
    },
    [game, commit, play],
  );

  // Bot's turn
  useEffect(() => {
    if (over || game.turn() === record.userColor) return;
    let alive = true;
    setThinking(true);
    const started = Date.now();
    engine
      .botMove(record.startFen, recordRef.current.moves, record.level)
      .then((move) => {
        if (!alive || !move) return;
        const wait = Math.max(0, BOT_MIN_DELAY - (Date.now() - started));
        window.setTimeout(() => {
          if (!alive) return;
          setThinking(false);
          applyMove(move, false);
        }, wait);
      })
      .catch(() => alive && setThinking(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, over]);

  const input = useMoveInput(game, version, {
    enabled: userTurn && !thinking,
    color: record.userColor,
    onMove: (uci) => applyMove(uci, true),
    onIllegal: () => play('wrong'),
  });

  const takeback = () => {
    if (thinking || record.moves.length === 0) return;
    // undo back to the user's previous turn
    let n = game.turn() === record.userColor ? 2 : 1;
    if (over && game.turn() !== record.userColor) n = 1; // user delivered the final move
    n = Math.min(n, record.moves.length);
    for (let i = 0; i < n; i++) game.undo();
    const moves = record.moves.slice(0, record.moves.length - n);
    const h = game.history({ verbose: true }).at(-1);
    setLastMove(h ? [h.from, h.to] : null);
    setHint(null);
    commit({ ...record, moves, result: undefined, reason: undefined, endedAt: undefined });
    setVersion((v) => v + 1);
  };

  const showHint = async () => {
    if (!userTurn || thinking) return;
    setThinking(true);
    try {
      const r = await engine.search(record.startFen, record.moves, { timeMs: 900 });
      if (r.move) setHint({ from: r.move.slice(0, 2), to: r.move.slice(2, 4), tone: 'gold' });
    } finally {
      setThinking(false);
    }
  };

  const resign = () => {
    commit({ ...record, result: 'loss', reason: 'resignation', endedAt: Date.now() });
    setConfirmResign(false);
    play('wrong');
  };

  // material
  const material = useMemo(() => {
    const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 } };
    let score = 0;
    for (const row of game.board())
      for (const c of row)
        if (c) {
          counts[c.color][c.type]++;
          score += (c.color === 'w' ? 1 : -1) * VALUES[c.type];
        }
    const captured = (by: 'w' | 'b') => {
      const victim = by === 'w' ? 'b' : 'w';
      const out: PieceType[] = [];
      (['q', 'r', 'b', 'n', 'p'] as PieceType[]).forEach((t) => {
        for (let i = counts[victim][t]; i < START_COUNTS[t]; i++) out.push(t);
      });
      return out;
    };
    return { score, capturedBy: { w: captured('w'), b: captured('b') } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, game]);

  const botColor = record.userColor === 'w' ? 'b' : 'w';
  const resultText = record.result
    ? record.result === 'win'
      ? `You won by ${record.reason}!`
      : record.result === 'loss'
        ? record.reason === 'resignation'
          ? 'You resigned.'
          : `You lost by ${record.reason}.`
        : `Draw by ${record.reason}.`
    : null;

  const status = over
    ? resultText
    : thinking && !userTurn
      ? 'Bot is thinking…'
      : thinking
        ? 'Looking for a hint…'
        : game.inCheck()
          ? 'Check! Your move.'
          : 'Your move.';

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="mx-auto flex w-full flex-col gap-2" style={{ maxWidth: 'max(320px, min(640px, calc(100dvh - 230px)))' }}>
        <PlayerStrip
          name={`Bot · ${level.name}`}
          color={botColor}
          captured={material.capturedBy[botColor]}
          advantage={botColor === 'w' ? material.score : -material.score}
          active={!over && game.turn() === botColor}
          thinking={thinking && !userTurn}
        />
        <ChessBoard
          {...input.board}
          flip={flipped}
          lastMove={lastMove}
          toneArrows={hint ? [hint] : []}
          overlay={input.promotion ? <PromotionPicker color={record.userColor} onPick={input.choosePromotion} /> : undefined}
        />
        <PlayerStrip
          name="You"
          color={record.userColor}
          captured={material.capturedBy[record.userColor]}
          advantage={record.userColor === 'w' ? material.score : -material.score}
          active={userTurn}
        />
      </div>

      <Card className="flex flex-col p-5 lg:sticky lg:top-4">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
            ← Play
          </button>
          <span className="text-xs text-ink-400">
            Level {level.level} · you play {record.userColor === 'w' ? 'White' : 'Black'}
          </span>
        </div>

        <div
          aria-live="polite"
          className={cn(
            'mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
            over
              ? record.result === 'win'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : record.result === 'loss'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  : 'bg-ink-900/[0.05] dark:bg-white/[0.07]'
              : 'bg-ink-900/[0.04] text-ink-700 dark:bg-white/[0.06] dark:text-ink-100',
          )}
        >
          {thinking && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {status}
        </div>

        <MoveList startFen={record.startFen} moves={record.moves} className="mt-4 max-h-60 lg:max-h-[300px]" />

        {over ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onNewGame}>
              New game
            </Button>
            <Button onClick={() => onReview(record.id)} data-autofocus>
              Review game →
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            <Button variant="ghost" size="sm" onClick={showHint} disabled={!userTurn || thinking}>
              Hint
            </Button>
            <Button variant="ghost" size="sm" onClick={takeback} disabled={thinking || record.moves.length === 0}>
              Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setFlipped((f) => !f)}>
              Flip
            </Button>
            {confirmResign ? (
              <Button variant="danger" size="sm" onClick={resign}>
                Sure?
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmResign(true)} disabled={record.moves.length === 0}>
                Resign
              </Button>
            )}
          </div>
        )}
        {over && (
          <p className="mt-3 text-center text-xs text-ink-400">
            The review shows your mistakes and adds them to your coach’s practice list.
          </p>
        )}
      </Card>
    </div>
  );
}

function PlayerStrip({
  name,
  color,
  captured,
  advantage,
  active,
  thinking,
}: {
  name: string;
  color: 'w' | 'b';
  captured: PieceType[];
  advantage: number;
  active: boolean;
  thinking?: boolean;
}) {
  const opp = color === 'w' ? 'b' : 'w';
  return (
    <div className="flex h-9 items-center gap-2 px-1">
      <span
        className={cn(
          'grid h-7 w-7 place-items-center rounded-lg p-0.5 ring-1 transition',
          color === 'w' ? 'bg-white ring-black/10' : 'bg-ink-800 ring-white/10',
          active && 'ring-2 ring-gold-400',
        )}
      >
        <Piece type="k" color={color} className="h-full w-full" />
      </span>
      <span className="text-sm font-semibold">{name}</span>
      {thinking && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />}
      <span className="ml-1 flex items-center">
        {captured.map((t, i) => (
          <Piece key={i} type={t} color={opp} className="-ml-1.5 h-5 w-5 first:ml-0" />
        ))}
      </span>
      {advantage > 0 && <span className="text-xs font-semibold text-ink-400">+{advantage}</span>}
    </div>
  );
}
