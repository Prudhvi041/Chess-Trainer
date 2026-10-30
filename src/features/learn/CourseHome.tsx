import { useState } from 'react';
import { Piece } from '../../components/chess/pieces';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CheckIcon, PlayIcon } from '../../components/ui/icons';
import { ALL_LESSONS, COURSE, findLesson } from '../../learn/curriculum';
import { cn } from '../../lib/format';
import { UNIT_PIECE } from './unitPieces';

interface Props {
  completed: Set<string>;
  completedCount: number;
  total: number;
  nextUp: string | null;
  onOpenLesson: (id: string) => void;
  onReset: () => void;
}

export function CourseHome({ completed, completedCount, total, nextUp, onOpenLesson, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const pct = Math.round((completedCount / total) * 100);
  const next = nextUp ? findLesson(nextUp)?.lesson : null;
  const minutes = ALL_LESSONS.reduce((a, l) => a + l.minutes, 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold-300/25 blur-3xl dark:bg-gold-500/10" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">
              Beginner course
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Learn chess from zero
            </h1>
            <p className="mt-3 max-w-xl text-ink-500 dark:text-ink-300">
              {total} short, hands-on lessons. Read a little, then practice right on the board: move the pieces,
              solve puzzles, get instant feedback. About {minutes} minutes in all.
            </p>
            <div className="mt-5 max-w-md">
              <div className="mb-1.5 flex justify-between text-xs font-medium text-ink-500 dark:text-ink-300">
                <span>
                  {completedCount} of {total} lessons
                </span>
                <span className="font-mono">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-900/[0.06] dark:bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {next ? (
                <Button size="lg" onClick={() => onOpenLesson(next.id)}>
                  <PlayIcon size={15} />
                  {completedCount === 0 ? 'Start the course' : `Continue: ${next.title}`}
                </Button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckIcon size={16} /> Course complete. Replay any lesson below.
                </span>
              )}
            </div>
          </div>
          <HeroArt />
        </div>
      </Card>

      {/* Units */}
      <div className="grid gap-5 md:grid-cols-2">
        {COURSE.map((unit, u) => {
          const done = unit.lessons.filter((l) => completed.has(l.id)).length;
          const unitDone = done === unit.lessons.length;
          return (
            <Card key={unit.id} className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'grid h-14 w-14 shrink-0 place-items-center rounded-2xl p-2 ring-1 transition-colors',
                    unitDone
                      ? 'bg-gradient-to-br from-[#FFF1B8] via-gold-300 to-gold-500 ring-gold-400/40'
                      : 'bg-board-light ring-black/5 dark:bg-ink-700 dark:ring-white/10',
                  )}
                >
                  <Piece type={UNIT_PIECE[unit.id]} color={unitDone ? 'w' : 'b'} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Unit {u + 1} · {done}/{unit.lessons.length}
                  </p>
                  <h2 className="font-display text-xl font-semibold">{unit.title}</h2>
                  <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-300">{unit.description}</p>
                </div>
              </div>
              <ol className="mt-4 space-y-1">
                {unit.lessons.map((lesson) => {
                  const isDone = completed.has(lesson.id);
                  const isNext = lesson.id === nextUp;
                  const n = ALL_LESSONS.indexOf(lesson) + 1;
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => onOpenLesson(lesson.id)}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                          'hover:bg-ink-900/[0.04] dark:hover:bg-white/[0.05]',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
                          isNext && 'bg-gold-400/10 ring-1 ring-inset ring-gold-400/30',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs font-bold',
                            isDone
                              ? 'bg-gold-400 text-ink-900'
                              : isNext
                                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                                : 'bg-ink-900/[0.06] text-ink-500 dark:bg-white/[0.08] dark:text-ink-300',
                          )}
                        >
                          {isDone ? <CheckIcon size={14} strokeWidth={3} /> : n}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-800 dark:text-ink-50">
                            {lesson.title}
                          </span>
                          <span className="block truncate text-xs text-ink-400">{lesson.summary}</span>
                        </span>
                        <span className="shrink-0 text-xs text-ink-400">{lesson.minutes} min</span>
                        <span className="shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-600 dark:group-hover:text-white">
                          →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Card>
          );
        })}
      </div>

      {completedCount > 0 && (
        <div className="flex justify-center gap-2 text-xs text-ink-400">
          {confirmReset ? (
            <>
              <span>Reset all lesson progress?</span>
              <button className="font-semibold text-rose-500" onClick={() => (onReset(), setConfirmReset(false))}>
                Yes, reset
              </button>
              <button onClick={() => setConfirmReset(false)}>Cancel</button>
            </>
          ) : (
            <button className="hover:text-ink-700 dark:hover:text-white" onClick={() => setConfirmReset(true)}>
              Reset course progress
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HeroArt() {
  return (
    <div aria-hidden className="relative mx-auto hidden h-44 w-44 md:block">
      <div className="absolute inset-0 grid grid-cols-4 overflow-hidden rounded-3xl shadow-board ring-1 ring-black/10">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className={(Math.floor(i / 4) + i) % 2 ? 'bg-board-dark' : 'bg-board-light'} />
        ))}
      </div>
      <Piece type="k" color="w" className="absolute -left-4 bottom-2 h-28 w-28 drop-shadow-xl" />
      <Piece type="n" color="b" className="absolute -right-5 -top-3 h-24 w-24 rotate-6 drop-shadow-xl" />
    </div>
  );
}
