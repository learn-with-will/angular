import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { LEVELS, LEVEL_LABELS, LessonLevel } from '../../../core/models/lesson.model';

/** Course outline shown beside the lesson reader. Highlights the active slug. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  /** Slug of the currently open lesson (for active styling). */
  readonly activeSlug = input<string>();

  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);
  protected readonly levels = LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;

  lessonsFor(level: LessonLevel) {
    return this.course.lessonsByLevel(level);
  }
}
