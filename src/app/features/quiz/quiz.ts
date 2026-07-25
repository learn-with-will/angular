import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { CourseService } from '../../core/services/course.service';
import { QuizService } from '../../core/services/quiz.service';
import { ProgressService } from '../../core/services/progress.service';
import { AnswerValue, Quiz, QuizEvaluation, QuestionResult } from '../../core/models/quiz.model';
import { LessonMeta } from '../../core/models/lesson.model';
import { QuizQuestion } from '../../shared/components/quiz-question/quiz-question';
import { QuizProgress } from '../../shared/components/quiz-progress/quiz-progress';
import { QuizResult } from '../../shared/components/quiz-result/quiz-result';

type Phase = 'taking' | 'results' | 'reviewing';

@Component({
  selector: 'app-quiz-page',
  imports: [RouterLink, QuizQuestion, QuizProgress, QuizResult],
  templateUrl: './quiz.html',
})
export class QuizPage {
  private readonly route = inject(ActivatedRoute);
  private readonly course = inject(CourseService);
  private readonly quizService = inject(QuizService);
  private readonly progress = inject(ProgressService);

  protected readonly slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' },
  );

  protected readonly loading = signal(true);
  protected readonly lessonMeta = signal<LessonMeta | null>(null);
  protected readonly quiz = signal<Quiz | null>(null);
  protected readonly answers = signal<Record<string, AnswerValue>>({});
  protected readonly phase = signal<Phase>('taking');
  protected readonly evaluation = signal<QuizEvaluation | null>(null);

  protected readonly answeredCount = computed(() => {
    const a = this.answers();
    return Object.values(a).filter((v) => this.hasAnswer(v)).length;
  });

  protected readonly resultByQuestion = computed(() => {
    const map = new Map<string, QuestionResult>();
    this.evaluation()?.results.forEach((r) => map.set(r.questionId, r));
    return map;
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      this.course.loaded();
      if (slug) void this.load(slug);
    });
  }

  private async load(slug: string): Promise<void> {
    this.loading.set(true);
    this.resetState();
    await this.course.load();
    const meta = this.course.getBySlug(slug);
    this.lessonMeta.set(meta ?? null);
    if (meta) {
      const quiz = await this.quizService.loadQuizForLesson(meta.id);
      this.quiz.set(quiz);
      this.seedDefaults(quiz);
    }
    this.loading.set(false);
  }

  private resetState(): void {
    this.answers.set({});
    this.phase.set('taking');
    this.evaluation.set(null);
    this.seedDefaults(this.quiz());
  }

  /**
   * Ordering questions need an initial answer so the displayed order is what
   * gets graded. We present a shuffled order (so it isn't trivially correct)
   * and store it as the starting answer.
   */
  private seedDefaults(quiz: Quiz | null): void {
    if (!quiz) return;
    const defaults: Record<string, AnswerValue> = {};
    for (const q of quiz.questions) {
      if (q.type === 'ordering') {
        defaults[q.id] = this.shuffle(q.items.map((i) => i.id), q.answer);
      }
    }
    if (Object.keys(defaults).length) {
      this.answers.update((a) => ({ ...defaults, ...a }));
    }
  }

  /** Fisher–Yates shuffle that avoids returning the exact correct order. */
  private shuffle(ids: string[], avoid: string[]): string[] {
    const arr = [...ids];
    for (let attempt = 0; attempt < 5; attempt++) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      if (arr.length < 2 || arr.some((id, i) => id !== avoid[i])) break;
    }
    return arr;
  }

  setAnswer(questionId: string, value: AnswerValue): void {
    this.answers.update((a) => ({ ...a, [questionId]: value }));
  }

  submit(): void {
    const quiz = this.quiz();
    const meta = this.lessonMeta();
    if (!quiz || !meta) return;
    const evaluation = this.quizService.evaluate(quiz, this.answers());
    this.evaluation.set(evaluation);
    this.progress.recordQuizResult(meta.id, evaluation.score, evaluation.passed);
    this.phase.set('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    this.resetState();
  }

  review(): void {
    this.phase.set('reviewing');
  }

  resultFor(questionId: string): QuestionResult | undefined {
    return this.phase() === 'reviewing' ? this.resultByQuestion().get(questionId) : undefined;
  }

  private hasAnswer(v: AnswerValue): boolean {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return Object.values(v).some((x) => x);
  }
}
