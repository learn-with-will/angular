import { Injectable, inject } from '@angular/core';
import { CourseService } from './course.service';
import { KIND_LABELS, LessonMeta } from '../models/lesson.model';

export interface SearchResult {
  lesson: LessonMeta;
  score: number;
}

/** Lightweight client-side search over lesson metadata: title, tags, summary, topic and kind. */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly course = inject(CourseService);

  /** Matching lessons, best first. An empty query matches nothing. */
  search(query: string): SearchResult[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    return this.course
      .lessons()
      .map((lesson) => ({ lesson, score: this.scoreLesson(lesson, terms) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.lesson.title.localeCompare(b.lesson.title));
  }

  private scoreLesson(lesson: LessonMeta, terms: string[]): number {
    const title = lesson.title.toLowerCase();
    const titleWords = title.split(/[^a-z0-9]+/).filter(Boolean);
    const tags = lesson.tags.join(' ').toLowerCase();
    const summary = lesson.summary.toLowerCase();
    const topic = (this.course.getTopic(lesson.topic)?.title ?? '').toLowerCase();
    const kind = KIND_LABELS[lesson.kind].toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 5;
      // A whole-word hit ("track" in "a track expression") beats a mid-word one ("untracked").
      if (titleWords.some((w) => w.startsWith(term))) score += 4;
      if (tags.includes(term)) score += 3;
      if (topic.includes(term)) score += 2;
      if (kind.includes(term)) score += 2;
      if (summary.includes(term)) score += 1;
    }
    return score;
  }
}
