import type { SoundName } from '../../lib/sound';
import { CourseHome } from './CourseHome';
import { LessonPlayer } from './LessonPlayer';
import { useLearnProgress } from './useLearnProgress';

interface Props {
  lessonId: string | null;
  onOpenLesson: (id: string | null) => void;
  play: (s: SoundName) => void;
}

export function LearnView({ lessonId, onOpenLesson, play }: Props) {
  const progress = useLearnProgress();

  if (lessonId) {
    return (
      <LessonPlayer
        key={lessonId}
        lessonId={lessonId}
        play={play}
        onExit={() => onOpenLesson(null)}
        onOpenLesson={onOpenLesson}
        onComplete={progress.markComplete}
        courseDone={progress.completedCount + (progress.completed.has(lessonId) ? 0 : 1) >= progress.total}
      />
    );
  }

  return (
    <CourseHome
      completed={progress.completed}
      completedCount={progress.completedCount}
      total={progress.total}
      nextUp={progress.nextUp}
      onOpenLesson={onOpenLesson}
      onReset={progress.reset}
    />
  );
}
