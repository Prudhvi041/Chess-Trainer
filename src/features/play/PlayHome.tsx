import { useState } from 'react';
import { Piece } from '../../components/chess/pieces';
import { Button } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { PlayIcon } from '../../components/ui/icons';
import type { CoachProfile } from '../../coach/profile';
import type { GameRecord } from '../../coach/storage';
import { THEMES } from '../../coach/themes';
import { BOT_LEVELS } from '../../engine/levels';
import { usePersistentState } from '../../hooks/usePersistentState';
import { cn } from '../../lib/format';

interface Props {
  games: GameRecord[];
  current: GameRecord | null;
  profile: CoachProfile;
  dueDrills: number;
  onStart: (level: number, color: 'w' | 'b' | 'random') => void;
  onResume: () => void;
  onReview: (id: string) => void;
  onDrills: () => void;
  onPuzzles: (angle: string) => void;
  onOpenLesson: (id: string) => void;
  onReset: () => void;
}

export function PlayHome(props: Props) {
  const { games, current, profile } = props;
  const finished = games.filter((g) => g.result);
  return (
    <div className="grid animate-fade-in gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col gap-5">
        {current && (
          <Card className="flex items-center gap-4 p-5 ring-1 ring-gold-400/40">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-400/15 p-1.5">
              <Piece type="n" color="b" className="h-full w-full" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Game in progress</p>
              <p className="text-sm text-ink-400">
                vs Level {current.level} {BOT_LEVELS[current.level - 1].name} · {Math.ceil(current.moves.length / 2)} moves
              </p>
            </div>
            <Button onClick={props.onResume}>Continue</Button>
          </Card>
        )}
        <NewGameCard onStart={props.onStart} />
        <RecentGames games={finished} onReview={props.onReview} />
      </div>
      <CoachCard {...props} profile={profile} />
    </div>
  );
}

function NewGameCard({ onStart }: { onStart: Props['onStart'] }) {
  const [level, setLevel] = usePersistentState('bot-level', 2);
  const [color, setColor] = usePersistentState<'w' | 'b' | 'random'>('bot-color', 'w');
  const info = BOT_LEVELS[level - 1];
  return (
    <Card className="relative overflow-hidden p-6">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold-300/25 blur-3xl dark:bg-gold-500/10" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">Play the computer</p>
      <h1 className="relative mt-1 font-display text-3xl font-semibold tracking-tight">New game</h1>
      <p className="relative mt-1 text-sm text-ink-500 dark:text-ink-300">Free, offline, and runs on your device. Pick a level that gives you a fair fight.</p>

      <div className="relative mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-medium">Opponent</span>
          <span className="text-xs text-ink-400">{info.blurb}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {BOT_LEVELS.map((l) => (
            <button
              key={l.level}
              onClick={() => setLevel(l.level)}
              aria-pressed={level === l.level}
              title={`Level ${l.level}: ${l.name}`}
              className={cn(
                'flex h-12 flex-col items-center justify-center rounded-xl text-sm font-bold transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
                level === l.level
                  ? 'bg-ink-900 text-white shadow-lg dark:bg-white dark:text-ink-900'
                  : 'bg-ink-900/[0.05] text-ink-600 hover:bg-ink-900/10 dark:bg-white/[0.06] dark:text-ink-200 dark:hover:bg-white/[0.12]',
              )}
            >
              {l.level}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm font-semibold">
          Level {info.level}: {info.name}
        </p>
      </div>

      <div className="relative mt-4">
        <span className="mb-2 block text-sm font-medium">You play</span>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ['w', 'White'],
              ['random', 'Random'],
              ['b', 'Black'],
            ] as const
          ).map(([c, label]) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-pressed={color === c}
              className={cn(
                'flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                color === c
                  ? 'bg-gold-400/20 text-ink-900 ring-2 ring-gold-400 dark:text-white'
                  : 'bg-ink-900/[0.05] text-ink-600 hover:bg-ink-900/10 dark:bg-white/[0.06] dark:text-ink-200',
              )}
            >
              {c === 'random' ? (
                <span className="relative h-6 w-6">
                  <Piece type="k" color="w" className="absolute left-0 top-0 h-5 w-5" />
                  <Piece type="k" color="b" className="absolute bottom-0 right-0 h-5 w-5" />
                </span>
              ) : (
                <Piece type="k" color={c} className="h-6 w-6" />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" className="relative mt-6 w-full" onClick={() => onStart(level, color)}>
        <PlayIcon size={15} /> Start game
      </Button>
    </Card>
  );
}

function CoachCard({ profile, dueDrills, onDrills, onPuzzles, onOpenLesson, onReset }: Props) {
  const [confirm, setConfirm] = useState(false);
  const top = profile.focus.filter((f) => f.theme !== 'calculation' || profile.focus.length === 1).slice(0, 3);
  const maxCount = Math.max(1, ...top.map((f) => f.count));
  const avg = profile.accuracy.length ? profile.accuracy.reduce((a, b) => a + b, 0) / profile.accuracy.length : null;

  return (
    <Card className="flex flex-col p-6">
      <CardTitle>Your coach</CardTitle>
      {profile.analyzedGames === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center py-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-board-light p-2 ring-1 ring-black/5">
            <Piece type="q" color="b" className="h-full w-full" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold">Play, review, improve</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500 dark:text-ink-300">
            After each game, tap <strong className="text-ink-800 dark:text-white">Review game</strong>. Your coach checks every
            move, finds the kinds of mistakes you repeat (hanging pieces, missed forks, back-rank mates…) and builds practice
            around exactly those.
          </p>
          <Button variant="secondary" className="mt-5" onClick={() => onPuzzles('fork')}>
            Try some puzzles meanwhile
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Games reviewed" value={profile.analyzedGames} />
            <Stat label="Avg accuracy" value={avg == null ? '—' : `${Math.round(avg)}%`} />
            <Stat label="W / L / D" value={`${profile.record.win}/${profile.record.loss}/${profile.record.draw}`} />
          </div>
          {profile.accuracy.length >= 2 && <AccuracyTrend values={profile.accuracy} />}

          <h3 className="mt-5 text-sm font-semibold">Focus on these</h3>
          <p className="text-xs text-ink-400">Your most frequent mistakes in recent games.</p>
          <ol className="mt-3 space-y-3">
            {top.map((f, i) => {
              const t = THEMES[f.theme];
              return (
                <li key={f.theme} className="rounded-2xl bg-ink-900/[0.03] p-4 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-900 font-mono text-xs font-bold text-white dark:bg-white dark:text-ink-900">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 font-semibold">{t.label}</span>
                    <span className="text-xs text-ink-400">
                      {f.count}× in {f.games} game{f.games > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="ml-10 mt-2 h-1.5 overflow-hidden rounded-full bg-ink-900/[0.06] dark:bg-white/[0.08]">
                    <div className="h-full rounded-full bg-ink-600 dark:bg-ink-200" style={{ width: `${(f.count / maxCount) * 100}%` }} />
                  </div>
                  <p className="ml-10 mt-2 text-sm text-ink-500 dark:text-ink-300">{t.tip}</p>
                  <div className="ml-10 mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => onPuzzles(t.puzzleAngle)}>
                      Practice puzzles
                    </Button>
                    {t.lesson && (
                      <Button size="sm" variant="ghost" onClick={() => onOpenLesson(t.lesson!)}>
                        Review the lesson
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <button
        onClick={onDrills}
        className="mt-5 flex items-center gap-3 rounded-2xl bg-rose-500/[0.07] p-4 text-left ring-1 ring-inset ring-rose-500/20 transition hover:bg-rose-500/[0.12]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500 font-mono text-sm font-bold text-white">{dueDrills}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Fix my mistakes</span>
          <span className="block text-xs text-ink-500 dark:text-ink-300">
            {dueDrills ? 'Positions from your own games, ready to replay.' : 'Nothing due right now. Review games to add more.'}
          </span>
        </span>
        <span aria-hidden>→</span>
      </button>

      <div className="mt-4 flex justify-between text-xs text-ink-400">
        <span>Puzzles by lichess.org (public domain)</span>
        {confirm ? (
          <span className="flex gap-2">
            Erase games & coach data?
            <button className="font-semibold text-rose-500" onClick={() => (onReset(), setConfirm(false))}>
              Yes
            </button>
            <button onClick={() => setConfirm(false)}>No</button>
          </span>
        ) : (
          <button className="hover:text-ink-700 dark:hover:text-white" onClick={() => setConfirm(true)}>
            Reset coach
          </button>
        )}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-ink-900/[0.04] px-3 py-2.5 dark:bg-white/[0.05]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-bold">{value}</div>
    </div>
  );
}

/** Single-series sparkline of accuracy per reviewed game, with hover values. */
function AccuracyTrend({ values }: { values: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 300;
  const H = 56;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - 4 - (v / 100) * (H - 8);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return (
    <div className="relative mt-4">
      <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
        <span>Accuracy trend</span>
        <span>{hover != null ? `Game ${hover + 1}: ${Math.round(values[hover])}%` : `last ${values.length} games`}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-14 w-full overflow-visible"
        role="img"
        aria-label={`Accuracy over your last ${values.length} reviewed games: ${values.map((v) => Math.round(v) + '%').join(', ')}`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.max(0, Math.min(values.length - 1, Math.round(((e.clientX - r.left) / r.width) * (values.length - 1)))));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <line x1={0} x2={W} y1={y(50)} y2={y(50)} className="stroke-ink-400/30" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" className="stroke-ink-700 dark:stroke-ink-100" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} className="stroke-gold-500" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  );
}

function RecentGames({ games, onReview }: { games: GameRecord[]; onReview: (id: string) => void }) {
  if (!games.length) return null;
  return (
    <Card className="p-5">
      <CardTitle>Recent games</CardTitle>
      <ul className="divide-y divide-ink-200/70 dark:divide-white/[0.06]">
        {games.slice(0, 8).map((g) => (
          <li key={g.id} className="flex items-center gap-3 py-2.5">
            <span
              className={cn(
                'w-12 rounded-lg py-1 text-center text-xs font-bold uppercase',
                g.result === 'win' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                g.result === 'loss' && 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
                g.result === 'draw' && 'bg-ink-900/[0.06] text-ink-600 dark:bg-white/10 dark:text-ink-200',
              )}
            >
              {g.result}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                vs Level {g.level} {BOT_LEVELS[g.level - 1].name}
              </span>
              <span className="block text-xs text-ink-400">
                {g.reason} · {Math.ceil(g.moves.length / 2)} moves · {new Date(g.startedAt).toLocaleDateString()}
                {g.review && ` · ${Math.round(g.review.accuracy[g.userColor])}% accuracy`}
              </span>
            </span>
            <Button size="sm" variant={g.review ? 'ghost' : 'secondary'} onClick={() => onReview(g.id)}>
              {g.review ? 'Open' : 'Review'}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
