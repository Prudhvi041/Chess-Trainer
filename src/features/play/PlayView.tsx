import { useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { buildProfile } from '../../coach/profile';
import { newGameId, useGameStore } from '../../coach/storage';
import { START_FEN } from '../../learn/chess';
import type { SoundName } from '../../lib/sound';
import { DrillScreen } from './DrillScreen';
import { GameScreen } from './GameScreen';
import { PlayHome } from './PlayHome';
import { PuzzleScreen } from './PuzzleScreen';
import { ReviewScreen } from './ReviewScreen';

export type PlayRoute =
  | { screen: 'home' }
  | { screen: 'game' }
  | { screen: 'review'; id: string }
  | { screen: 'drills' }
  | { screen: 'puzzles'; angle: string };

interface Props {
  route: PlayRoute;
  navigate: (r: PlayRoute) => void;
  onOpenLesson: (id: string) => void;
  play: (s: SoundName) => void;
}

export function PlayView({ route, navigate, onOpenLesson, play }: Props) {
  const store = useGameStore();
  const profile = useMemo(() => buildProfile(store.games), [store.games]);
  const home = () => navigate({ screen: 'home' });

  const startGame = (level: number, color: 'w' | 'b' | 'random') => {
    // abandon any unfinished game
    if (store.current) store.deleteGame(store.current.id);
    const userColor = color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : color;
    store.saveGame({ id: newGameId(), startedAt: Date.now(), startFen: START_FEN, moves: [], userColor, level });
    navigate({ screen: 'game' });
    play('start');
  };

  switch (route.screen) {
    case 'game':
      if (!store.current) {
        const last = store.games[0];
        if (last?.result) {
          // finished game still on screen (e.g. after refresh) → show it
          return (
            <GameScreen
              key={last.id}
              record={last}
              onSave={store.saveGame}
              onReview={(id) => navigate({ screen: 'review', id })}
              onNewGame={home}
              onExit={home}
              play={play}
            />
          );
        }
        return <Missing onBack={home} text="No game in progress." />;
      }
      return (
        <GameScreen
          key={store.current.id}
          record={store.current}
          onSave={store.saveGame}
          onReview={(id) => navigate({ screen: 'review', id })}
          onNewGame={home}
          onExit={home}
          play={play}
        />
      );
    case 'review': {
      const record = store.games.find((g) => g.id === route.id);
      if (!record) return <Missing onBack={home} text="That game isn’t saved on this device." />;
      return (
        <ReviewScreen
          key={record.id}
          record={record}
          onSave={store.saveGame}
          onAddDrills={store.addDrills}
          onExit={home}
          onOpenLesson={onOpenLesson}
          onPuzzles={(angle) => navigate({ screen: 'puzzles', angle })}
        />
      );
    }
    case 'drills':
      return <DrillScreen drills={store.dueDrills} onGrade={store.gradeDrill} onExit={home} play={play} />;
    case 'puzzles':
      return (
        <PuzzleScreen
          angle={route.angle}
          onAngle={(angle) => navigate({ screen: 'puzzles', angle })}
          onExit={home}
          onDrills={() => navigate({ screen: 'drills' })}
          play={play}
        />
      );
    default:
      return (
        <PlayHome
          games={store.games}
          current={store.current}
          profile={profile}
          dueDrills={store.dueDrills.length}
          onStart={startGame}
          onResume={() => navigate({ screen: 'game' })}
          onReview={(id) => navigate({ screen: 'review', id })}
          onDrills={() => navigate({ screen: 'drills' })}
          onPuzzles={(angle) => navigate({ screen: 'puzzles', angle })}
          onOpenLesson={onOpenLesson}
          onReset={store.resetCoach}
        />
      );
  }
}

function Missing({ text, onBack }: { text: string; onBack: () => void }) {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <p className="font-semibold">{text}</p>
      <Button className="mt-4" onClick={onBack}>
        Back to Play
      </Button>
    </Card>
  );
}
