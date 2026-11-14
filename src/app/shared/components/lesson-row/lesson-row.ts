import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KIND_CHIPS, KIND_LABELS, LessonMeta } from '../../../core/models/lesson.model';
import { ProgressService } from '../../../core/services/progress.service';

/** A compact one-line lesson entry for the A–Z index. */
@Component({
  selector: 'app-lesson-row',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/lesson', lesson().slug]"
      class="card-interactive group flex items-center gap-3 p-4"
    >
      <span
        class="grid h-6 w-6 shrink-0 place-items-center rounded-full"
        [class]="
          learned()
            ? 'bg-emerald-500 text-white'
            : 'border-2 border-ink-200 dark:border-ink-700'
        "
      >
        @if (learned()) {
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
            <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="sr-only">Learned</span>
        }
      </span>
      <span class="min-w-0 flex-1">
        <span
          class="block truncate font-bold text-ink-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300"
        >
          {{ lesson().title }}
        </span>
        <span class="prose-muted block truncate text-sm">{{ lesson().summary }}</span>
      </span>
      <span class="flex shrink-0 flex-col items-end gap-1">
        <span [class]="kindClass()">{{ kindLabel() }}</span>
        <span class="prose-muted text-xs font-medium">{{ lesson().minutes }} min</span>
      </span>
    </a>
  `,
})
export class LessonRow {
  readonly lesson = input.required<LessonMeta>();

  private readonly progress = inject(ProgressService);

  protected readonly learned = computed(() => this.progress.isLearned(this.lesson().slug));
  protected readonly kindLabel = computed(() => KIND_LABELS[this.lesson().kind]);
  protected readonly kindClass = computed(() => KIND_CHIPS[this.lesson().kind]);
}
