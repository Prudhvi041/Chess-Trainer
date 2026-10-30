import { Chess } from 'chess.js';
import { useMemo, useState } from 'react';
import { ChessBoard, type ToneArrow } from '../../components/chess/ChessBoard';
import { Button } from '../../components/ui/Button';
import { winChance } from '../../coach/review';
import type { Drill } from '../../coach/storage';
import { THEMES } from '../../coach/themes';
import { useEngine } from '../../hooks/useEngine';
import { useMoveInput } from '../../hooks/useMoveInput';
import type { SoundName } from '../../lib/sound';
import { PromotionPicker } from '../learn/PromotionPicker';
import { FeedbackBox, TrainerShell } from './TrainerShell';

interface Props {
  drills: Drill[];
  onGrade: (id: string, correct: boolean) => void;
  onExit: () => void;
  play: (s: SoundName) => void;
}

/** "Fix my mistakes": replay positions from your own games until you find a good move. */
export function DrillScreen({ drills: initial, onGrade, onExit, play }: Props) {
  // Freeze the session's list so grading doesn't reshuffle it mid-session.
  const [queue] = useState(initial);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const drill = queue[index];

  if (!drill) {
    return (
      <TrainerShell board={<EmptyBoard />}>
        <h2 className="font-display text-2xl font-semibold">{queue.length ? 'Session complete!' : 'All caught up'}</h2>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          {queue.length
            ? `You fixed ${score} of ${queue.length} positions. Missed ones will come back soon; solved ones return after a few days to make them stick.`
            : 'No mistakes are due for practice. Play and review more games to fill your practice list.'}
        </p>
        <Button className="mt-auto self-start" onClick={onExit}>
          Back to Play
        </Button>
      </TrainerShell>
    );
  }

  return (
    <DrillRunner
      key={drill.id}
      drill={drill}
      position={index + 1}
      total={queue.length}
      play={play}
      onExit={onExit}
      onDone={(correct) => {
        onGrade(drill.id, correct);
        if (correct) setScore((s) => s + 1);
        setIndex((i) => i + 1);
      }}
    />
  );
}

function DrillRunner({
  drill,
  position,
  total,
  play,
  onExit,
  onDone,
}: {
  drill: Drill;
  position: number;
  total: number;
  play: (s: SoundName) => void;
  onExit: () => void;
  onDone: (correct: boolean) => void;
}) {
  const engine = useEngine();
  const game = useMemo(() => new Chess(drill.fen), [drill.fen]);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<'solving' | 'checking' | 'correct' | 'wrong'>('solving');
  const [message, setMessage] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<[string, string] | null>(null);
  // fixed per drill (game.turn() changes once a move is played)
  const userColor = useMemo(() => new Chess(drill.fen).turn(), [drill.fen]);

  const judge = async (uci: string) => {
    const mv = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    setLastMove([mv.from, mv.to]);
    setVersion((v) => v + 1);
    play(mv.captured ? 'capture' : 'move');
    if (uci === drill.bestMove) {
      setState('correct');
      setMessage(`Correct! ${drill.bestSan} is the best move here.`);
      play('correct');
      return;
    }
    setState('checking');
    let ok = false;
    if (game.isCheckmate()) ok = true;
    else {
      try {
        const r = await engine.search(drill.fen, [uci], { timeMs: 600 });
        ok = winChance(-r.score) >= winChance(drill.bestScore) - 5;
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setState('correct');
      setMessage(`Good move! The engine’s top choice was ${drill.bestSan}, but ${mv.san} works too.`);
      play('correct');
    } else {
      setState('wrong');
      setMessage(`Not quite: ${mv.san} doesn’t fix it. The best move was ${drill.bestSan}.`);
      play('wrong');
      window.setTimeout(() => {
        game.undo();
        setLastMove(null);
        setVersion((v) => v + 1);
      }, 900);
    }
  };

  const input = useMoveInput(game, version, { enabled: state === 'solving', color: userColor, onMove: judge });
  const arrows: ToneArrow[] =
    state === 'wrong' ? [{ from: drill.bestMove.slice(0, 2), to: drill.bestMove.slice(2, 4), tone: 'green' }] : [];
  const mainTheme = drill.themes.find((t) => t !== 'opening' && t !== 'endgame') ?? drill.themes[0];

  return (
    <TrainerShell
      board={
        <ChessBoard
          {...input.board}
          flip={userColor === 'b'}
          lastMove={lastMove}
          toneArrows={arrows}
          overlay={input.promotion ? <PromotionPicker color={userColor} onPick={input.choosePromotion} /> : undefined}
        />
      }
    >
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
          ← Play
        </button>
        <span className="font-mono text-xs text-ink-400">
          {position} / {total}
        </span>
      </div>
      <span className="mt-4 self-start rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
        Fix my mistake
      </span>
      <h2 className="mt-3 font-display text-2xl font-semibold">Find a better move</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-600 dark:text-ink-200">
        In one of your games you played <strong className="text-ink-900 dark:text-white">{drill.playedSan}</strong> here.
        You’re {userColor === 'w' ? 'White' : 'Black'}. What should you play instead?
      </p>
      {mainTheme && (
        <p className="mt-2 text-xs text-ink-400">
          Theme: {THEMES[mainTheme].label}. {THEMES[mainTheme].tip}
        </p>
      )}
      <div className="mt-4 min-h-[3.5rem]">
        {state === 'checking' && <FeedbackBox tone="info">Checking your move…</FeedbackBox>}
        {message && state !== 'checking' && <FeedbackBox tone={state === 'correct' ? 'success' : 'error'}>{message}</FeedbackBox>}
      </div>
      <div className="mt-auto flex justify-end gap-2 pt-4">
        {state === 'solving' && (
          <Button variant="ghost" onClick={() => onDone(false)}>
            Skip
          </Button>
        )}
        {(state === 'correct' || state === 'wrong') && (
          <Button onClick={() => onDone(state === 'correct')} data-autofocus>
            Next →
          </Button>
        )}
      </div>
    </TrainerShell>
  );
}

function EmptyBoard() {
  return <ChessBoard pieces={{}} />;
}
