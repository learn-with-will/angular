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
 * Receives every local edit while the learner is signed in, so it can be saved to
 * their account. Implemented by CloudSyncService.
 */
export interface ProgressSink {
  /** One local edit: the state before and after it. */
  push(prev: UserProgress, next: UserProgress): void;
  /** The state was replaced wholesale (reset), not edited. */
  replace(next: UserProgress): void;
}

/**
 * Holds the learner's progress. State lives in a signal so components react
 * automatically.
 *
 * Two storage modes, switched by CloudSyncService as the learner signs in and out:
 *  - **local** (default): written to localStorage (key `…-v2`) by an effect. This is
 *    all that exists for someone who never signs in.
 *  - **cloud**: the account is the source of truth. Edits are forwarded to the
 *    {@link ProgressSink} and deliberately NOT written to localStorage, so signing
 *    out leaves no copy of the account's progress on the device.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly _progress = signal<UserProgress>(this.read());
  private readonly _cloud = signal(false);
  private sink: ProgressSink | null = null;

  /** True while progress is backed by an account rather than this device. */
  readonly isCloud = this._cloud.asReadonly();

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
      if (this._cloud()) return; // the account holds it; keep the device clean
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
    this.commit((p) => {
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
    this.commit((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(slug)
        ? p.bookmarks.filter((s) => s !== slug)
        : [...p.bookmarks, slug],
    }));
  }

  setLastOpened(slug: string): void {
    this.commit((p) => ({ ...p, lastOpened: slug }));
  }

  /** Tallies one answered question. */
  recordAnswer(questionId: string, correct: boolean): void {
    this.commit((p) => {
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
    this.commit((p) => ({
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
    this.commit(() => ({
      ...current,
      learned,
      bookmarks: [...bookmarks],
      legacyImported: [...done],
    }));
  }

  /** Clears everything — and, when signed in, the account's copy too. */
  reset(): void {
    const next: UserProgress = { ...emptyProgress(), legacyImported: [LEGACY_DISMISSED] };
    this._progress.set(next);
    this.sink?.replace(next);
  }

  // ---- Account sync (driven by CloudSyncService) --------------------------

  /**
   * Progress made on this device while signed out. While still in local mode the
   * live state is that progress (the persisting effect may not have flushed the
   * very last edit to storage yet), so prefer it over what is on disk.
   */
  peekLocal(): UserProgress {
    return this._cloud() ? this.read() : this._progress();
  }

  /** Forgets the device copy once it has safely reached the account. */
  clearLocal(): void {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch {
      /* storage may be unavailable; nothing to clear */
    }
  }

  /** Switches to account-backed progress, starting from `initial`. */
  attachCloud(sink: ProgressSink, initial: UserProgress): void {
    this.sink = sink;
    this._cloud.set(true);
    this._progress.set(initial);
  }

  /** Shows progress that arrived from the account. Never echoed back to the sink. */
  applyRemote(next: UserProgress): void {
    this._progress.set(next);
  }

  /** Back to this device's own progress (signed out): nothing of the account stays. */
  detachCloud(): void {
    this.sink = null;
    this._cloud.set(false);
    this._progress.set(this.read());
  }

  /** Applies an edit, then forwards it to the account if there is one. */
  private commit(update: (p: UserProgress) => UserProgress): void {
    const prev = this._progress();
    const next = update(prev);
    this._progress.set(next);
    this.sink?.push(prev, next);
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
