import { useEffect } from 'react';
import { ChessBoard } from '../../components/chess/ChessBoard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CheckIcon } from '../../components/ui/icons';
import type { Step } from '../../learn/types';
import { cn } from '../../lib/format';
import type { SoundName } from '../../lib/sound';
import { PromotionPicker } from './PromotionPicker';
import { RichText } from './RichText';
import { useLessonStep } from './useLessonStep';

interface Props {
  step: Step;
  stepNumber: number;
  stepCount: number;
  isLast: boolean;
  play: (s: SoundName) => void;
  onBack: (() => void) | null;
  onContinue: () => void;
  onReset: () => void;
}

const KIND_LABEL: Record<Step['kind'], string> = {
  explain: 'Learn',
  click: 'Find the square',
  select: 'Mark the moves',
  stars: 'Collect the stars',
  move: 'Your move',
};

export function StepRunner({ step, stepNumber, stepCount, isLast, play, onBack, onContinue, onReset }: Props) {
  const s = useLessonStep(step, play);
  const practice = step.kind !== 'explain';

  // Enter / → continues once the step is solved.
  useEffect(() => {
    if (!s.solved) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== 'ArrowRight') return;
      if ((e.target as HTMLElement).closest('button, input, textarea, [role="dialog"]')) return;
      e.preventDefault();
      onContinue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s.solved, onContinue]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="mx-auto w-full" style={{ maxWidth: 'max(320px, min(640px, calc(100dvh - 190px)))' }}>
        <ChessBoard
          {...s.board}
          overlay={
            s.promotion ? <PromotionPicker color={s.promotionColor} onPick={s.choosePromotion} /> : undefined
          }
        />
      </div>

      <Card className="order-first flex flex-col p-5 sm:p-6 lg:order-none lg:sticky lg:top-4 lg:min-h-[420px]">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]',
              practice
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'bg-gold-400/15 text-gold-700 dark:text-gold-300',
            )}
          >
            {KIND_LABEL[step.kind]}
          </span>
          <span className="font-mono text-xs text-ink-400">
            {stepNumber} / {stepCount}
          </span>
        </div>

        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{step.title}</h2>
        <RichText text={step.text} className="mt-2 text-[15px] leading-relaxed text-ink-600 dark:text-ink-200" />

        {step.kind === 'stars' && !s.solved && (
          <p className="mt-3 text-xs text-ink-400">
            Moves: <span className="font-mono font-semibold text-ink-700 dark:text-ink-100">{s.moveCount}</span>
            {s.par != null && <> · best possible: {s.par}</>}
          </p>
        )}

        <div className="mt-4 min-h-0 lg:min-h-[3.5rem]" aria-live="polite">
          {s.feedback && (
            <div
              key={s.feedback.text}
              className={cn(
                'flex animate-scale-in items-start gap-2.5 rounded-2xl px-4 py-3 text-sm leading-snug',
                s.feedback.tone === 'success' && 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
                s.feedback.tone === 'error' && 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
                s.feedback.tone === 'info' && 'bg-ink-900/[0.05] text-ink-700 dark:bg-white/[0.06] dark:text-ink-100',
              )}
            >
              <span className="mt-px shrink-0">
                {s.feedback.tone === 'success' ? (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
                    <CheckIcon size={12} strokeWidth={3} />
                  </span>
                ) : s.feedback.tone === 'error' ? (
                  '✕'
                ) : (
                  '💡'
                )}
              </span>
              <span>{s.feedback.text}</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center gap-1 pt-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← Back
            </Button>
          )}
          {practice && !s.solved && (
            <>
              <Button variant="ghost" size="sm" onClick={s.showHint}>
                Hint
              </Button>
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
            </>
          )}
          <div className="ml-auto shrink-0">
            {step.kind === 'select' && !s.solved ? (
              <Button onClick={s.checkSelection} disabled={s.pickedCount === 0}>
                Check
              </Button>
            ) : (
              <Button onClick={onContinue} disabled={!s.solved} data-autofocus>
                {isLast ? 'Finish lesson' : 'Continue'} →
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
