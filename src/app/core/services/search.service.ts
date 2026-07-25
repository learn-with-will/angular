import { Injectable, inject } from '@angular/core';
import { CourseService } from './course.service';
import { LessonMeta } from '../models/lesson.model';

export interface SearchResult {
  lesson: LessonMeta;
  score: number;
}

/** Lightweight client-side search over lesson metadata (title, tags, summary). */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly course = inject(CourseService);

  search(query: string): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/);

    return this.course
      .lessons()
      .map((lesson) => ({ lesson, score: this.scoreLesson(lesson, terms) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private scoreLesson(lesson: LessonMeta, terms: string[]): number {
    const title = lesson.title.toLowerCase();
    const tags = (lesson.tags ?? []).join(' ').toLowerCase();
    const summary = (lesson.summary ?? '').toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 5;
      if (tags.includes(term)) score += 3;
      if (summary.includes(term)) score += 1;
    }
    return score;
  }
}
