import { Component, inject } from '@angular/core';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { LessonCard } from '../../shared/components/lesson-card/lesson-card';
import {
  LEVELS,
  LEVEL_ACCENTS,
  LEVEL_BLURBS,
  LEVEL_LABELS,
  LessonLevel,
} from '../../core/models/lesson.model';

@Component({
  selector: 'app-roadmap',
  imports: [LessonCard],
  templateUrl: './roadmap.html',
})
export class Roadmap {
  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);

  protected readonly levels = LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly levelBlurbs = LEVEL_BLURBS;
  protected readonly levelAccents = LEVEL_ACCENTS;

  lessonsFor(level: LessonLevel) {
    return this.course.lessonsByLevel(level);
  }

  doneCount(level: LessonLevel): number {
    return this.lessonsFor(level).filter((l) => this.progress.isCompleted(l.id)).length;
  }
}
