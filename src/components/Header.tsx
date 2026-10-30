import type { Theme } from '../hooks/useTheme';
import { cn } from '../lib/format';
import { IconButton } from './ui/Button';
import { ChartIcon, GridIcon, MoonIcon, MuteIcon, SunIcon, VolumeIcon } from './ui/icons';

export type View = 'train' | 'learn';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
  theme: Theme;
  onToggleTheme: () => void;
  sound: boolean;
  onToggleSound: () => void;
  onOpenStats: () => void;
}

export function Header({ view, onViewChange, theme, onToggleTheme, sound, onToggleSound, onOpenStats }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Logo />
        <div className="hidden leading-tight md:block">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink-900 dark:text-white">
            Rank <span className="text-gold-500 dark:text-gold-300">&amp;</span> File
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">Chess trainer</p>
        </div>
      </div>
      <ViewTabs view={view} onChange={onViewChange} />
      <nav className="flex items-center gap-0.5 sm:gap-1">
        <IconButton label="Statistics" onClick={onOpenStats} className={view === 'learn' ? 'hidden sm:grid' : undefined}>
          <ChartIcon />
        </IconButton>
        <IconButton label={sound ? 'Mute sounds' : 'Unmute sounds'} onClick={onToggleSound}>
          {sound ? <VolumeIcon /> : <MuteIcon />}
        </IconButton>
        <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </IconButton>
      </nav>
    </header>
  );
}

function ViewTabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tabs: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'train', label: 'Train', icon: <GridIcon size={15} /> },
    { id: 'learn', label: 'Learn', icon: <span className="text-[15px] leading-none">♞</span> },
  ];
  return (
    <div role="tablist" aria-label="Section" className="relative grid grid-cols-2 rounded-2xl bg-ink-900/[0.06] p-1 dark:bg-white/[0.07]">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-[cubic-bezier(.2,.9,.3,1)] dark:bg-ink-600 dark:ring-white/10"
        style={{ transform: `translateX(${view === 'learn' ? 100 : 0}%)` }}
      />
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={view === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative z-10 flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors sm:px-5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
            view === t.id ? 'text-ink-900 dark:text-white' : 'text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-white',
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden className="drop-shadow-md">
      <rect width="40" height="40" rx="11" className="fill-ink-900 dark:fill-ink-700" />
      <g transform="translate(9 9)">
        <rect width="11" height="11" fill="#EEDCB8" />
        <rect x="11" width="11" height="11" fill="#A97A52" />
        <rect y="11" width="11" height="11" fill="#A97A52" />
        <rect x="11" y="11" width="11" height="11" fill="#EEDCB8" />
      </g>
      <circle cx="26" cy="14" r="4.5" fill="#D4AA3A" stroke="#1C1A17" strokeWidth="1.5" />
    </svg>
  );
}
