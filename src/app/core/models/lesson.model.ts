/** What kind of thing a bite teaches. Exactly one per lesson. */
export type LessonKind = 'concept' | 'api' | 'technique' | 'pattern' | 'pitfall' | 'tool';

export const KINDS: LessonKind[] = ['concept', 'api', 'technique', 'pattern', 'pitfall', 'tool'];

export const KIND_LABELS: Record<LessonKind, string> = {
  concept: 'Concept',
  api: 'API',
  technique: 'Technique',
  pattern: 'Pattern',
  pitfall: 'Pitfall',
  tool: 'Tool',
};

export const KIND_HINTS: Record<LessonKind, string> = {
  concept: 'How and why something works',
  api: 'A specific function, decorator or syntax',
  technique: 'How to get a particular job done',
  pattern: 'A reusable way to structure code',
  pitfall: 'A common mistake and its fix',
  tool: 'CLI and tooling',
};

/** Chip utility class per kind; defined in styles.css. */
export const KIND_CHIPS: Record<LessonKind, string> = {
  concept: 'kind-concept',
  api: 'kind-api',
  technique: 'kind-technique',
  pattern: 'kind-pattern',
  pitfall: 'kind-pitfall',
  tool: 'kind-tool',
};

/** One of the ~14 topics a lesson belongs to. `count` is filled in by the manifest script. */
export interface Topic {
  id: string;
  title: string;
  blurb: string;
  order: number;
  count: number;
}

/** A single bite (entry in course-manifest.json). */
export interface LessonMeta {
  slug: string;
  title: string;
  topic: string;
  kind: LessonKind;
  summary: string;
  tags: string[];
  /** 2–4 slugs of related bites, shown at the end of the lesson. */
  related: string[];
  /** First stable Angular version, when it matters. */
  since?: string;
  /** Reading time in minutes, computed from the body by the manifest script. */
  minutes: number;
  /** Path to the markdown file, relative to /content. */
  file: string;
}

/** Maps one of the old long lessons to the bites that replaced it. */
export interface LegacyEntry {
  id: string;
  slug: string;
  title: string;
  lessons: string[];
  /** Topic of the first replacement bite (set by the manifest script). */
  topic?: string;
}

export interface CourseManifest {
  topics: Topic[];
  lessons: LessonMeta[];
  legacy: LegacyEntry[];
}

/** A loaded lesson: metadata plus the markdown body (front-matter stripped). */
export interface Lesson {
  meta: LessonMeta;
  content: string;
}

export interface LetterGroup {
  letter: string;
  lessons: LessonMeta[];
}

/** Title with leading symbols removed, so `@if` sorts under I and `[(ngModel)]` under N. */
export function sortKey(title: string): string {
  return title.replace(/^[^A-Za-z0-9]+/, '').toLowerCase();
}

/** A–Z bucket for a title; digits share the `#` bucket. */
export function letterOf(title: string): string {
  const first = sortKey(title).charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

/**
 * Alphabetical order, ignoring punctuation entirely so "signal()" sorts before
 * "Signal state service". Falls back to slug for stable ties.
 */
export function byTitle(a: LessonMeta, b: LessonMeta): number {
  const key = (l: LessonMeta) => sortKey(l.title).replace(/[^a-z0-9]/g, '');
  return key(a).localeCompare(key(b)) || a.slug.localeCompare(b.slug);
}
