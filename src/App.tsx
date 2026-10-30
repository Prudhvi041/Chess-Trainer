import { useCallback, useEffect, useRef, useState } from 'react';
import { Board } from './components/Board';
import { BoardOverlay } from './components/BoardOverlay';
import { BadgeShelf } from './components/BadgeShelf';
import { GameOverModal } from './components/GameOverModal';
import { Header } from './components/Header';
import { QuickStats } from './components/QuickStats';
import { ScoreBoard } from './components/ScoreBoard';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsModal } from './components/StatsModal';
import { TargetDisplay } from './components/TargetDisplay';
import { ToastStack } from './components/ToastStack';
import { DEFAULT_SETTINGS, type GameSummary, type Settings } from './game/types';
import { useGame } from './hooks/useGame';
import { usePersistentState } from './hooks/usePersistentState';
import { useStats } from './hooks/useStats';
import { useTheme } from './hooks/useTheme';
import { useToasts } from './hooks/useToasts';
import { badgeReachedAt } from './lib/badges';
import { ORIENTATION_LABEL, ORIENTATION_SHORT } from './lib/coords';
import { describeLevel, hideBoardLabels, LABELS_HIDE_AT } from './lib/difficulty';
import { soundEngine, type SoundName } from './lib/sound';

/** Delay between a miss and the Game Over modal, so the player sees the correct square. */
const REVIEW_DELAY_MS = 900;

type ModalPhase = 'hidden' | 'open' | 'dismissed';

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [settings, setSettings] = usePersistentState<Settings>('settings', DEFAULT_SETTINGS);
  const { stats, averageScore, accuracy, averageResponseMs, recordGame, resetStats } = useStats();
  const { toasts, push: toast } = useToasts();

  const [statsOpen, setStatsOpen] = useState(false);
  const [modal, setModal] = useState<ModalPhase>('hidden');
  const [summary, setSummary] = useState<(GameSummary & { previousBest: number }) | null>(null);

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const soundOn = useRef(settings.sound);
  soundOn.current = settings.sound;
  const play = useCallback((name: SoundName) => soundOn.current && soundEngine.play(name), []);

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
      if (statsOpen || modal === 'open' || state.status === 'playing') return;
      if (state.status === 'over' && modal === 'hidden') return; // still reviewing the miss
      e.preventDefault();
      startGame();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [statsOpen, modal, state.status, startGame]);

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
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-ink-50 text-ink-900 transition-colors duration-300 dark:bg-ink-950 dark:text-ink-50">
      <Backdrop />
      <ToastStack toasts={toasts} />

      <div className="relative">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          sound={settings.sound}
          onToggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
          onOpenStats={() => setStatsOpen(true)}
        />

        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
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
              averageScore={averageScore}
              fastestMs={stats.fastestMs}
              onOpen={() => setStatsOpen(true)}
            />
          </aside>
        </main>

        <footer className="pb-8 text-center text-xs text-ink-400">
          Train a few minutes a day — coordinates become instinct.
        </footer>
      </div>

      <GameOverModal
        open={modal === 'open'}
        summary={summary}
        onRestart={startGame}
        onClose={() => setModal('dismissed')}
      />
      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        averageScore={averageScore}
        accuracy={accuracy}
        averageResponseMs={averageResponseMs}
        onReset={resetStats}
      />
    </div>
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

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gold-300/25 blur-[120px] dark:bg-gold-500/10" />
      <div className="absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-[#A97A52]/20 blur-[120px] dark:bg-[#A97A52]/10" />
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%), linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%)',
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 24px 24px',
        }}
      />
    </div>
  );
}
