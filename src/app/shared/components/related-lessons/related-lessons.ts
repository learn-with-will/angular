import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KIND_CHIPS, KIND_LABELS } from '../../../core/models/lesson.model';
import { CourseService } from '../../../core/services/course.service';

/** The 2–4 bites a lesson points to, plus a way to quiz its topic. */
@Component({
  selector: 'app-related-lessons',
  imports: [RouterLink],
  template: `
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" class="heading text-2xl">Related bites</h2>
      <ul class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))] gap-3">
        @for (lesson of lessons(); track lesson.slug) {
          <li>
            <a [routerLink]="['/lesson', lesson.slug]" class="card-interactive group flex h-full flex-col p-4.5">
              <span [class]="kindChips[lesson.kind]" class="self-start">{{ kindLabels[lesson.kind] }}</span>
              <span class="mt-3 block font-bold text-ink-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                {{ lesson.title }}
              </span>
              <span class="prose-muted mt-1 line-clamp-2 text-sm leading-normal">{{ lesson.summary }}</span>
            </a>
          </li>
        }
        <li>
          <a
            routerLink="/quiz/play"
            [queryParams]="{ mode: 'topic', topics: topic(), count: 5 }"
            class="panel-ink flex h-full flex-col rounded-[1.125rem]! p-4.5 transition duration-200 hover:-translate-y-[3px] hover:shadow-lift"
          >
            <span class="self-start rounded-lg bg-ink-800 px-2 py-0.5 text-xs font-bold text-brand-300 dark:bg-ink-950">Quiz</span>
            <span class="mt-3 block font-bold">Quiz yourself on {{ topicTitle() }}</span>
            <span class="mt-1 text-sm text-ink-300">Five questions, about a minute.</span>
          </a>
        </li>
      </ul>
    </section>
  `,
})
export class RelatedLessons {
  readonly slug = input.required<string>();
  readonly topic = input.required<string>();
  readonly topicTitle = input.required<string>();

  private readonly course = inject(CourseService);
  protected readonly lessons = computed(() => this.course.related(this.slug()));
  protected readonly kindLabels = KIND_LABELS;
  protected readonly kindChips = KIND_CHIPS;
}
