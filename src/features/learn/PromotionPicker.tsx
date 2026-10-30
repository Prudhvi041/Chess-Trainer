import { Piece, PIECE_NAMES, type PieceColor, type PieceType } from '../../components/chess/pieces';

const CHOICES: PieceType[] = ['q', 'r', 'b', 'n'];

export function PromotionPicker({ color, onPick }: { color: PieceColor; onPick: (t: PieceType | null) => void }) {
  return (
    <div className="absolute inset-0 z-30 grid animate-fade-in place-items-center bg-ink-950/55 backdrop-blur-[2px]">
      <div className="animate-scale-in rounded-2xl bg-ink-50 p-4 text-center shadow-2xl dark:bg-ink-800">
        <p className="mb-3 text-sm font-semibold text-ink-700 dark:text-ink-100">Promote to…</p>
        <div className="flex gap-2">
          {CHOICES.map((t) => (
            <button
              key={t}
              onClick={() => onPick(t)}
              data-autofocus={t === 'q' ? '' : undefined}
              aria-label={`Promote to ${PIECE_NAMES[t]}`}
              className="h-16 w-16 rounded-xl bg-board-light p-1 ring-1 ring-black/10 transition hover:scale-105 hover:ring-2 hover:ring-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <Piece type={t} color={color} className="h-full w-full" />
            </button>
          ))}
        </div>
        <button onClick={() => onPick(null)} className="mt-3 text-xs font-medium text-ink-400 hover:text-ink-700 dark:hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}
