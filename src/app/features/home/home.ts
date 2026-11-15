import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { QuizService } from '../../core/services/quiz.service';
import { SearchService } from '../../core/services/search.service';
import { KIND_CHIPS, KIND_LABELS, Topic } from '../../core/models/lesson.model';
import { LessonCard } from '../../shared/components/lesson-card/lesson-card';

interface TopicTile {
  topic: Topic;
  /** Two-digit position, shown as the tile's label. */
  number: string;
  learned: number;
  pct: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, LessonCard],
  templateUrl: './home.html',
})
export class Home {
  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);
  private readonly quiz = inject(QuizService);
  private readonly search = inject(SearchService);
  private readonly router = inject(Router);

  protected readonly kindLabels = KIND_LABELS;
  protected readonly kindChips = KIND_CHIPS;

  constructor() {
    void this.quiz.load().catch(() => undefined);
  }

  protected readonly query = signal('');
  protected readonly suggestions = computed(() => this.search.search(this.query()).slice(0, 5));

  protected readonly totalLessons = computed(() => this.course.lessons().length);

  protected readonly learnedPct = computed(() => {
    const total = this.totalLessons();
    return total === 0 ? 0 : Math.round((this.progress.learnedCount() / total) * 100);
  });

  /** "3–5 min": the shortest and longest reading time in the course. */
  protected readonly minuteRange = computed(() => {
    const mins = this.course.lessons().map((l) => l.minutes);
    if (!mins.length) return '';
    const lo = Math.min(...mins);
    const hi = Math.max(...mins);
    return lo === hi ? `${lo} min` : `${lo}–${hi} min`;
  });

  /** The lesson the learner had open last, if it still exists. */
  protected readonly continueLesson = computed(() => {
    const slug = this.progress.lastOpened();
    return slug ? this.course.getBySlug(slug) : undefined;
  });

  /** For a first visit: the opening bite of the first topic. */
  protected readonly firstLesson = computed(() => {
    const first = this.course.topics()[0];
    return first ? this.course.byTopic(first.id)[0] : undefined;
  });

  /** The bite shown in the hero card. */
  protected readonly featured = computed(
    () => this.course.getBySlug('computed') ?? this.course.lessons()[0],
  );

  protected readonly topicTiles = computed<TopicTile[]>(() => {
    const learned = this.progress.learned();
    return this.course.topics().map((topic, i) => {
      const done = this.course.byTopic(topic.id).filter((l) => l.slug in learned).length;
      return {
        topic,
        number: String(i + 1).padStart(2, '0'),
        learned: done,
        pct: topic.count === 0 ? 0 : Math.round((done / topic.count) * 100),
      };
    });
  });

  protected readonly lastRound = computed(() => this.progress.sessions()[0]);

  protected readonly missedCount = computed(() => {
    const missed = this.progress.missedIds();
    return this.quiz.bank().filter((q) => missed.has(q.id)).length;
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
