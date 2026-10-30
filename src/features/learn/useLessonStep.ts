import type { Square as ChessSquare } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PIECE_NAMES, type PieceType } from '../../components/chess/pieces';
import type { SquareMark } from '../../components/chess/ChessBoard';
import {
  checkedKingSquare,
  createGame,
  isPromotionMove,
  legalMovesFrom,
  passTurnTo,
  piecesOf,
  tryMove,
} from '../../learn/chess';
import { solveStars } from '../../learn/stars';
import type { Arrow, Step } from '../../learn/types';
import type { SoundName } from '../../lib/sound';

export interface Feedback {
  tone: 'info' | 'success' | 'error';
  text: string;
}

const UNDO_DELAY = 1100;
const REPLY_DELAY = 550;

/**
 * Runs one lesson step: owns the chess position and evaluates the learner's
 * clicks and moves for every exercise kind. Mount it with a `key` per step
 * (and per reset) so each attempt starts fresh.
 */
export function useLessonStep(step: Step, play: (s: SoundName) => void) {
  const game = useRef(createGame(step.fen)).current;
  const [pieces, setPieces] = useState(() => piecesOf(game));
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<Arrow | null>(step.lastMove ?? null);
  const [solved, setSolved] = useState(step.kind === 'explain');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ square: string; tone: 'good' | 'bad'; key: number } | null>(null);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  // per-kind state
  const [stage, setStage] = useState(0);
  const [stars, setStars] = useState<string[]>(step.kind === 'stars' ? step.stars : []);
  const [moveCount, setMoveCount] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const sync = () => setPieces(piecesOf(game));
  const flashSquare = (square: string, tone: 'good' | 'bad') => setFlash({ square, tone, key: Date.now() });

  const par = useMemo(() => (step.kind === 'stars' ? solveStars(step.fen, step.stars) : null), [step]);

  const succeed = useCallback(
    (text: string) => {
      setSolved(true);
      setSelected(null);
      setFeedback({ tone: 'success', text });
      play('correct');
    },
    [play],
  );

  const fail = (text: string, square?: string) => {
    setFeedback({ tone: 'error', text });
    play('wrong');
    if (square) flashSquare(square, 'bad');
  };

  /* ───────── moves (stars + move steps) ───────── */

  const commit = (uci: string) => {
    const before = lastMove;
    const move = tryMove(game, uci);
    if (!move) return;
    setSelected(null);
    setLastMove([move.from, move.to]);
    sync();
    play(move.captured ? 'capture' : 'move');

    if (step.kind === 'stars') {
      const count = moveCount + 1;
      const remaining = stars.filter((s) => s !== move.to);
      setMoveCount(count);
      setStars(remaining);
      passTurnTo(game, move.color);
      sync();
      if (remaining.length === 0) {
        const score =
          par == null ? '' : count <= par ? ` ${count} moves: the best possible!` : ` ${count} moves (best possible: ${par}).`;
        succeed(`${step.success}${score}`);
      } else if (remaining.length < stars.length) {
        flashSquare(move.to, 'good');
        setFeedback({ tone: 'info', text: `${remaining.length} star${remaining.length === 1 ? '' : 's'} to go.` });
      }
      return;
    }

    if (step.kind !== 'move') return;
    const stageDef = step.solution[stage];
    const ok =
      stageDef.accept === 'mate'
        ? game.isCheckmate()
        : stageDef.accept === 'check'
          ? game.inCheck()
          : stageDef.accept.includes(uci);

    if (ok) {
      flashSquare(move.to, 'good');
      const isLast = stage === step.solution.length - 1;
      if (isLast) {
        succeed(step.success);
        return;
      }
      const nextStage = step.solution[stage + 1];
      setFeedback({ tone: 'info', text: 'Good move!' });
      if (stageDef.reply) {
        setBusy(true);
        later(() => {
          const reply = tryMove(game, stageDef.reply!);
          if (reply) {
            setLastMove([reply.from, reply.to]);
            play(reply.captured ? 'capture' : 'move');
          }
          sync();
          setStage(stage + 1);
          setFeedback({ tone: 'info', text: nextStage.prompt ?? 'Your move again.' });
          setBusy(false);
        }, REPLY_DELAY);
      } else {
        setStage(stage + 1);
        setFeedback({ tone: 'info', text: nextStage.prompt ?? 'Your move again.' });
      }
      return;
    }

    const message =
      step.wrong?.[uci] ??
      (game.isStalemate()
        ? 'That’s stalemate: the opponent has no legal moves but isn’t in check. It’s only a draw. Try again!'
        : stageDef.accept === 'mate' && game.inCheck()
          ? 'Check, but not checkmate: the king can still escape. Try again.'
          : 'Not the move we’re looking for. Try again!');
    fail(message, move.to);
    setBusy(true);
    later(() => {
      game.undo();
      sync();
      setLastMove(before);
      setBusy(false);
    }, UNDO_DELAY);
  };

  const attemptMove = (from: string, to: string) => {
    const legal = legalMovesFrom(game, from).filter((m) => m.to === to);
    if (legal.length === 0) {
      const piece = pieces[from];
      const msg =
        step.kind === 'move' && step.illegal
          ? step.illegal
          : game.inCheck()
            ? 'Your king is in check. That move doesn’t get him out of it.'
            : piece?.type === 'k' && game.isAttacked(to as ChessSquare, piece.color === 'w' ? 'b' : 'w')
              ? 'The king can’t move onto a square attacked by an enemy piece.'
              : `The ${piece ? PIECE_NAMES[piece.type] : 'piece'} can’t move there.`;
      fail(msg, to);
      setSelected(null);
      return;
    }
    if (isPromotionMove(game, from, to)) {
      setSelected(null);
      setPromotion({ from, to });
      return;
    }
    commit(`${from}${to}`);
  };

  const choosePromotion = (type: PieceType | null) => {
    const p = promotion;
    setPromotion(null);
    if (p && type) commit(`${p.from}${p.to}${type}`);
  };

  /* ───────── interactions ───────── */

  const movesAllowed = step.kind === 'stars' || step.kind === 'move';
  const interactive = step.kind !== 'explain' && !solved && !busy && !promotion;

  const selectPiece = (square: string) => {
    if (legalMovesFrom(game, square).length === 0) {
      fail(`That ${PIECE_NAMES[pieces[square].type]} has no legal moves right now.`, square);
      setSelected(null);
      return;
    }
    setSelected(square);
  };

  const onSquareClick = (square: string) => {
    if (!interactive) return;

    if (step.kind === 'click') {
      if (found.includes(square)) return;
      if (step.answers.includes(square)) {
        const next = [...found, square];
        setFound(next);
        flashSquare(square, 'good');
        if (next.length >= (step.count ?? 1)) succeed(step.success);
        else {
          play('correct');
          setFeedback({ tone: 'info', text: `Yes! ${(step.count ?? 1) - next.length} more to find.` });
        }
      } else {
        fail(`That’s ${square.toUpperCase()}. Try again.`, square);
      }
      return;
    }

    if (step.kind === 'select') {
      if (square === step.from) return;
      setChecked(false);
      setFeedback(null);
      setPicked((p) => (p.includes(square) ? p.filter((s) => s !== square) : [...p, square]));
      return;
    }

    if (!movesAllowed) return;
    const piece = pieces[square];
    const own = piece && piece.color === game.turn();
    if (selected) {
      if (square === selected) setSelected(null);
      else if (own) selectPiece(square);
      else attemptMove(selected, square);
    } else if (own) {
      selectPiece(square);
    } else if (piece) {
      setFeedback({ tone: 'info', text: `You play ${game.turn() === 'w' ? 'White' : 'Black'}. Select one of your own pieces.` });
    }
  };

  const onDragStart = (square: string) => interactive && movesAllowed && setSelected(square);
  const onDrop = (from: string, to: string) => interactive && movesAllowed && attemptMove(from, to);
  const canDrag = (square: string) => movesAllowed && pieces[square]?.color === game.turn();

  /* ───────── select exercise ───────── */

  const selectAnswer = useMemo(
    () => (step.kind === 'select' ? [...new Set(legalMovesFrom(createGame(step.fen), step.from).map((m): string => m.to))] : []),
    [step],
  );

  const checkSelection = () => {
    if (step.kind !== 'select') return;
    const answer = new Set(selectAnswer);
    const hits = picked.filter((s) => answer.has(s)).length;
    const wrong = picked.length - hits;
    if (hits === answer.size && wrong === 0) {
      succeed(step.success);
      return;
    }
    setChecked(true);
    const parts = [`You found ${hits} of ${answer.size}.`];
    if (wrong) parts.push(`${wrong} marked square${wrong > 1 ? 's' : ''} can’t be reached (red).`);
    if (hits < answer.size) parts.push('Dashed squares were missed.');
    parts.push('Adjust your marks and check again.');
    fail(parts.join(' '));
  };

  const marks = useMemo(() => {
    const m: Record<string, SquareMark> = {};
    if (step.kind === 'click') found.forEach((s) => (m[s] = 'correct'));
    if (step.kind === 'select') {
      const answer = new Set(selectAnswer);
      if (solved) answer.forEach((s) => (m[s] = 'correct'));
      else if (checked) {
        picked.forEach((s) => (m[s] = answer.has(s) ? 'correct' : 'wrong'));
        answer.forEach((s) => !picked.includes(s) && (m[s] = 'missed'));
      } else picked.forEach((s) => (m[s] = 'picked'));
    }
    return m;
  }, [step.kind, found, selectAnswer, solved, checked, picked]);

  const targets = useMemo(() => {
    if (!selected) return [];
    return legalMovesFrom(game, selected).map((m) => ({ to: m.to, capture: !!m.captured }));
    // pieces in deps: recompute after each position change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, pieces]);

  const showHint = () => {
    if (step.kind === 'explain') return;
    setFeedback({ tone: 'info', text: step.hint });
  };

  return {
    board: {
      pieces,
      flip: step.flip,
      interactive,
      highlights: step.kind === 'explain' || step.kind === 'click' ? step.highlights : undefined,
      arrows: step.kind === 'explain' ? step.arrows : undefined,
      stars,
      lastMove,
      checkSquare: checkedKingSquare(game),
      selected: step.kind === 'select' ? step.from : selected,
      targets,
      marks,
      flash,
      canDrag,
      onSquareClick,
      onDragStart,
      onDrop,
    },
    solved,
    feedback,
    promotion,
    promotionColor: game.turn(),
    choosePromotion,
    showHint,
    checkSelection,
    pickedCount: picked.length,
    moveCount,
    par,
  };
}
