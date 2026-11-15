import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { QuizService } from '../../core/services/quiz.service';
import { CloudSyncService } from '../../core/sync/cloud-sync.service';
import { LessonMeta, Topic } from '../../core/models/lesson.model';
import { QuizMode } from '../../core/models/quiz.model';
import { SYNC_LABELS } from '../../shared/components/account-menu/account-menu';

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
  protected readonly auth = inject(AuthService);
  private readonly quiz = inject(QuizService);
  private readonly sync = inject(CloudSyncService);

  protected readonly syncInfo = computed(() => SYNC_LABELS[this.sync.state()]);

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

  /** Score of each of the last 8 rounds, oldest first, for the small bar chart. */
  protected readonly recentScores = computed(() =>
    this.progress
      .sessions()
      .slice(0, 8)
      .reverse()
      .map((s) => ({ pct: s.total === 0 ? 0 : Math.round((s.correct / s.total) * 100), label: `${s.correct} of ${s.total}` })),
  );

  /** Answers given and answered right, across every question. */
  protected readonly answerTotals = computed(() => {
    const stats = Object.values(this.progress.questionStats());
    return { seen: stats.reduce((n, s) => n + s.seen, 0), correct: stats.reduce((n, s) => n + s.correct, 0) };
  });

  /** A line of encouragement: what is finished, and the closest topic to finishing. */
  protected readonly nudge = computed(() => {
    const rows = this.topicRows();
    const done = rows.filter((r) => r.total > 0 && r.learned === r.total);
    const open = rows
      .filter((r) => r.learned > 0 && r.learned < r.total)
      .sort((a, b) => a.total - a.learned - (b.total - b.learned));
    const parts: string[] = [];
    if (done.length === 1) parts.push(`${done[0].topic.title} is complete.`);
    else if (done.length > 1) parts.push(`${done.length} topics are complete.`);
    if (open[0]) {
      const left = open[0].total - open[0].learned;
      parts.push(`${open[0].topic.title} is next closest: ${left} ${left === 1 ? 'bite' : 'bites'} to go.`);
    }
    return parts.join(' ') || 'Every bite you mark as learned counts here.';
  });

  protected readonly continueLesson = computed(() => {
    const slug = this.progress.lastOpened();
    return slug ? this.course.getBySlug(slug) : undefined;
  });

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
    const where = this.progress.isCloud() ? ', on every device you use,' : '';
    if (confirm(`Reset everything you have learned, your bookmarks and your quiz history${where}? This cannot be undone.`)) {
      this.progress.reset();
    }
  }
}
