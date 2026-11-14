import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BankQuestion } from '../../../core/models/quiz.model';
import { CourseService } from '../../../core/services/course.service';

interface MissedRow {
  question: BankQuestion;
  lessonSlug?: string;
  lessonTitle?: string;
}

/** End-of-session summary: score, then every question that was missed with a link to learn more. */
@Component({
  selector: 'app-quiz-result',
  imports: [RouterLink],
  template: `
    <div
      class="animate-pop rounded-2xl border p-8 text-center"
      [class]="
        pct() >= 70
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
          : 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
      "
      role="status"
    >
      <p
        class="text-5xl font-extrabold tabular-nums"
        [class]="
          pct() >= 70
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-amber-600 dark:text-amber-400'
        "
      >
        {{ correct() }}/{{ total() }}
      </p>
      <p class="mt-2 text-lg font-bold text-ink-900 dark:text-white">{{ headline() }}</p>
      <p class="prose-muted mt-1 text-sm">{{ pct() }}% correct this round</p>

      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" (click)="again.emit()" class="btn-gradient">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M4 12a8 8 0 1 1 2.3 5.7M4 20v-5h5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Play again
        </button>
        @if (missedRows().length) {
          <button type="button" (click)="practiceMissed.emit()" class="btn-secondary">
            Practice the {{ missedRows().length }} missed
          </button>
        }
        <a routerLink="/quiz" class="btn-ghost">Back to quiz</a>
      </div>
    </div>

    @if (missedRows().length) {
      <section class="mt-8" aria-labelledby="missed-heading">
        <h2 id="missed-heading" class="heading text-xl">Worth another look</h2>
        <ul class="mt-4 space-y-3">
          @for (row of missedRows(); track row.question.id) {
            <li class="card flex flex-wrap items-center justify-between gap-3 p-4">
              <span class="min-w-0 flex-1 font-semibold text-ink-800 dark:text-ink-100">
                {{ row.question.prompt }}
              </span>
              @if (row.lessonSlug) {
                <a
                  [routerLink]="['/lesson', row.lessonSlug]"
                  class="focusable shrink-0 rounded text-sm font-bold text-brand-600 hover:text-magenta-600 dark:text-brand-300 dark:hover:text-magenta-400"
                >
                  Learn more: {{ row.lessonTitle }}
                </a>
              }
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class QuizResult {
  readonly correct = input.required<number>();
  readonly total = input.required<number>();
  readonly missed = input.required<BankQuestion[]>();

  readonly again = output<void>();
  readonly practiceMissed = output<void>();

  private readonly course = inject(CourseService);

  protected readonly pct = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.correct() / this.total()) * 100),
  );

  protected readonly headline = computed(() => {
    const pct = this.pct();
    if (pct === 100) return 'Perfect round!';
    if (pct >= 70) return 'Nice work';
    if (pct >= 40) return 'Getting there';
    return 'Keep practicing';
  });

  protected readonly missedRows = computed<MissedRow[]>(() =>
    this.missed().map((question) => {
      const lesson = question.lesson ? this.course.getBySlug(question.lesson) : undefined;
      return { question, lessonSlug: lesson?.slug, lessonTitle: lesson?.title };
    }),
  );
}
