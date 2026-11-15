import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BankQuestion } from '../../../core/models/quiz.model';
import { CourseService } from '../../../core/services/course.service';

interface MissedRow {
  question: BankQuestion;
  lessonSlug?: string;
  lessonTitle?: string;
}

/** End-of-session summary: score, then every question that was missed with a link to learn more. */
@Component({
  selector: 'app-quiz-result',
  imports: [RouterLink],
  template: `
    <div class="panel-ink relative isolate flex animate-pop flex-wrap items-center gap-8 overflow-hidden p-8 sm:p-10" role="status">
      <div class="absolute -top-36 -right-28 -z-10 h-96 w-96 rounded-full border-[3.5rem] border-brand-600/30" aria-hidden="true"></div>
      <svg class="h-36 w-36 shrink-0 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#2a2238" stroke-width="12" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          [attr.stroke]="pct() >= 70 ? '#34d399' : '#fbbf24'"
          stroke-width="12"
          stroke-linecap="round"
          [attr.stroke-dasharray]="(pct() / 100) * 314.16 + ' 314.16'"
        />
      </svg>
      <div class="min-w-0 flex-[1_1_16rem]">
        <p class="font-display text-[3.5rem] leading-none font-bold tracking-[-0.03em] tabular-nums">
          {{ correct() }}<span class="text-3xl text-ink-400"> / {{ total() }}</span>
        </p>
        <p class="mt-2 text-xl font-bold">{{ headline() }}</p>
        <p class="mt-1 text-sm text-ink-300">{{ pct() }}% correct this round</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <button type="button" (click)="again.emit()" class="btn-light">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 12a8 8 0 1 1 2.3 5.7M4 20v-5h5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Play again
          </button>
          @if (missedRows().length) {
            <button
              type="button"
              (click)="practiceMissed.emit()"
              class="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-ink-600 px-5 text-sm font-semibold text-white transition hover:border-ink-400 hover:bg-white/5"
            >
              Practice the {{ missedRows().length }} missed
            </button>
          }
          <a
            routerLink="/quiz"
            class="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-ink-300 transition hover:bg-white/5 hover:text-white"
          >
            Back to quiz
          </a>
        </div>
      </div>
    </div>

    @if (missedRows().length) {
      <section class="mt-8" aria-labelledby="missed-heading">
        <h2 id="missed-heading" class="heading text-2xl">Worth another look</h2>
        <ul class="mt-4 space-y-3">
          @for (row of missedRows(); track row.question.id) {
            <li class="card flex flex-wrap items-center justify-between gap-3 p-4.5">
              <span class="min-w-0 flex-1 font-semibold text-ink-800 dark:text-ink-100">
                {{ row.question.prompt }}
              </span>
              @if (row.lessonSlug) {
                <a
                  [routerLink]="['/lesson', row.lessonSlug]"
                  class="shrink-0 rounded text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  Learn more: {{ row.lessonTitle }}
                </a>
              }
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class QuizResult {
  readonly correct = input.required<number>();
  readonly total = input.required<number>();
  readonly missed = input.required<BankQuestion[]>();

  readonly again = output<void>();
  readonly practiceMissed = output<void>();

  private readonly course = inject(CourseService);

  protected readonly pct = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.correct() / this.total()) * 100),
  );

  protected readonly headline = computed(() => {
    const pct = this.pct();
    if (pct === 100) return 'Perfect round!';
    if (pct >= 70) return 'Nice work';
    if (pct >= 40) return 'Getting there';
    return 'Keep practicing';
  });

  protected readonly missedRows = computed<MissedRow[]>(() =>
    this.missed().map((question) => {
      const lesson = question.lesson ? this.course.getBySlug(question.lesson) : undefined;
      return { question, lessonSlug: lesson?.slug, lessonTitle: lesson?.title };
    }),
  );
}
