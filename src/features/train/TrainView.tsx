import { useCallback, useEffect, useRef, useState } from 'react';
import { Board } from '../../components/Board';
import { BoardOverlay } from '../../components/BoardOverlay';
import { BadgeShelf } from '../../components/BadgeShelf';
import { GameOverModal } from '../../components/GameOverModal';
import { QuickStats } from '../../components/QuickStats';
import { ScoreBoard } from '../../components/ScoreBoard';
import { SettingsPanel } from '../../components/SettingsPanel';
import { TargetDisplay } from '../../components/TargetDisplay';
import { ToastStack } from '../../components/ToastStack';
import type { GameSummary, Settings } from '../../game/types';
import { useGame } from '../../hooks/useGame';
import type { useStats } from '../../hooks/useStats';
import { useToasts } from '../../hooks/useToasts';
import { badgeReachedAt } from '../../lib/badges';
import { ORIENTATION_LABEL, ORIENTATION_SHORT } from '../../lib/coords';
import { describeLevel, hideBoardLabels, LABELS_HIDE_AT } from '../../lib/difficulty';
import type { SoundName } from '../../lib/sound';

/** Delay between a miss and the Game Over modal, so the player sees the correct square. */
const REVIEW_DELAY_MS = 900;

type ModalPhase = 'hidden' | 'open' | 'dismissed';

interface Props {
  settings: Settings;
  setSettings: (update: (s: Settings) => Settings) => void;
  statsApi: ReturnType<typeof useStats>;
  play: (s: SoundName) => void;
  modalBlocked: boolean;
  onOpenStats: () => void;
}

export function TrainView({ settings, setSettings, statsApi, play, modalBlocked, onOpenStats }: Props) {
  const { stats, accuracy, recordGame } = statsApi;
  const { toasts, push: toast } = useToasts();

  const [modal, setModal] = useState<ModalPhase>('hidden');
  const [summary, setSummary] = useState<(GameSummary & { previousBest: number }) | null>(null);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const modalTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(modalTimer.current), []);

  const { state, start, answer } = useGame(settings, {
    onStart: () => play('start'),
    onCorrect: ({ score }) => {
      const badge = badgeReachedAt(score);
      if (badge) {
        play('badge');
        const isNew = score > statsRef.current.highestScore;
        toast({
          title: `${badge.name} badge ${isNew ? 'unlocked' : 'reached'}!`,
          description: `${badge.threshold} squares in a row`,
          icon: badge.glyph,
          tone: 'gold',
        });
      } else {
        play('correct');
      }
      if (settings.mode === 'memory' && score === LABELS_HIDE_AT) {
        toast({ title: 'Board labels hidden', description: 'Pure memory from here on', icon: '🧠' });
      }
    },
    onGameOver: (s) => {
      play('wrong');
      setSummary({ ...s, previousBest: statsRef.current.highestScore });
      recordGame(s);
      window.clearTimeout(modalTimer.current);
      modalTimer.current = window.setTimeout(() => setModal('open'), REVIEW_DELAY_MS);
    },
  });

  // Announce board rotations (Hard).
  const lastRotation = useRef<number | null>(null);
  useEffect(() => {
    if (state.rotatedRound == null || state.rotatedRound === lastRotation.current) return;
    lastRotation.current = state.rotatedRound;
    play('rotate');
    toast({ title: 'Board rotated', description: ORIENTATION_LABEL[state.orientation], icon: '↻' });
  }, [state.rotatedRound, state.orientation, play, toast]);

  const startGame = useCallback(() => {
    window.clearTimeout(modalTimer.current);
    setModal('hidden');
    start();
  }, [start]);

  // Space / Enter to start when not mid-game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const el = e.target as HTMLElement;
      if (el.closest('button, input, select, textarea, [role="dialog"]')) return;
      if (modalBlocked || modal === 'open' || state.status === 'playing') return;
      if (state.status === 'over' && modal === 'hidden') return; // still reviewing the miss
      e.preventDefault();
      startGame();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalBlocked, modal, state.status, startGame]);

  const playing = state.status === 'playing';
  const liveAccuracy = playing
    ? safeRatio(stats.totalCorrect + state.score, stats.totalAttempts + state.attempts)
    : accuracy;
  const best = Math.max(stats.highestScore, state.score);

  const overlay =
    state.status === 'idle' ? (
      <BoardOverlay
        title="Find the square"
        subtitle={overlaySubtitle(settings)}
        actionLabel="Start training"
        onAction={startGame}
      />
    ) : state.status === 'over' && modal === 'dismissed' ? (
      <BoardOverlay
        title={`Score: ${state.score}`}
        subtitle="The red square was your click; the green one was the target."
        actionLabel="Play again"
        onAction={startGame}
      />
    ) : null;

  return (
    <>
      <ToastStack toasts={toasts} />
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section
          className="mx-auto flex w-full flex-col gap-3 sm:gap-4"
          style={{ maxWidth: 'max(320px, min(620px, calc(100dvh - 320px)))' }}
        >
          <TargetDisplay
            status={state.status}
            target={state.target}
            hidden={state.targetHidden}
            round={state.round}
            mode={settings.mode}
            timeLimitMs={state.status === 'idle' ? (settings.timer ? 3000 : null) : state.timeLimitMs}
            revealMs={state.revealMs}
            level={playing ? describeLevel(settings.mode, state.score) : null}
            orientationLabel={ORIENTATION_SHORT[state.orientation]}
            showOrientation={settings.difficulty === 'hard' && state.status !== 'idle'}
          />
          <ScoreBoard score={state.score} best={best} streak={state.streak} accuracy={liveAccuracy} />
          <Board
            orientation={state.orientation}
            interactive={playing}
            showLabels={!(playing && hideBoardLabels(settings.mode, state.score))}
            highlightLines={settings.difficulty === 'easy'}
            correctFlash={state.lastCorrect ? { square: state.lastCorrect.square, key: state.lastCorrect.round } : null}
            failure={state.status === 'over' ? state.failure : null}
            onSelect={answer}
            overlay={overlay}
          />
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          <SettingsPanel
            settings={settings}
            locked={playing}
            onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          />
          <BadgeShelf highestScore={stats.highestScore} />
          <QuickStats
            gamesPlayed={stats.gamesPlayed}
            highestScore={stats.highestScore}
            averageScore={statsApi.averageScore}
            fastestMs={stats.fastestMs}
            onOpen={onOpenStats}
          />
        </aside>
      </div>

      <GameOverModal
        open={modal === 'open'}
        summary={summary}
        onRestart={startGame}
        onClose={() => setModal('dismissed')}
      />
    </>
  );
}

const safeRatio = (a: number, b: number) => (b ? a / b : null);

function overlaySubtitle(s: Settings): string {
  const parts = [
    s.difficulty === 'easy' ? 'Easy' : s.difficulty === 'hard' ? 'Hard' : 'Medium',
    s.mode === 'memory' ? 'Memory mode' : 'Classic',
  ];
  if (s.timer) parts.push('3s timer');
  return `${parts.join(' · ')}. One miss ends the run.`;
}
