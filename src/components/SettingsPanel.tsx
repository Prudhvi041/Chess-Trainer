import type { Difficulty, GameMode, Settings } from '../game/types';
import { Card, CardTitle } from './ui/Card';
import { SegmentedControl, type SegmentOption } from './ui/SegmentedControl';
import { Toggle } from './ui/Toggle';
import { ClockIcon, MuteIcon, VolumeIcon } from './ui/icons';

const DIFFICULTIES: readonly SegmentOption<Difficulty>[] = [
  { value: 'easy', label: 'Easy', hint: 'Rank & file glow on hover' },
  { value: 'medium', label: 'Medium', hint: 'Standard board' },
  { value: 'hard', label: 'Hard', hint: 'Board turns every 5 points' },
];

const MODES: readonly SegmentOption<GameMode>[] = [
  { value: 'classic', label: 'Classic', hint: 'Target stays visible' },
  { value: 'memory', label: 'Memory', hint: 'Shown for 1s, then hidden' },
];

interface Props {
  settings: Settings;
  locked: boolean;
  onChange: (patch: Partial<Settings>) => void;
}

export function SettingsPanel({ settings, locked, onChange }: Props) {
  return (
    <Card className="p-5">
      <CardTitle
        action={
          locked ? (
            <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-600 dark:text-gold-300">
              Locked in game
            </span>
          ) : null
        }
      >
        Training setup
      </CardTitle>
      <div className="space-y-4">
        <SegmentedControl
          label="Difficulty"
          value={settings.difficulty}
          options={DIFFICULTIES}
          onChange={(difficulty) => onChange({ difficulty })}
          disabled={locked}
        />
        <SegmentedControl
          label="Mode"
          value={settings.mode}
          options={MODES}
          onChange={(mode) => onChange({ mode })}
          disabled={locked}
        />
        <div className="space-y-3 border-t border-ink-200/70 pt-4 dark:border-white/[0.06]">
          <Toggle
            label="Timer"
            description="3 seconds per square — timeout ends the run"
            checked={settings.timer}
            onChange={(timer) => onChange({ timer })}
            disabled={locked}
            icon={<ClockIcon />}
          />
          <Toggle
            label="Sound effects"
            description="Chimes for hits, buzz for misses"
            checked={settings.sound}
            onChange={(sound) => onChange({ sound })}
            icon={settings.sound ? <VolumeIcon /> : <MuteIcon />}
          />
        </div>
      </div>
    </Card>
  );
}
