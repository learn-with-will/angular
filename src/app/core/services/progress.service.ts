import { Injectable, computed, effect, signal } from '@angular/core';
import {
  EMPTY_PROGRESS,
  PROGRESS_STORAGE_KEY,
  QuizResultRecord,
  UserProgress,
} from '../models/progress.model';

/**
 * Persists the user's learning progress to localStorage. State lives in a
 * signal so components react automatically; an effect writes through on change.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly _progress = signal<UserProgress>(this.read());

  readonly progress = this._progress.asReadonly();
  readonly completedCount = computed(() => this._progress().completedLessons.length);
  readonly bookmarks = computed(() => this._progress().bookmarkedLessons);
  readonly quizResults = computed(() => this._progress().quizResults);
  readonly lastOpenedLesson = computed(() => this._progress().lastOpenedLesson);

  readonly averageScore = computed(() => {
    const scores = Object.values(this._progress().quizResults).map((r) => r.score);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
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

  isCompleted(lessonId: string): boolean {
    return this._progress().completedLessons.includes(lessonId);
  }

  isBookmarked(lessonId: string): boolean {
    return this._progress().bookmarkedLessons.includes(lessonId);
  }

  quizResult(lessonId: string): QuizResultRecord | undefined {
    return this._progress().quizResults[lessonId];
  }

  setCompleted(lessonId: string, completed: boolean): void {
    this._progress.update((p) => {
      const set = new Set(p.completedLessons);
      completed ? set.add(lessonId) : set.delete(lessonId);
      return { ...p, completedLessons: [...set] };
    });
  }

  toggleCompleted(lessonId: string): void {
    this.setCompleted(lessonId, !this.isCompleted(lessonId));
  }

  toggleBookmark(lessonId: string): void {
    this._progress.update((p) => {
      const set = new Set(p.bookmarkedLessons);
      set.has(lessonId) ? set.delete(lessonId) : set.add(lessonId);
      return { ...p, bookmarkedLessons: [...set] };
    });
  }

  setLastOpened(lessonId: string): void {
    this._progress.update((p) => ({ ...p, lastOpenedLesson: lessonId }));
  }

  recordQuizResult(lessonId: string, score: number, passed: boolean): void {
    this._progress.update((p) => ({
      ...p,
      quizResults: {
        ...p.quizResults,
        [lessonId]: { score, passed, completedAt: new Date().toISOString() },
      },
    }));
  }

  reset(): void {
    this._progress.set({ ...EMPTY_PROGRESS, quizResults: {} });
  }

  private read(): UserProgress {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) return structuredClone(EMPTY_PROGRESS);
      return { ...structuredClone(EMPTY_PROGRESS), ...JSON.parse(raw) };
    } catch {
      return structuredClone(EMPTY_PROGRESS);
    }
  }
}
