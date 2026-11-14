import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Lesson, LessonMeta } from '../models/lesson.model';

/** Fetches lesson markdown files and strips their YAML front-matter. Cached by slug. */
@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Lesson>();

  async loadLesson(meta: LessonMeta): Promise<Lesson> {
    const cached = this.cache.get(meta.slug);
    if (cached) return cached;

    const raw = await firstValueFrom(
      this.http.get(`content/${meta.file}`, { responseType: 'text' }),
    );
    const lesson: Lesson = { meta, content: this.stripFrontMatter(raw) };
    this.cache.set(meta.slug, lesson);
    return lesson;
  }

  /** Removes a leading `--- ... ---` YAML block if present. */
  private stripFrontMatter(raw: string): string {
    const match = /^﻿?---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/.exec(raw);
    return match ? raw.slice(match[0].length).trimStart() : raw;
  }
}
