import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { QuizService } from '../../core/services/quiz.service';
import { LessonMeta, Topic } from '../../core/models/lesson.model';
import { QuizMode } from '../../core/models/quiz.model';

interface TopicRow {
  topic: Topic;
  total: number;
  learned: number;
  learnedPct: number;
  /** Questions answered / answered correctly, summed over the topic's questions. */
  seen: number;
  accuracy: number | null;
}

const MODE_LABELS: Record<QuizMode, string> = {
  quick: 'Quick quiz',
  topic: 'By topic',
  missed: 'Missed',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);
  private readonly quiz = inject(QuizService);

  constructor() {
    void this.course.load().catch(() => undefined);
    void this.quiz.load().catch(() => undefined);
  }

  protected readonly totalLessons = computed(() => this.course.lessons().length);
  protected readonly learnedPct = computed(() => {
    const total = this.totalLessons();
    return total === 0 ? 0 : Math.round((this.progress.learnedCount() / total) * 100);
  });

  protected readonly topicRows = computed<TopicRow[]>(() => {
    const stats = this.progress.questionStats();
    const bank = this.quiz.bank();
    const learned = this.progress.learned();

    return this.course.topics().map((topic) => {
      const lessons = this.course.byTopic(topic.id);
      const done = lessons.filter((l) => l.slug in learned).length;

      let seen = 0;
      let correct = 0;
      for (const q of bank) {
        const s = q.topic === topic.id ? stats[q.id] : undefined;
        if (s) {
          seen += s.seen;
          correct += s.correct;
        }
      }
      return {
        topic,
        total: lessons.length,
        learned: done,
        learnedPct: lessons.length === 0 ? 0 : Math.round((done / lessons.length) * 100),
        seen,
        accuracy: seen === 0 ? null : Math.round((correct / seen) * 100),
      };
    });
  });

  protected readonly sessions = computed(() => this.progress.sessions().slice(0, 10));

  protected readonly recentlyLearned = computed<LessonMeta[]>(() =>
    Object.entries(this.progress.learned())
      .sort(([, a], [, b]) => b.localeCompare(a))
      .map(([slug]) => this.course.getBySlug(slug))
      .filter((l): l is LessonMeta => !!l)
      .slice(0, 12),
  );

  protected readonly missedCount = computed(() => {
    const missed = this.progress.missedIds();
    return this.quiz.bank().filter((q) => missed.has(q.id)).length;
  });

  protected modeLabel(mode: QuizMode): string {
    return MODE_LABELS[mode];
  }

  protected topicTitles(ids: string[]): string {
    return ids.map((id) => this.course.getTopic(id)?.title ?? id).join(', ');
  }

  protected resetProgress(): void {
    if (confirm('Reset everything you have learned, your bookmarks and your quiz history? This cannot be undone.')) {
      this.progress.reset();
    }
  }
}
