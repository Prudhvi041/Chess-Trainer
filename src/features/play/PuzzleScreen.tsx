import { Chess } from 'chess.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChessBoard } from '../../components/chess/ChessBoard';
import { Button } from '../../components/ui/Button';
import { fetchPuzzle, PUZZLE_ANGLES, type LichessPuzzle, type PuzzleDifficulty } from '../../coach/lichess';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useMoveInput } from '../../hooks/useMoveInput';
import { cn } from '../../lib/format';
import type { SoundName } from '../../lib/sound';
import { PromotionPicker } from '../learn/PromotionPicker';
import { FeedbackBox, TrainerShell } from './TrainerShell';

interface Props {
  angle: string;
  onAngle: (angle: string) => void;
  onExit: () => void;
  onDrills: () => void;
  play: (s: SoundName) => void;
}

const DIFFICULTIES: { id: PuzzleDifficulty; label: string }[] = [
  { id: 'easiest', label: 'Easiest' },
  { id: 'easier', label: 'Easier' },
  { id: 'normal', label: 'Normal' },
  { id: 'harder', label: 'Harder' },
];

export function PuzzleScreen({ angle, onAngle, onExit, onDrills, play }: Props) {
  const [difficulty, setDifficulty] = usePersistentState<PuzzleDifficulty>('puzzle-difficulty', 'easier');
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(0);
  const [stats, setStats] = usePersistentState<{ solved: number; failed: number }>('puzzle-stats', { solved: 0, failed: 0 });

  const load = useCallback(() => setCounter((c) => c + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchPuzzle(angle, difficulty, ctrl.signal)
      .then((p) => setPuzzle(p))
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message.includes('fetch') ? 'Couldn’t reach Lichess. Are you online?' : e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [angle, difficulty, counter]);

  const label = PUZZLE_ANGLES.find((a) => a.angle === angle)?.label ?? angle;

  const header = (
    <>
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
          ← Play
        </button>
        <span className="text-xs text-ink-400">
          {stats.solved} solved · {stats.failed} missed
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PUZZLE_ANGLES.map((a) => (
          <button
            key={a.angle}
            onClick={() => onAngle(a.angle)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold transition',
              a.angle === angle
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                : 'bg-ink-900/[0.05] text-ink-600 hover:bg-ink-900/10 dark:bg-white/[0.07] dark:text-ink-200 dark:hover:bg-white/15',
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs">
        <span className="mr-1 text-ink-400">Difficulty</span>
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            onClick={() => setDifficulty(d.id)}
            className={cn(
              'rounded-md px-2 py-0.5 font-medium',
              difficulty === d.id ? 'bg-gold-400/25 text-ink-900 dark:text-white' : 'text-ink-500 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white',
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
    </>
  );

  if (error || (!puzzle && !loading)) {
    return (
      <TrainerShell board={<ChessBoard pieces={{}} />}>
        {header}
        <div className="mt-5">
          <FeedbackBox tone="error">{error ?? 'No puzzle loaded.'}</FeedbackBox>
        </div>
        <p className="mt-3 text-sm text-ink-500 dark:text-ink-300">Puzzles come from Lichess and need an internet connection. Practising your own mistakes works offline.</p>
        <div className="mt-auto flex gap-2 pt-4">
          <Button variant="ghost" onClick={onDrills}>
            Fix my mistakes
          </Button>
          <Button onClick={load}>Try again</Button>
        </div>
      </TrainerShell>
    );
  }

  if (!puzzle || loading) {
    return (
      <TrainerShell board={<ChessBoard pieces={{}} />}>
        {header}
        <p className="mt-6 flex items-center gap-2 text-sm text-ink-400">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading a {label.toLowerCase()} puzzle from Lichess…
        </p>
      </TrainerShell>
    );
  }

  return (
    <PuzzleRunner
      key={puzzle.id + counter}
      puzzle={puzzle}
      header={header}
      label={label}
      play={play}
      onNext={load}
      onResult={(ok) => setStats((s) => (ok ? { ...s, solved: s.solved + 1 } : { ...s, failed: s.failed + 1 }))}
    />
  );
}

function PuzzleRunner({
  puzzle,
  header,
  label,
  play,
  onNext,
  onResult,
}: {
  puzzle: LichessPuzzle;
  header: React.ReactNode;
  label: string;
  play: (s: SoundName) => void;
  onNext: () => void;
  onResult: (ok: boolean) => void;
}) {
  const game = useMemo(() => new Chess(puzzle.fen), [puzzle.fen]);
  const [version, setVersion] = useState(0);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<'solving' | 'wrong' | 'solved' | 'revealed'>('solving');
  const [missed, setMissed] = useState(false);
  const [lastMove, setLastMove] = useState<[string, string] | null>(puzzle.lastMove);
  const [hint, setHint] = useState<string | null>(null);

  const apply = (uci: string) => {
    const mv = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    setLastMove([mv.from, mv.to]);
    setVersion((v) => v + 1);
    play(mv.captured ? 'capture' : 'move');
    return mv;
  };

  const onMove = (uci: string) => {
    const expected = puzzle.solution[step];
    apply(uci);
    setHint(null);
    const isLast = step >= puzzle.solution.length - 1;
    // Lichess accepts any mating move on the final step.
    if (uci === expected || (isLast && game.isCheckmate())) {
      if (isLast) {
        setState('solved');
        play('badge');
        if (!missed) onResult(true);
        return;
      }
      play('correct');
      const reply = puzzle.solution[step + 1];
      window.setTimeout(() => {
        apply(reply);
        setStep(step + 2);
        if (step + 2 >= puzzle.solution.length) {
          setState('solved');
          if (!missed) onResult(true);
        }
      }, 450);
      setStep(step + 1);
      return;
    }
    setState('wrong');
    if (!missed) {
      setMissed(true);
      onResult(false);
    }
    play('wrong');
    window.setTimeout(() => {
      game.undo();
      setLastMove(puzzle.lastMove);
      setVersion((v) => v + 1);
      setState('solving');
    }, 900);
  };

  const reveal = () => {
    if (!missed) {
      setMissed(true);
      onResult(false);
    }
    setState('revealed');
    let s = step;
    const run = () => {
      if (s >= puzzle.solution.length) return;
      apply(puzzle.solution[s]);
      s++;
      window.setTimeout(run, 600);
    };
    run();
  };

  const myTurn = state === 'solving' && step % 2 === 0;
  const input = useMoveInput(game, version, { enabled: myTurn, color: puzzle.userColor, onMove });

  return (
    <TrainerShell
      board={
        <ChessBoard
          {...input.board}
          flip={puzzle.userColor === 'b'}
          lastMove={lastMove}
          highlights={hint ? [hint] : []}
          overlay={input.promotion ? <PromotionPicker color={puzzle.userColor} onPick={input.choosePromotion} /> : undefined}
        />
      }
    >
      {header}
      <h2 className="mt-5 font-display text-2xl font-semibold">{label}</h2>
      <p className="mt-1 text-[15px] text-ink-600 dark:text-ink-200">
        You play <strong className="text-ink-900 dark:text-white">{puzzle.userColor === 'w' ? 'White' : 'Black'}</strong>. Find the best move.
      </p>
      <p className="mt-1 text-xs text-ink-400">Puzzle rating {puzzle.rating}</p>
      <div className="mt-4 min-h-[3.5rem]">
        {state === 'wrong' && <FeedbackBox tone="error">That’s not it. Try again!</FeedbackBox>}
        {state === 'solving' && step > 0 && <FeedbackBox tone="info">Good! Keep going.</FeedbackBox>}
        {state === 'solved' && <FeedbackBox tone="success">{missed ? 'Solved, with a slip along the way.' : 'Solved! Well spotted.'}</FeedbackBox>}
        {state === 'revealed' && <FeedbackBox tone="info">Here’s the solution. Try the next one!</FeedbackBox>}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {state === 'solving' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const m = puzzle.solution[step];
                setHint(m.slice(0, 2));
                input.clearSelection();
              }}
            >
              Hint
            </Button>
            <Button variant="ghost" size="sm" onClick={reveal}>
              Show solution
            </Button>
          </>
        )}
        <a
          href={`https://lichess.org/training/${puzzle.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-ink-400 underline-offset-2 hover:underline"
        >
          Puzzle #{puzzle.id} on lichess.org
        </a>
        {(state === 'solved' || state === 'revealed') && (
          <Button className="ml-auto" onClick={onNext} data-autofocus>
            Next puzzle →
          </Button>
        )}
      </div>
    </TrainerShell>
  );
}
