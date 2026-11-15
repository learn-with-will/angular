import { Component, computed, input, output } from '@angular/core';
import {
  AnswerValue,
  QuestionResult,
  QuizQuestion as QuizQuestionModel,
} from '../../../core/models/quiz.model';

/**
 * Renders one quiz question of any supported type and emits answer changes.
 * The parent owns the answer state; this component is otherwise presentational.
 * When `result` is provided (review mode), it renders correct/incorrect styling.
 */
@Component({
  selector: 'app-quiz-question',
  templateUrl: './quiz-question.html',
})
export class QuizQuestion {
  readonly question = input.required<QuizQuestionModel>();
  readonly index = input.required<number>();
  readonly answer = input<AnswerValue>();
  readonly result = input<QuestionResult>();

  readonly answerChange = output<AnswerValue>();

  protected readonly reviewing = computed(() => this.result() !== undefined);

  /** Option tiles show their key as 1, 2, 3… */
  protected readonly keys = '123456789';

  /**
   * How a choice option is drawn: before checking, and after. A picked answer is
   * drawn in ink, not brand red, so it can't be mistaken for a wrong one.
   */
  protected optionClass(selected: boolean, isAnswer: boolean): string {
    if (!this.reviewing()) {
      return selected
        ? 'border-2 border-ink-900 bg-ink-100 dark:border-white dark:bg-ink-800'
        : 'border border-ink-300 bg-white hover:border-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-500';
    }
    if (isAnswer) return 'border-2 border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/60';
    if (selected) return 'border-2 border-rose-600 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/50';
    return 'border border-ink-200 bg-white opacity-60 dark:border-ink-800 dark:bg-ink-900';
  }

  /** The small key tile inside an option. */
  protected keyClass(selected: boolean, isAnswer: boolean): string {
    if (this.reviewing() && isAnswer) return 'bg-emerald-600 text-white';
    if (this.reviewing() && selected) return 'bg-rose-600 text-white';
    if (!this.reviewing() && selected) return 'bg-ink-900 text-white dark:bg-white dark:text-ink-950';
    return 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300';
  }

  // ---- single-choice -------------------------------------------------------
  selectSingle(optionId: string): void {
    if (this.reviewing()) return;
    this.answerChange.emit(optionId);
  }

  isSingleSelected(optionId: string): boolean {
    return this.answer() === optionId;
  }

  // ---- multiple-choice -----------------------------------------------------
  toggleMultiple(optionId: string): void {
    if (this.reviewing()) return;
    const current = Array.isArray(this.answer()) ? [...(this.answer() as string[])] : [];
    const idx = current.indexOf(optionId);
    idx === -1 ? current.push(optionId) : current.splice(idx, 1);
    this.answerChange.emit(current);
  }

  isMultipleSelected(optionId: string): boolean {
    return Array.isArray(this.answer()) && (this.answer() as string[]).includes(optionId);
  }

  // ---- fill-blank ----------------------------------------------------------
  onFillInput(event: Event): void {
    this.answerChange.emit((event.target as HTMLInputElement).value);
  }

  // ---- ordering ------------------------------------------------------------
  orderedIds(): string[] {
    const q = this.question();
    if (q.type !== 'ordering') return [];
    const current = Array.isArray(this.answer()) ? (this.answer() as string[]) : [];
    return current.length ? current : q.items.map((i) => i.id);
  }

  orderedItemText(id: string): string {
    const q = this.question();
    if (q.type !== 'ordering') return '';
    return q.items.find((i) => i.id === id)?.text ?? '';
  }

  move(id: string, dir: -1 | 1): void {
    if (this.reviewing()) return;
    const ids = [...this.orderedIds()];
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    this.answerChange.emit(ids);
  }

  // ---- match-pair ----------------------------------------------------------
  /** Right-hand options, shuffled deterministically by sorting on text. */
  matchOptions(): string[] {
    const q = this.question();
    if (q.type !== 'match-pair') return [];
    return [...q.pairs.map((p) => p.right)].sort((a, b) => a.localeCompare(b));
  }

  matchValue(left: string): string {
    const a = this.answer();
    return a && typeof a === 'object' && !Array.isArray(a) ? (a[left] ?? '') : '';
  }

  onMatchSelect(left: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const current =
      this.answer() && typeof this.answer() === 'object' && !Array.isArray(this.answer())
        ? { ...(this.answer() as Record<string, string>) }
        : {};
    current[left] = value;
    this.answerChange.emit(current);
  }
}
