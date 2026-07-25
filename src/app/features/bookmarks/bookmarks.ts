import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { LessonCard } from '../../shared/components/lesson-card/lesson-card';

@Component({
  selector: 'app-bookmarks',
  imports: [RouterLink, LessonCard],
  templateUrl: './bookmarks.html',
})
export class Bookmarks {
  private readonly course = inject(CourseService);
  private readonly progress = inject(ProgressService);

  protected readonly bookmarked = computed(() =>
    this.course.lessons().filter((l) => this.progress.isBookmarked(l.id)),
  );
}
