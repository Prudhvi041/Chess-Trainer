import { useCallback, useEffect, useRef, useState } from 'react';
import { Header, type View } from './components/Header';
import { StatsModal } from './components/StatsModal';
import { LearnView } from './features/learn/LearnView';
import { TrainView } from './features/train/TrainView';
import { DEFAULT_SETTINGS, type Settings } from './game/types';
import { usePersistentState } from './hooks/usePersistentState';
import { useStats } from './hooks/useStats';
import { useTheme } from './hooks/useTheme';
import { findLesson } from './learn/curriculum';
import { soundEngine, type SoundName } from './lib/sound';

/* ── Hash routing: #train · #learn · #lesson-<id> (works on GitHub Pages and static hosts) ── */

interface Route {
  view: View;
  lesson: string | null;
}

function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '');
  if (h.startsWith('lesson-')) {
    const id = h.slice('lesson-'.length);
    if (findLesson(id)) return { view: 'learn', lesson: id };
  }
  return { view: h === 'learn' ? 'learn' : 'train', lesson: null };
}

const toHash = (r: Route) => (r.lesson ? `#lesson-${r.lesson}` : `#${r.view}`);

function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = useCallback((r: Route) => {
    if (toHash(r) !== window.location.hash) window.location.hash = toHash(r);
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  return [route, navigate] as const;
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [settings, setSettings] = usePersistentState<Settings>('settings', DEFAULT_SETTINGS);
  const statsApi = useStats();
  const [statsOpen, setStatsOpen] = useState(false);
  const [route, navigate] = useHashRoute();

  const soundOn = useRef(settings.sound);
  soundOn.current = settings.sound;
  const play = useCallback((name: SoundName) => soundOn.current && soundEngine.play(name), []);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-ink-50 text-ink-900 transition-colors duration-300 dark:bg-ink-950 dark:text-ink-50">
      <Backdrop />
      <div className="relative">
        <Header
          view={route.view}
          onViewChange={(view) => navigate({ view, lesson: null })}
          theme={theme}
          onToggleTheme={toggleTheme}
          sound={settings.sound}
          onToggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
          onOpenStats={() => setStatsOpen(true)}
        />

        <main className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          {route.view === 'train' ? (
            <TrainView
              settings={settings}
              setSettings={setSettings}
              statsApi={statsApi}
              play={play}
              modalBlocked={statsOpen}
              onOpenStats={() => setStatsOpen(true)}
            />
          ) : (
            <LearnView
              lessonId={route.lesson}
              onOpenLesson={(lesson) => navigate({ view: 'learn', lesson })}
              play={play}
            />
          )}
        </main>

        <footer className="pb-8 text-center text-xs text-ink-400">
          {route.view === 'train'
            ? 'Train a few minutes a day: coordinates become instinct.'
            : 'Learn a little, practice a lot.'}
        </footer>
      </div>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={statsApi.stats}
        averageScore={statsApi.averageScore}
        accuracy={statsApi.accuracy}
        averageResponseMs={statsApi.averageResponseMs}
        onReset={statsApi.resetStats}
      />
    </div>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gold-300/25 blur-[120px] dark:bg-gold-500/10" />
      <div className="absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-[#A97A52]/20 blur-[120px] dark:bg-[#A97A52]/10" />
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%), linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%)',
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0, 24px 24px',
        }}
      />
    </div>
  );
}
