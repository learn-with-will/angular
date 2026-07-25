import { Component, input, output } from '@angular/core';
import { QuizEvaluation } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-quiz-result',
  template: `
    <div
      class="animate-pop rounded-2xl border p-8 text-center"
      [class]="
        evaluation().passed
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
          : 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
      "
      role="status"
    >
      <span
        class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-white"
        [class]="evaluation().passed ? 'bg-emerald-500' : 'bg-amber-500'"
      >
        @if (evaluation().passed) {
          <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        } @else {
          <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 8v5M12 16.5v.5" stroke-linecap="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        }
      </span>

      <p
        class="text-5xl font-extrabold tabular-nums"
        [class]="
          evaluation().passed
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-amber-600 dark:text-amber-400'
        "
      >
        {{ evaluation().score }}%
      </p>

      <p class="mt-2 text-lg font-bold text-ink-900 dark:text-white">
        {{ evaluation().passed ? 'Nice work — you passed!' : 'Almost there' }}
      </p>
      <p class="prose-muted mt-1 text-sm">
        {{ evaluation().correctCount }} of {{ evaluation().total }} correct · need
        {{ passingScore() }}% to pass
      </p>

      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" (click)="retry.emit()" class="btn-secondary">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M4 12a8 8 0 1 1 2.3 5.7M4 20v-5h5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Try again
        </button>
        <button type="button" (click)="review.emit()" class="btn-primary">Review answers</button>
      </div>
    </div>
  `,
})
export class QuizResult {
  readonly evaluation = input.required<QuizEvaluation>();
  readonly passingScore = input.required<number>();

  readonly retry = output<void>();
  readonly review = output<void>();
}
