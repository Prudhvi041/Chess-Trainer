import { formatMs } from '../lib/format';
import { Card, CardTitle } from './ui/Card';
import { StatGrid } from './StatGrid';

interface Props {
  gamesPlayed: number;
  highestScore: number;
  averageScore: number | null;
  fastestMs: number | null;
  onOpen: () => void;
}

export function QuickStats({ gamesPlayed, highestScore, averageScore, fastestMs, onOpen }: Props) {
  return (
    <Card className="p-5">
      <CardTitle
        action={
          <button
            onClick={onOpen}
            className="text-xs font-semibold text-gold-600 hover:text-gold-500 dark:text-gold-300 dark:hover:text-gold-200"
          >
            All stats →
          </button>
        }
      >
        Statistics
      </CardTitle>
      <StatGrid
        items={[
          { label: 'Games played', value: gamesPlayed },
          { label: 'Highest score', value: highestScore },
          { label: 'Average score', value: averageScore == null ? '—' : averageScore.toFixed(1) },
          { label: 'Fastest', value: formatMs(fastestMs) },
        ]}
      />
    </Card>
  );
}
