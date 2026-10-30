import type { Theme } from '../hooks/useTheme';
import { IconButton } from './ui/Button';
import { ChartIcon, MoonIcon, MuteIcon, SunIcon, VolumeIcon } from './ui/icons';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  sound: boolean;
  onToggleSound: () => void;
  onOpenStats: () => void;
}

export function Header({ theme, onToggleTheme, sound, onToggleSound, onOpenStats }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Logo />
        <div className="leading-tight">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink-900 dark:text-white">
            Rank <span className="text-gold-500 dark:text-gold-300">&amp;</span> File
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">Coordinate trainer</p>
        </div>
      </div>
      <nav className="flex items-center gap-1">
        <IconButton label="Statistics" onClick={onOpenStats}>
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
