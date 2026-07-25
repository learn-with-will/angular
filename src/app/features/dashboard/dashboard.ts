import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { LEVELS, LEVEL_ACCENTS, LEVEL_LABELS, LessonMeta } from '../../core/models/lesson.model';

interface QuizHistoryRow {
  lesson?: LessonMeta;
  score: number;
  passed: boolean;
  completedAt: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);

  protected readonly levels = LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly levelAccents = LEVEL_ACCENTS;

  protected readonly totalLessons = computed(() => this.course.lessons().length);
  protected readonly completionPct = computed(() => {
    const total = this.totalLessons();
    return total === 0 ? 0 : Math.round((this.progress.completedCount() / total) * 100);
  });

  protected readonly completedLessons = computed(() =>
    this.course.lessons().filter((l) => this.progress.isCompleted(l.id)),
  );

  protected readonly quizHistory = computed<QuizHistoryRow[]>(() =>
    Object.entries(this.progress.quizResults())
      .map(([lessonId, r]) => ({
        lesson: this.course.getById(lessonId),
        score: r.score,
        passed: r.passed,
        completedAt: r.completedAt,
      }))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
  );

  levelProgress(level: (typeof LEVELS)[number]): { done: number; total: number; pct: number } {
    const lessons = this.course.lessonsByLevel(level);
    const done = lessons.filter((l) => this.progress.isCompleted(l.id)).length;
    const total = lessons.length;
    return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }

  resetProgress(): void {
    if (confirm('Reset all progress, bookmarks and quiz history? This cannot be undone.')) {
      this.progress.reset();
    }
  }
}
