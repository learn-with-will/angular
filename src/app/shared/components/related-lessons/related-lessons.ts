import { Component, computed, inject, input } from '@angular/core';
import { CourseService } from '../../../core/services/course.service';
import { LessonCard } from '../lesson-card/lesson-card';

/** The 2–4 bites a lesson points to, shown in place of Previous/Next. */
@Component({
  selector: 'app-related-lessons',
  imports: [LessonCard],
  template: `
    @if (lessons().length) {
      <section aria-labelledby="related-heading">
        <h2 id="related-heading" class="heading text-xl">Related bites</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          @for (lesson of lessons(); track lesson.slug) {
            <app-lesson-card [lesson]="lesson" />
          }
        </div>
      </section>
    }
  `,
})
export class RelatedLessons {
  readonly slug = input.required<string>();

  private readonly course = inject(CourseService);
  protected readonly lessons = computed(() => this.course.related(this.slug()));
}
