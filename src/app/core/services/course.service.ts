import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LessonLevel, LessonMeta } from '../models/lesson.model';

/**
 * Loads and caches the course manifest. The manifest is the single source of
 * truth for which lessons exist; adding a lesson is just a manifest entry plus
 * a markdown file — no code change required.
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);

  private readonly _lessons = signal<LessonMeta[]>([]);
  private readonly _loaded = signal(false);
  private loadPromise?: Promise<void>;

  readonly lessons = computed(() =>
    [...this._lessons()].sort((a, b) => a.order - b.order),
  );
  readonly loaded = this._loaded.asReadonly();

  /** Loads the manifest once; subsequent calls reuse the in-flight/finished load. */
  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = (async () => {
      const data = await firstValueFrom(
        this.http.get<LessonMeta[]>('content/course-manifest.json'),
      );
      this._lessons.set(data ?? []);
      this._loaded.set(true);
    })();
    return this.loadPromise;
  }

  lessonsByLevel(level: LessonLevel): LessonMeta[] {
    return this.lessons().filter((l) => l.level === level);
  }

  getBySlug(slug: string): LessonMeta | undefined {
    return this.lessons().find((l) => l.slug === slug);
  }

  getById(id: string): LessonMeta | undefined {
    return this.lessons().find((l) => l.id === id);
  }

  /** Previous/next lesson in global course order, for in-lesson navigation. */
  neighbours(slug: string): { prev?: LessonMeta; next?: LessonMeta } {
    const all = this.lessons();
    const idx = all.findIndex((l) => l.slug === slug);
    if (idx === -1) return {};
    return {
      prev: idx > 0 ? all[idx - 1] : undefined,
      next: idx < all.length - 1 ? all[idx + 1] : undefined,
    };
  }
}
