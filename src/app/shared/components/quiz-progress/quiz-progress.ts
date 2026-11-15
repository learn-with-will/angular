import { Component, computed, input } from '@angular/core';

/**
 * Quiz progress as one segment per question: green or red once answered, ink
 * for the question on screen (not brand red, which would read as "wrong"). Long rounds fall back to a single bar.
 */
@Component({
  selector: 'app-quiz-progress',
  template: `
    <div class="flex items-center gap-4">
      <div
        class="flex flex-1 gap-1.5"
        role="progressbar"
        [attr.aria-valuenow]="current()"
        aria-valuemin="1"
        [attr.aria-valuemax]="total()"
        [attr.aria-valuetext]="'Question ' + current() + ' of ' + total()"
        aria-label="Quiz progress"
      >
        @if (total() <= 20) {
          @for (seg of segments(); track $index) {
            <span class="h-2 flex-1 rounded-full transition-colors duration-300" [class]="seg"></span>
          }
        } @else {
          <span class="h-2 flex-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
            <span class="block h-full rounded-full bg-ink-900 transition-all duration-300 dark:bg-white" [style.width.%]="pct()"></span>
          </span>
        }
      </div>
      <span class="shrink-0 font-mono text-sm font-semibold text-ink-700 tabular-nums dark:text-ink-300">
        {{ current() }} / {{ total() }}
      </span>
    </div>
  `,
})
export class QuizProgress {
  /** 1-based number of the question on screen. */
  readonly current = input.required<number>();
  readonly total = input.required<number>();
  /** Whether each question answered so far was right. */
  readonly results = input<boolean[]>([]);

  protected readonly pct = computed(() =>
    this.total() === 0 ? 0 : Math.round(((this.current() - 1) / this.total()) * 100),
  );

  protected readonly segments = computed(() =>
    Array.from({ length: this.total() }, (_, i) => {
      const r = this.results()[i];
      if (r === true) return 'bg-emerald-600 dark:bg-emerald-500';
      if (r === false) return 'bg-rose-600 dark:bg-rose-500';
      if (i === this.current() - 1) return 'bg-ink-900 dark:bg-white';
      return 'bg-ink-200 dark:bg-ink-800';
    }),
  );
}
