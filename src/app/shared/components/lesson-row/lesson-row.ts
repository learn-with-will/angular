import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KIND_CHIPS, KIND_LABELS, LessonMeta } from '../../../core/models/lesson.model';
import { ProgressService } from '../../../core/services/progress.service';

/**
 * One line of the A–Z index, meant to sit in a bordered, divided list. The title
 * link is stretched over the row; the save button is a sibling control above it.
 */
@Component({
  selector: 'app-lesson-row',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <div
      class="group relative flex items-center gap-4 px-4 py-4 transition-colors hover:bg-ink-50 has-[a:focus-visible]:bg-ink-50 sm:px-5 dark:hover:bg-ink-800/50 dark:has-[a:focus-visible]:bg-ink-800/50"
    >
      @if (learned()) {
        <span class="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
            <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="sr-only">Learned:</span>
        </span>
      } @else {
        <span class="h-6.5 w-6.5 shrink-0 rounded-full border-2 border-ink-300 dark:border-ink-700" aria-hidden="true"></span>
      }

      <span class="min-w-0 flex-1">
        <a
          [routerLink]="['/lesson', lesson().slug]"
          class="block truncate font-semibold text-ink-900 outline-none transition-colors before:absolute before:inset-0 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300"
        >
          {{ lesson().title }}
        </a>
        <span class="prose-muted mt-0.5 block truncate text-sm">{{ lesson().summary }}</span>
      </span>

      <span [class]="kindClass()" class="hidden! sm:inline-flex!">{{ kindLabel() }}</span>
      <span class="prose-muted hidden w-13 shrink-0 text-right text-[0.8125rem] font-semibold sm:block">
        {{ lesson().minutes }} min
      </span>

      <button
        type="button"
        (click)="toggleBookmark()"
        class="relative z-10 -mr-2 grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl transition hover:bg-ink-100 active:scale-90 dark:hover:bg-ink-800"
        [class]="bookmarked() ? 'text-magenta-500' : 'text-ink-400 hover:text-magenta-500'"
        [attr.aria-label]="bookmarked() ? 'Remove ' + lesson().title + ' from saved' : 'Save ' + lesson().title"
        [attr.aria-pressed]="bookmarked()"
      >
        <svg
          class="h-[1.125rem] w-[1.125rem]"
          [attr.fill]="bookmarked() ? 'currentColor' : 'none'"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M6 4h12v16l-6-4-6 4V4Z" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  `,
})
export class LessonRow {
  readonly lesson = input.required<LessonMeta>();

  private readonly progress = inject(ProgressService);

  protected readonly learned = computed(() => this.progress.isLearned(this.lesson().slug));
  protected readonly bookmarked = computed(() => this.progress.isBookmarked(this.lesson().slug));
  protected readonly kindLabel = computed(() => KIND_LABELS[this.lesson().kind]);
  protected readonly kindClass = computed(() => KIND_CHIPS[this.lesson().kind]);

  toggleBookmark(): void {
    this.progress.toggleBookmark(this.lesson().slug);
  }
}
