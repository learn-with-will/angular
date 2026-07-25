import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { LessonCard } from '../../shared/components/lesson-card/lesson-card';
import {
  LEVELS,
  LEVEL_ACCENTS,
  LEVEL_BLURBS,
  LEVEL_LABELS,
} from '../../core/models/lesson.model';

const ICON_BOOK =
  'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5V5.5ZM4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5Z';
const ICON_CHECK = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-9.2 2.4 2.4 4.6-4.6';
const ICON_CHART = 'M4 20V10M10 20V4M16 20v-7M22 20H2';
const ICON_TROPHY =
  'M8 4h8v5a4 4 0 1 1-8 0V4ZM8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3M10 17h4M9 21h6M12 13v4';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LessonCard],
  templateUrl: './home.html',
})
export class Home {
  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);

  protected readonly levels = LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;

  protected readonly totalLessons = computed(() => this.course.lessons().length);

  protected readonly completionPct = computed(() => {
    const total = this.totalLessons();
    return total === 0 ? 0 : Math.round((this.progress.completedCount() / total) * 100);
  });

  protected readonly continueLesson = computed(() => {
    const last = this.progress.lastOpenedLesson();
    if (last) {
      const meta = this.course.getById(last);
      if (meta) return meta;
    }
    // Fall back to the first not-yet-completed lesson.
    return this.course.lessons().find((l) => !this.progress.isCompleted(l.id));
  });

  protected readonly featured = computed(() => this.course.lessons().slice(0, 3));

  protected readonly stats = computed(() => [
    { label: 'Lessons', value: `${this.totalLessons()}`, icon: ICON_BOOK },
    { label: 'Completed', value: `${this.progress.completedCount()}`, icon: ICON_CHECK },
    { label: 'Progress', value: `${this.completionPct()}%`, icon: ICON_CHART },
    { label: 'Avg quiz score', value: `${this.progress.averageScore()}%`, icon: ICON_TROPHY },
  ]);

  protected readonly levelBlurbs = LEVEL_BLURBS;
  protected readonly levelAccents = LEVEL_ACCENTS;

  levelCount(level: (typeof LEVELS)[number]): number {
    return this.course.lessonsByLevel(level).length;
  }
}
