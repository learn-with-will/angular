import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { QuizService } from '../../core/services/quiz.service';
import { AnswerValue, BankQuestion, QuestionResult, QuizMode } from '../../core/models/quiz.model';
import { QuizQuestion } from '../../shared/components/quiz-question/quiz-question';
import { QuizProgress } from '../../shared/components/quiz-progress/quiz-progress';
import { QuizResult } from '../../shared/components/quiz-result/quiz-result';

type Phase = 'loading' | 'empty' | 'playing' | 'done';

const MODES: QuizMode[] = ['quick', 'topic', 'missed'];
const MAX_QUESTIONS = 20;

/**
 * `/quiz/play?mode=quick|topic|missed&topics=a,b&count=5`. Asks one question at
 * a time; Check shows right/wrong, the explanation and a link to the lesson.
 */
@Component({
  selector: 'app-quiz-play',
  imports: [RouterLink, QuizQuestion, QuizProgress, QuizResult],
  templateUrl: './quiz-play.html',
})
export class QuizPlay {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly course = inject(CourseService);
  private readonly quiz = inject(QuizService);
  private readonly progress = inject(ProgressService);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly phase = signal<Phase>('loading');
  protected readonly questions = signal<BankQuestion[]>([]);
  protected readonly index = signal(0);
  protected readonly answer = signal<AnswerValue | undefined>(undefined);
  protected readonly result = signal<QuestionResult | undefined>(undefined);

  private readonly outcomes = signal<{ question: BankQuestion; correct: boolean }[]>([]);
  private readonly session = signal<{ mode: QuizMode; topics: string[] }>({ mode: 'quick', topics: [] });

  protected readonly current = computed<BankQuestion | undefined>(() => this.questions()[this.index()]);
  protected readonly isLast = computed(() => this.index() >= this.questions().length - 1);
  protected readonly correctCount = computed(() => this.outcomes().filter((o) => o.correct).length);
  protected readonly missed = computed(() => this.outcomes().filter((o) => !o.correct).map((o) => o.question));

  protected readonly hasAnswer = computed(() => {
    const a = this.answer();
    if (a == null) return false;
    if (typeof a === 'string') return a.trim().length > 0;
    if (Array.isArray(a)) return a.length > 0;
    return Object.values(a).some(Boolean);
  });

  protected readonly lesson = computed(() => {
    const slug = this.current()?.lesson;
    return slug ? this.course.getBySlug(slug) : undefined;
  });

  protected readonly title = computed(() => {
    const { mode, topics } = this.session();
    if (mode === 'missed') return 'Missed questions';
    if (mode === 'topic' && topics.length === 1) return `${this.course.getTopic(topics[0])?.title ?? 'Topic'} quiz`;
    return mode === 'topic' ? 'Topic quiz' : 'Quick quiz';
  });

  constructor() {
    // Start (or restart) whenever the query string changes.
    effect(() => {
      this.params();
      untracked(() => void this.start());
    });
  }

  private async start(): Promise<void> {
    this.phase.set('loading');
    try {
      await Promise.all([this.course.load(), this.quiz.load()]);
    } catch {
      this.phase.set('empty');
      return;
    }

    const p = this.params();
    const rawMode = p.get('mode') as QuizMode | null;
    const mode: QuizMode = rawMode && MODES.includes(rawMode) ? rawMode : 'quick';
    const topics = (p.get('topics') ?? '').split(',').filter(Boolean);
    const count = Math.min(MAX_QUESTIONS, Math.max(1, Number(p.get('count')) || 5));

    this.session.set({ mode, topics });
    const picked = this.quiz.pick({ mode, count, topics, missed: this.progress.missedIds() });

    this.questions.set(picked);
    this.outcomes.set([]);
    this.index.set(0);
    if (picked.length === 0) {
      this.phase.set('empty');
      return;
    }
    this.begin();
    this.phase.set('playing');
  }

  /** Resets the per-question state for the question now on screen. */
  private begin(): void {
    const q = this.current();
    this.result.set(undefined);
    // Ordering needs a starting answer so the order on screen is what gets graded.
    this.answer.set(q?.type === 'ordering' ? this.quiz.shuffleOrder(q.items.map((i) => i.id), q.answer) : undefined);
  }

  protected check(): void {
    const q = this.current();
    if (!q || this.result()) return;
    const correct = this.quiz.check(q, this.answer());
    this.result.set({ questionId: q.id, correct, userAnswer: this.answer() ?? '' });
    this.progress.recordAnswer(q.id, correct);
    this.outcomes.update((o) => [...o, { question: q, correct }]);
  }

  protected next(): void {
    if (!this.result()) return;
    if (this.isLast()) {
      this.finish();
      return;
    }
    this.index.update((i) => i + 1);
    this.begin();
  }

  private finish(): void {
    this.progress.recordSession({
      at: new Date().toISOString(),
      mode: this.session().mode,
      topics: this.session().topics,
      total: this.questions().length,
      correct: this.correctCount(),
      missed: this.missed().map((q) => q.id),
    });
    this.phase.set('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected playAgain(): void {
    void this.start();
  }

  protected practiceMissed(): void {
    // Same query string means no navigation event, so restart directly.
    if (this.session().mode === 'missed') {
      void this.start();
      return;
    }
    void this.router.navigate(['/quiz/play'], { queryParams: { mode: 'missed', count: 10 } });
  }
}
