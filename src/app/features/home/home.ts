import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { SearchService } from '../../core/services/search.service';
import { KIND_CHIPS, KIND_LABELS } from '../../core/models/lesson.model';
import { LessonCard } from '../../shared/components/lesson-card/lesson-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LessonCard],
  templateUrl: './home.html',
})
export class Home {
  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);
  private readonly search = inject(SearchService);
  private readonly router = inject(Router);

  protected readonly kindLabels = KIND_LABELS;
  protected readonly kindChips = KIND_CHIPS;

  protected readonly query = signal('');
  protected readonly suggestions = computed(() => this.search.search(this.query()).slice(0, 5));

  protected readonly totalLessons = computed(() => this.course.lessons().length);

  protected readonly learnedPct = computed(() => {
    const total = this.totalLessons();
    return total === 0 ? 0 : Math.round((this.progress.learnedCount() / total) * 100);
  });

  /** The lesson the learner had open last, if it still exists. */
  protected readonly continueLesson = computed(() => {
    const slug = this.progress.lastOpened();
    return slug ? this.course.getBySlug(slug) : undefined;
  });

  /** Bumped by "Shuffle" to draw a fresh set of suggestions. */
  private readonly seed = signal(0);

  protected readonly picks = computed(() => {
    this.seed();
    return this.course.sample(3, {
      learned: new Set(Object.keys(this.progress.learned())),
      exclude: this.progress.lastOpened(),
    });
  });

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const q = this.query().trim();
    void this.router.navigate(['/lessons'], { queryParams: q ? { q } : {} });
  }

  protected shuffle(): void {
    this.seed.update((n) => n + 1);
  }
}
