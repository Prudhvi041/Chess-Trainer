import { Button } from './ui/Button';
import { PlayIcon } from './ui/icons';

interface Props {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}

export function BoardOverlay({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div className="absolute inset-0 z-20 grid animate-fade-in place-items-center bg-ink-950/45 p-6 backdrop-blur-[3px]">
      <div className="max-w-xs animate-scale-in text-center">
        <p className="font-display text-3xl font-semibold text-white drop-shadow sm:text-4xl">{title}</p>
        <p className="mt-2 text-sm text-white/80">{subtitle}</p>
        <Button size="lg" className="mt-5 min-w-[11rem]" onClick={onAction} data-autofocus>
          <PlayIcon size={16} />
          {actionLabel}
        </Button>
        <p className="mt-3 hidden text-xs text-white/60 sm:block">
          or press <kbd className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[11px]">Space</kbd>
        </p>
      </div>
    </div>
  );
}
