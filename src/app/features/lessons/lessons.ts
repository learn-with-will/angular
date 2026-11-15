import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  KINDS,
  KIND_CHIPS,
  KIND_HINTS,
  KIND_LABELS,
  LessonKind,
  LessonMeta,
  LetterGroup,
  byTitle,
  letterOf,
} from '../../core/models/lesson.model';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { SearchService } from '../../core/services/search.service';
import { LessonRow } from '../../shared/components/lesson-row/lesson-row';
import { LESSON_SEARCH_ID } from '../../shared/components/navbar/navbar';

type SortMode = 'az' | 'unlearned' | 'shortest';

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'az', label: 'A–Z' },
  { id: 'unlearned', label: 'Not learned first' },
  { id: 'shortest', label: 'Shortest first' },
];

const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

/**
 * The A–Z lesson index. Topic, kind, sort and "from" live in the URL so every
 * view is linkable; the search text is local state seeded from `?q=`.
 */
@Component({
  selector: 'app-lessons',
  imports: [LessonRow, RouterLink],
  templateUrl: './lessons.html',
})
export class LessonsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);
  private readonly search = inject(SearchService);

  protected readonly kinds = KINDS;
  protected readonly kindLabels = KIND_LABELS;
  protected readonly kindHints = KIND_HINTS;
  protected readonly kindChips = KIND_CHIPS;
  protected readonly sorts = SORTS;
  protected readonly letters = LETTERS;
  protected readonly searchId = LESSON_SEARCH_ID;

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  protected readonly topic = computed(() => {
    const t = this.params().get('topic');
    return t && this.course.getTopic(t) ? t : null;
  });

  protected readonly kind = computed<LessonKind | null>(() => {
    const k = this.params().get('kind') as LessonKind | null;
    return k && KINDS.includes(k) ? k : null;
  });

  protected readonly sort = computed<SortMode>(() => {
    const s = this.params().get('sort') as SortMode | null;
    return SORTS.some((x) => x.id === s) ? (s as SortMode) : 'az';
  });

  /** The old long lesson the learner was redirected from, if any. */
  protected readonly legacy = computed(() => {
    const from = this.params().get('from');
    return from ? this.course.legacyBySlug(from) : undefined;
  });

  /** "Hide learned" switch, kept in the URL as `?hide=learned`. */
  protected readonly hideLearned = computed(() => this.params().get('hide') === 'learned');

  /** The selected topic with how much of it is learned, for the header card. */
  protected readonly topicSummary = computed(() => {
    const id = this.topic();
    const topic = id ? this.course.getTopic(id) : undefined;
    if (!topic) return null;
    const learned = this.progress.learned();
    const lessons = this.course.byTopic(topic.id);
    const done = lessons.filter((l) => l.slug in learned).length;
    const index = this.course.topics().findIndex((t) => t.id === topic.id);
    return {
      topic,
      number: String(index + 1).padStart(2, '0'),
      learned: done,
      total: lessons.length,
      pct: lessons.length === 0 ? 0 : Math.round((done / lessons.length) * 100),
    };
  });

  protected readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');

  /** Only notifies when `?q=` itself changes, so editing a chip never resets typed text. */
  private readonly qParam = computed(() => this.params().get('q'));

  constructor() {
    // Keep the search box in step when navigation changes `?q=` (e.g. from Home).
    effect(() => {
      const q = this.qParam();
      if (q !== null) this.query.set(q);
    });
  }

  /** Lessons after the topic/kind/legacy filters, before search and sorting. */
  private readonly filtered = computed<LessonMeta[]>(() => {
    const topic = this.topic();
    const kind = this.kind();
    const legacy = this.legacy();
    const only = legacy && legacy.lessons.length ? new Set(legacy.lessons) : null;
    const learned = this.hideLearned() ? this.progress.learned() : null;
    return this.course
      .lessons()
      .filter(
        (l) =>
          (!topic || l.topic === topic) &&
          (!kind || l.kind === kind) &&
          (!only || only.has(l.slug)) &&
          (!learned || !(l.slug in learned)),
      );
  });

  /** True when results are a flat list (searching or a non-A–Z sort) rather than A–Z groups. */
  protected readonly flat = computed(() => this.query().trim() !== '' || this.sort() !== 'az');

  protected readonly results = computed<LessonMeta[]>(() => {
    const base = this.filtered();
    const q = this.query().trim();
    if (q) {
      const allowed = new Set(base.map((l) => l.slug));
      return this.search
        .search(q)
        .map((r) => r.lesson)
        .filter((l) => allowed.has(l.slug));
    }
    const learned = this.progress.learned();
    switch (this.sort()) {
      case 'unlearned':
        return [...base].sort((a, b) => Number(a.slug in learned) - Number(b.slug in learned) || byTitle(a, b));
      case 'shortest':
        return [...base].sort((a, b) => a.minutes - b.minutes || byTitle(a, b));
      default:
        return base;
    }
  });

  /** A–Z groups of the results (only used when not flat). */
  protected readonly groups = computed<LetterGroup[]>(() => {
    const byLetter = new Map<string, LessonMeta[]>();
    for (const lesson of this.results()) {
      const letter = letterOf(lesson.title);
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), lesson]);
    }
    return LETTERS.filter((l) => byLetter.has(l)).map((letter) => ({ letter, lessons: byLetter.get(letter)! }));
  });

  protected readonly presentLetters = computed(() => new Set(this.groups().map((g) => g.letter)));

  protected readonly kindsPresent = computed(() => {
    const present = new Set(this.course.lessons().map((l) => l.kind));
    return KINDS.filter((k) => present.has(k));
  });

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected setTopic(topic: string | null): void {
    this.navigate({ topic: topic && topic !== this.topic() ? topic : null });
  }

  protected setKind(kind: LessonKind | null): void {
    this.navigate({ kind: kind && kind !== this.kind() ? kind : null });
  }

  protected toggleHideLearned(): void {
    this.navigate({ hide: this.hideLearned() ? null : 'learned' });
  }

  protected setSort(sort: SortMode): void {
    this.navigate({ sort: sort === 'az' ? null : sort });
  }

  protected clearFilters(): void {
    this.query.set('');
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected jumpTo(letter: string): void {
    document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private navigate(params: Record<string, string | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge' });
  }
}
