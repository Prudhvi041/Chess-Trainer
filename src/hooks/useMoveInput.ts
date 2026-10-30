import type { Chess, Square as ChessSquare } from 'chess.js';
import { useCallback, useMemo, useState } from 'react';
import type { PieceType } from '../components/chess/pieces';
import { isPromotionMove, legalMovesFrom, piecesOf } from '../learn/chess';

/**
 * Click-to-move + drag-and-drop input for a chess.js game.
 * `version` must change whenever the game's position changes (so derived state refreshes).
 */
export function useMoveInput(
  game: Chess,
  version: number,
  opts: { enabled: boolean; color?: 'w' | 'b' | null; onMove: (uci: string) => void; onIllegal?: () => void },
) {
  const [selected, setSelected] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pieces = useMemo(() => piecesOf(game), [game, version]);
  const mover = opts.color ?? game.turn();
  const canAct = opts.enabled && game.turn() === mover;

  const attempt = useCallback(
    (from: string, to: string) => {
      setSelected(null);
      if (!legalMovesFrom(game, from).some((m) => m.to === to)) {
        opts.onIllegal?.();
        return;
      }
      if (isPromotionMove(game, from, to)) setPromotion({ from, to });
      else opts.onMove(`${from}${to}`);
    },
    [game, opts],
  );

  const onSquareClick = (sq: string) => {
    if (!canAct) return;
    const piece = pieces[sq];
    const own = piece?.color === mover;
    if (selected) {
      if (sq === selected) setSelected(null);
      else if (own) setSelected(sq);
      else attempt(selected, sq);
    } else if (own && legalMovesFrom(game, sq).length) setSelected(sq);
  };

  const targets = useMemo(
    () => (selected ? legalMovesFrom(game, selected).map((m) => ({ to: m.to as string, capture: !!m.captured })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, game, version],
  );

  const choosePromotion = (t: PieceType | null) => {
    const p = promotion;
    setPromotion(null);
    if (p && t) opts.onMove(`${p.from}${p.to}${t}`);
  };

  let checkSquare: string | null = null;
  if (game.inCheck()) {
    for (const row of game.board()) for (const c of row) if (c?.type === 'k' && c.color === game.turn()) checkSquare = c.square;
  }

  return {
    board: {
      pieces,
      interactive: canAct,
      selected,
      targets,
      checkSquare,
      canDrag: (sq: string) => canAct && pieces[sq]?.color === mover,
      onSquareClick,
      onDragStart: (sq: string) => canAct && setSelected(sq),
      onDrop: (from: string, to: string) => canAct && attempt(from, to),
    },
    promotion,
    choosePromotion,
    clearSelection: () => setSelected(null),
  };
}

export type { ChessSquare };
