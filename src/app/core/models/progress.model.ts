import { QuizMode } from './quiz.model';

/** Running tally for one question. `lastCorrect` drives the "Missed" quiz mode. */
export interface QuestionStat {
  seen: number;
  correct: number;
  lastCorrect: boolean;
}

/** One finished quiz run, newest first in `UserProgress.sessions`. */
export interface QuizSession {
  at: string;
  mode: QuizMode;
  topics: string[];
  total: number;
  correct: number;
  /** Ids of the questions answered wrong in this run. */
  missed: string[];
}

export interface UserProgress {
  version: 2;
  /** lesson slug → ISO date it was marked learned */
  learned: Record<string, string>;
  bookmarks: string[];
  lastOpened?: string;
  questions: Record<string, QuestionStat>;
  sessions: QuizSession[];
  /** Old long-lesson ids already folded into `learned`/`bookmarks`. */
  legacyImported: string[];
}

export const PROGRESS_STORAGE_KEY = 'angular-learning-progress-v2';
/** The v1 key, read once to carry old completions and bookmarks over. */
export const LEGACY_PROGRESS_STORAGE_KEY = 'angular-learning-progress';

export const MAX_SESSIONS = 50;

/** Written into `legacyImported` by reset() so old progress is not resurrected. */
export const LEGACY_DISMISSED = '*';

export function emptyProgress(): UserProgress {
  return {
    version: 2,
    learned: {},
    bookmarks: [],
    questions: {},
    sessions: [],
    legacyImported: [],
  };
}
