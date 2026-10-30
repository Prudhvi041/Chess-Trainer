import { useCallback, useState } from 'react';
import { Piece } from '../../components/chess/pieces';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ALL_LESSONS, findLesson, nextLessonId } from '../../learn/curriculum';
import { cn } from '../../lib/format';
import type { SoundName } from '../../lib/sound';
import { StepRunner } from './StepRunner';
import { UNIT_PIECE } from './unitPieces';

interface Props {
  lessonId: string;
  play: (s: SoundName) => void;
  onExit: () => void;
  onOpenLesson: (id: string) => void;
  onComplete: (id: string) => void;
  courseDone: boolean;
}

export function LessonPlayer({ lessonId, play, onExit, onOpenLesson, onComplete, courseDone }: Props) {
  const found = findLesson(lessonId);
  const [stepIndex, setStepIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [finished, setFinished] = useState(false);

  const stepCount = found?.lesson.steps.length ?? 0;
  const handleContinue = useCallback(() => {
    if (!found) return;
    if (stepIndex < stepCount - 1) {
      setStepIndex((i) => i + 1);
      setAttempt(0);
    } else {
      onComplete(found.lesson.id);
      play('badge');
      setFinished(true);
    }
  }, [found, stepIndex, stepCount, onComplete, play]);

  if (!found) {
    return (
      <Card className="p-8 text-center">
        <p>Lesson not found.</p>
        <Button className="mt-4" onClick={onExit}>
          Back to course
        </Button>
      </Card>
    );
  }

  const { unit, lesson } = found;
  const lessonNumber = ALL_LESSONS.findIndex((l) => l.id === lesson.id) + 1;
  const next = nextLessonId(lesson.id);
  const nextLesson = next ? findLesson(next)?.lesson : null;

  return (
    <div className="animate-fade-in">
      {/* top bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={onExit}
          className="self-start rounded-xl px-2 py-1 text-sm font-medium text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          ← Course
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Lesson {lessonNumber} · {unit.title}
          </p>
          <h1 className="truncate font-display text-xl font-semibold sm:text-2xl">{lesson.title}</h1>
        </div>
        <div className="flex gap-1" aria-label={`Step ${stepIndex + 1} of ${stepCount}`}>
          {lesson.steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 w-5 rounded-full transition-colors duration-300 sm:w-7',
                finished || i < stepIndex
                  ? 'bg-gold-400'
                  : i === stepIndex
                    ? 'bg-ink-700 dark:bg-white'
                    : 'bg-ink-900/10 dark:bg-white/10',
              )}
            />
          ))}
        </div>
      </div>

      {finished ? (
        <Card className="relative mx-auto max-w-xl overflow-hidden p-8 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-56 w-80 rounded-full bg-gold-300/30 blur-3xl" />
          <div className="relative mx-auto grid h-24 w-24 animate-pop place-items-center rounded-full bg-gradient-to-br from-[#FFF1B8] via-gold-400 to-gold-600 p-3 shadow-xl ring-4 ring-gold-400/30">
            <Piece type={UNIT_PIECE[unit.id]} color="b" className="h-full w-full" />
          </div>
          <h2 className="relative mt-5 font-display text-3xl font-semibold">
            {courseDone && !nextLesson ? 'Course complete!' : 'Lesson complete!'}
          </h2>
          <p className="relative mt-2 text-ink-500 dark:text-ink-300">
            {courseDone && !nextLesson
              ? 'You’ve finished every lesson. Now go play some games!'
              : `You finished “${lesson.title}”.`}
          </p>
          <div className="relative mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Button variant="ghost" onClick={onExit}>
              Back to course
            </Button>
            {nextLesson && (
              <Button onClick={() => onOpenLesson(nextLesson.id)} data-autofocus>
                Next: {nextLesson.title} →
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <StepRunner
          key={`${lesson.id}-${stepIndex}-${attempt}`}
          step={lesson.steps[stepIndex]}
          stepNumber={stepIndex + 1}
          stepCount={stepCount}
          isLast={stepIndex === stepCount - 1}
          play={play}
          onBack={stepIndex > 0 ? () => (setStepIndex((i) => i - 1), setAttempt(0)) : null}
          onContinue={handleContinue}
          onReset={() => setAttempt((a) => a + 1)}
        />
      )}
    </div>
  );
}
