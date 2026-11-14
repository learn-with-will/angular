import { Injectable, computed, effect, signal } from '@angular/core';
import { LegacyEntry } from '../models/lesson.model';
import {
  LEGACY_DISMISSED,
  LEGACY_PROGRESS_STORAGE_KEY,
  MAX_SESSIONS,
  PROGRESS_STORAGE_KEY,
  QuestionStat,
  QuizSession,
  UserProgress,
  emptyProgress,
} from '../models/progress.model';

/**
 * Persists the learner's progress to localStorage (key `…-v2`). State lives in a
 * signal so components react automatically; an effect writes through on change.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly _progress = signal<UserProgress>(this.read());

  readonly progress = this._progress.asReadonly();
  readonly learned = computed(() => this._progress().learned);
  readonly learnedCount = computed(() => Object.keys(this._progress().learned).length);
  readonly bookmarks = computed(() => this._progress().bookmarks);
  readonly lastOpened = computed(() => this._progress().lastOpened);
  readonly questionStats = computed(() => this._progress().questions);
  readonly sessions = computed(() => this._progress().sessions);

  /** Ids of questions whose most recent answer was wrong, for the "Missed" quiz. */
  readonly missedIds = computed<ReadonlySet<string>>(
    () =>
      new Set(
        Object.entries(this._progress().questions)
          .filter(([, s]) => !s.lastCorrect)
          .map(([id]) => id),
      ),
  );

  /** Share of answers that were right across every question, or null before the first answer. */
  readonly accuracy = computed<number | null>(() => {
    const stats = Object.values(this._progress().questions);
    const seen = stats.reduce((n, s) => n + s.seen, 0);
    if (seen === 0) return null;
    return Math.round((stats.reduce((n, s) => n + s.correct, 0) / seen) * 100);
  });

  constructor() {
    effect(() => {
      const data = this._progress();
      try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* storage may be unavailable (private mode); ignore */
      }
    });
  }

  isLearned(slug: string): boolean {
    return slug in this._progress().learned;
  }

  isBookmarked(slug: string): boolean {
    return this._progress().bookmarks.includes(slug);
  }

  setLearned(slug: string, learned: boolean): void {
    this._progress.update((p) => {
      const next = { ...p.learned };
      if (learned) next[slug] = new Date().toISOString();
      else delete next[slug];
      return { ...p, learned: next };
    });
  }

  toggleLearned(slug: string): void {
    this.setLearned(slug, !this.isLearned(slug));
  }

  toggleBookmark(slug: string): void {
    this._progress.update((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(slug)
        ? p.bookmarks.filter((s) => s !== slug)
        : [...p.bookmarks, slug],
    }));
  }

  setLastOpened(slug: string): void {
    this._progress.update((p) => ({ ...p, lastOpened: slug }));
  }

  /** Tallies one answered question. */
  recordAnswer(questionId: string, correct: boolean): void {
    this._progress.update((p) => {
      const prev: QuestionStat = p.questions[questionId] ?? { seen: 0, correct: 0, lastCorrect: true };
      const next: QuestionStat = {
        seen: prev.seen + 1,
        correct: prev.correct + (correct ? 1 : 0),
        lastCorrect: correct,
      };
      return { ...p, questions: { ...p.questions, [questionId]: next } };
    });
  }

  /** Stores a finished quiz run, keeping only the newest MAX_SESSIONS. */
  recordSession(session: QuizSession): void {
    this._progress.update((p) => ({
      ...p,
      sessions: [session, ...p.sessions].slice(0, MAX_SESSIONS),
    }));
  }

  /**
   * Carries v1 progress over: each old lesson the learner completed or bookmarked
   * is mapped to the bites that replaced it. Idempotent, and incremental — lessons
   * whose topic has not been migrated yet stay pending for a later run. Old quiz
   * scores have no equivalent and are dropped.
   */
  importLegacy(legacy: readonly LegacyEntry[]): void {
    const current = this._progress();
    if (current.legacyImported.includes(LEGACY_DISMISSED)) return;
    const old = this.readLegacy();
    if (!old) return;

    const byId = new Map(legacy.map((e) => [e.id, e]));
    const done = new Set(current.legacyImported);
    const learned = { ...current.learned };
    const bookmarks = new Set(current.bookmarks);
    const now = new Date().toISOString();

    for (const id of new Set([...old.completed, ...old.bookmarked])) {
      const entry = byId.get(id);
      if (!entry || entry.lessons.length === 0 || done.has(id)) continue;
      for (const slug of entry.lessons) {
        if (old.completed.includes(id) && !(slug in learned)) learned[slug] = now;
        if (old.bookmarked.includes(id)) bookmarks.add(slug);
      }
      done.add(id);
    }

    if (done.size === current.legacyImported.length) return;
    this._progress.set({
      ...current,
      learned,
      bookmarks: [...bookmarks],
      legacyImported: [...done],
    });
  }

  reset(): void {
    this._progress.set({ ...emptyProgress(), legacyImported: [LEGACY_DISMISSED] });
  }

  private read(): UserProgress {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) return emptyProgress();
      const parsed = JSON.parse(raw) as Partial<UserProgress>;
      if (parsed.version !== 2) return emptyProgress();
      return { ...emptyProgress(), ...parsed };
    } catch {
      return emptyProgress();
    }
  }

  private readLegacy(): { completed: string[]; bookmarked: string[] } | null {
    try {
      const raw = localStorage.getItem(LEGACY_PROGRESS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { completedLessons?: string[]; bookmarkedLessons?: string[] };
      return {
        completed: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
        bookmarked: Array.isArray(parsed.bookmarkedLessons) ? parsed.bookmarkedLessons : [],
      };
    } catch {
      return null;
    }
  }
}
