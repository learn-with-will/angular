import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { QuizService } from '../../core/services/quiz.service';

/** `/quiz`: pick a way to practise — quick mix, chosen topics, or questions you missed. */
@Component({
  selector: 'app-quiz-hub',
  imports: [RouterLink],
  templateUrl: './quiz-hub.html',
})
export class QuizHub {
  private readonly route = inject(ActivatedRoute);
  protected readonly course = inject(CourseService);
  protected readonly quiz = inject(QuizService);
  protected readonly progress = inject(ProgressService);

  protected readonly sizes = [5, 10];
  protected readonly size = signal(5);

  /** Topics selected in the "By topic" card; seeded from `?topic=a,b`. */
  protected readonly selected = signal<ReadonlySet<string>>(
    new Set((this.route.snapshot.queryParamMap.get('topic') ?? '').split(',').filter(Boolean)),
  );

  /** Topics that have questions to ask. */
  protected readonly topics = computed(() =>
    this.course.topics().filter((t) => (this.quiz.countByTopic().get(t.id) ?? 0) > 0),
  );

  /** The selection, minus anything that is not an available topic. */
  protected readonly chosen = computed(() => {
    const available = new Set(this.topics().map((t) => t.id));
    return [...this.selected()].filter((id) => available.has(id));
  });

  protected readonly poolSize = computed(() =>
    this.chosen().reduce((n, id) => n + (this.quiz.countByTopic().get(id) ?? 0), 0),
  );

  /** Questions whose latest answer was wrong, counting only ones still in the bank. */
  protected readonly missedCount = computed(() => {
    const missed = this.progress.missedIds();
    return this.quiz.bank().filter((q) => missed.has(q.id)).length;
  });

  constructor() {
    void this.course.load().catch(() => undefined);
    void this.quiz.load().catch(() => undefined);
  }

  protected toggleTopic(id: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected selectAll(): void {
    this.selected.set(new Set(this.topics().map((t) => t.id)));
  }

  protected clearAll(): void {
    this.selected.set(new Set());
  }

  protected topicQuery(): { mode: string; topics: string; count: number } {
    return { mode: 'topic', topics: this.chosen().join(','), count: this.size() };
  }
}
