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
