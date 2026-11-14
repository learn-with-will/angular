import { Component, computed, input } from '@angular/core';

/** "Question 3 of 10" with a bar that fills as questions are completed. */
@Component({
  selector: 'app-quiz-progress',
  template: `
    <div class="flex items-center gap-3">
      <div
        class="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800"
        role="progressbar"
        [attr.aria-valuenow]="pct()"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Quiz progress"
      >
        <div
          class="h-full rounded-full transition-all duration-300"
          style="background-image: var(--gradient-angular)"
          [style.width.%]="pct()"
        ></div>
      </div>
      <span class="prose-muted shrink-0 text-sm font-bold tabular-nums">
        Question {{ current() }} of {{ total() }}
      </span>
    </div>
  `,
})
export class QuizProgress {
  /** 1-based number of the question on screen. */
  readonly current = input.required<number>();
  readonly total = input.required<number>();

  protected readonly pct = computed(() =>
    this.total() === 0 ? 0 : Math.round(((this.current() - 1) / this.total()) * 100),
  );
}
