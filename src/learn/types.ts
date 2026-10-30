/** Lesson content model. All squares are lowercase algebraic ids ("e4"). */

export type Arrow = [from: string, to: string];

interface StepBase {
  title: string;
  /** Lightweight markup: **bold**, blank line = new paragraph. */
  text: string;
  fen: string;
  /** Show the board from Black's side. */
  flip?: boolean;
  highlights?: string[];
  arrows?: Arrow[];
  lastMove?: Arrow;
}

/** Read and look — no interaction needed. */
export interface ExplainStep extends StepBase {
  kind: 'explain';
}

/** Click the right square(s). */
export interface ClickStep extends StepBase {
  kind: 'click';
  answers: string[];
  /** How many distinct correct squares must be clicked (default 1). */
  count?: number;
  hint: string;
  success: string;
}

/** Mark every square the piece on `from` can move to. */
export interface SelectStep extends StepBase {
  kind: 'select';
  from: string;
  hint: string;
  success: string;
}

/** Move your piece(s) to collect every star. Enemy pieces on star squares are captured. Black never moves. */
export interface StarsStep extends StepBase {
  kind: 'stars';
  stars: string[];
  hint: string;
  success: string;
}

export type MoveGoal = string[] | 'mate' | 'check';

export interface MoveStage {
  /** Accepted UCI moves (e.g. "e2e4", "e7e8q"), or any mate / any check. */
  accept: MoveGoal;
  /** Opponent's scripted reply (UCI) after a correct move. */
  reply?: string;
  /** Instruction shown for this stage (after the first). */
  prompt?: string;
}

/** Find the right move (or sequence of moves). */
export interface MoveStep extends StepBase {
  kind: 'move';
  solution: MoveStage[];
  hint: string;
  success: string;
  /** Custom feedback for specific wrong-but-legal moves (UCI → message). */
  wrong?: Record<string, string>;
  /** Feedback for an illegal move attempt. */
  illegal?: string;
}

export type Step = ExplainStep | ClickStep | SelectStep | StarsStep | MoveStep;

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  steps: Step[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  glyph: string;
  lessons: Lesson[];
}
