import { Component, computed, input } from '@angular/core';

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
        aria-label="Questions answered"
      >
        <div
          class="h-full rounded-full transition-all duration-300"
          style="background-image: var(--gradient-angular)"
          [style.width.%]="pct()"
        ></div>
      </div>
      <span class="prose-muted shrink-0 text-sm font-bold tabular-nums">
        {{ answered() }}/{{ total() }} answered
      </span>
    </div>
  `,
})
export class QuizProgress {
  readonly answered = input.required<number>();
  readonly total = input.required<number>();

  protected readonly pct = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.answered() / this.total()) * 100),
  );
}
