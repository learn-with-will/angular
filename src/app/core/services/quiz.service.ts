import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AnswerValue, BankQuestion, PickOptions, QuizQuestion } from '../models/quiz.model';
import { shuffled } from '../util/shuffle';

/** Loads the question bank, draws quiz sets from it, and grades answers. */
@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);

  private readonly _bank = signal<BankQuestion[]>([]);
  private readonly _loaded = signal(false);
  private loadPromise?: Promise<void>;

  readonly bank = this._bank.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  /** How many questions each topic has. */
  readonly countByTopic = computed(() => {
    const counts = new Map<string, number>();
    for (const q of this._bank()) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
    return counts;
  });

  /** Loads the bank once; later calls share the finished (or in-flight) load. */
  load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = firstValueFrom(this.http.get<BankQuestion[]>('quiz/questions.json')).then(
        (data) => {
          this._bank.set(data ?? []);
          this._loaded.set(true);
        },
        (error) => {
          this.loadPromise = undefined;
          throw error;
        },
      );
    }
    return this.loadPromise;
  }

  getById(id: string): BankQuestion | undefined {
    return this._bank().find((q) => q.id === id);
  }

  /**
   * Draws up to `count` distinct questions at random.
   *  - `quick`:  the whole bank
   *  - `topic`:  only the given topics (the whole bank if none are given)
   *  - `missed`: only the ids in `missed`
   */
  pick(opts: PickOptions, rng: () => number = Math.random): BankQuestion[] {
    let pool = this._bank();
    if (opts.mode === 'topic' && opts.topics?.length) {
      const topics = new Set(opts.topics);
      pool = pool.filter((q) => topics.has(q.topic));
    } else if (opts.mode === 'missed') {
      const missed = opts.missed ?? new Set<string>();
      pool = pool.filter((q) => missed.has(q.id));
    }
    return shuffled(pool, rng).slice(0, Math.max(0, opts.count));
  }

  /** Whether `answer` is right for `q`. A missing answer is always wrong. */
  check(q: QuizQuestion, answer: AnswerValue | undefined): boolean {
    if (answer == null) return false;
    switch (q.type) {
      case 'single-choice':
        return answer === q.answer;

      case 'multiple-choice': {
        const a = this.asArray(answer);
        return a.length === q.answer.length && q.answer.every((id) => a.includes(id));
      }

      case 'fill-blank': {
        const text = String(answer).trim().toLowerCase();
        return q.answer.some((acc) => acc.trim().toLowerCase() === text);
      }

      case 'ordering': {
        const a = this.asArray(answer);
        return a.length === q.answer.length && q.answer.every((id, i) => a[i] === id);
      }

      case 'match-pair': {
        if (typeof answer !== 'object' || Array.isArray(answer)) return false;
        return q.pairs.every((p) => answer[p.left] === p.right);
      }
    }
  }

  /**
   * A shuffled order for an ordering question, guaranteed to differ from the
   * correct order when there is more than one item, so it is never trivially right.
   */
  shuffleOrder(ids: readonly string[], correct: readonly string[], rng: () => number = Math.random): string[] {
    if (ids.length < 2) return [...ids];
    for (let attempt = 0; attempt < 8; attempt++) {
      const order = shuffled(ids, rng);
      if (order.some((id, i) => id !== correct[i])) return order;
    }
    return [...ids].reverse();
  }

  private asArray(v: AnswerValue): string[] {
    return Array.isArray(v) ? v : [String(v)];
  }
}
