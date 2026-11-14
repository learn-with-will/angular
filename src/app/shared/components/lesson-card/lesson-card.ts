import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KIND_CHIPS, KIND_LABELS, LessonMeta } from '../../../core/models/lesson.model';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';

@Component({
  selector: 'app-lesson-card',
  imports: [RouterLink],
  templateUrl: './lesson-card.html',
  host: { class: 'block h-full' },
})
export class LessonCard {
  readonly lesson = input.required<LessonMeta>();

  private readonly progress = inject(ProgressService);
  private readonly course = inject(CourseService);

  protected readonly kindLabel = computed(() => KIND_LABELS[this.lesson().kind]);
  protected readonly kindClass = computed(() => KIND_CHIPS[this.lesson().kind]);
  protected readonly topicTitle = computed(() => this.course.getTopic(this.lesson().topic)?.title ?? '');
  protected readonly learned = computed(() => this.progress.isLearned(this.lesson().slug));
  protected readonly bookmarked = computed(() => this.progress.isBookmarked(this.lesson().slug));

  toggleBookmark(): void {
    this.progress.toggleBookmark(this.lesson().slug);
  }
}
