import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Lesson, LessonMeta, TocEntry } from '../models/lesson.model';

/**
 * Fetches lesson markdown files, strips YAML front-matter, and builds a table
 * of contents from the headings. Results are cached by slug.
 */
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
    const content = this.stripFrontMatter(raw);
    const toc = this.buildToc(content);
    const lesson: Lesson = { meta, content, toc };
    this.cache.set(meta.slug, lesson);
    return lesson;
  }

  /** Removes a leading `--- ... ---` YAML block if present. */
  private stripFrontMatter(raw: string): string {
    const match = /^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(raw);
    return match ? raw.slice(match[0].length).trimStart() : raw;
  }

  /** Builds TOC entries from `#`/`##` headings, skipping fenced code blocks. */
  private buildToc(markdown: string): TocEntry[] {
    const entries: TocEntry[] = [];
    const seen = new Map<string, number>();
    let inFence = false;

    for (const line of markdown.split('\n')) {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;

      const m = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      if (!m) continue;

      const level = m[1].length;
      const text = m[2].replace(/[#*`]/g, '').trim();
      const id = this.slugify(text, seen);
      entries.push({ id, text, level });
    }
    return entries;
  }

  /** Mirrors the id generation used by markdown renderers so anchors line up. */
  private slugify(text: string, seen: Map<string, number>): string {
    const base = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }
}
