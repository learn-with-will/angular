import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LessonMeta, LEVEL_BADGES, LEVEL_LABELS } from '../../../core/models/lesson.model';
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

  protected readonly levelLabel = computed(() => LEVEL_LABELS[this.lesson().level]);
  protected readonly completed = computed(() => this.progress.isCompleted(this.lesson().id));
  protected readonly bookmarked = computed(() => this.progress.isBookmarked(this.lesson().id));
  protected readonly quiz = computed(() => this.progress.quizResult(this.lesson().id));

  protected readonly badgeClass = computed(() => LEVEL_BADGES[this.lesson().level]);

  toggleBookmark(): void {
    this.progress.toggleBookmark(this.lesson().id);
  }
}
