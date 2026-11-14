import { Component, computed, input } from '@angular/core';
import { SequenceMessage, SequenceNote, SequenceSpec } from './diagram-parser';
import { DiagramText } from './diagram-text';

/**
 * Actors across the top, dashed lifelines, and numbered steps. Positions are
 * percentages of the lane, so every arrow starts and ends on a lifeline at any width.
 */
@Component({
  selector: 'app-dg-sequence',
  imports: [DiagramText],
  template: `
    <div class="dg-seq" [style.min-width]="minWidth()">
      <div class="dg-seq-grid">
        <span></span>
        <div class="dg-seq-actors" [style.grid-template-columns]="columns()">
          @for (actor of spec().actors; track actor.id) {
            <div class="dg-seq-actor">
              <div class="dg-card" [class]="'dg-tone-' + actor.tone">
                <div class="dg-title"><app-dg-text [text]="actor.title" /></div>
                @if (actor.subtitle) {
                  <div class="dg-sub"><app-dg-text [text]="actor.subtitle" /></div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      @for (step of spec().steps; track step.n) {
        <div class="dg-seq-grid dg-seq-row">
          <span class="dg-seq-num" aria-label="Step {{ step.n }}">{{ step.n }}</span>
          <div class="dg-seq-lane">
            @for (x of lifelines(); track $index) {
              <span class="dg-seq-life" [style.left.%]="x"></span>
            }

            @if (step.kind === 'message') {
              <div class="dg-seq-label" [style.left.%]="mid(step)">
                <div class="dg-title"><app-dg-text [text]="step.title" /></div>
                @if (step.subtitle) {
                  <div class="dg-sub"><app-dg-text [text]="step.subtitle" /></div>
                }
              </div>
              <span
                class="dg-seq-arrow"
                [class.dg-dashed]="step.dashed"
                [class.dg-leftward]="step.to < step.from"
                [style.left.%]="arrowLeft(step)"
                [style.width.%]="arrowWidth(step)"
              ></span>
            } @else {
              <div
                class="dg-seq-note dg-card"
                [class]="'dg-tone-' + step.tone"
                [style.margin-left]="noteLeft(step)"
                [style.width]="noteWidth(step)"
              >
                <div class="dg-title"><app-dg-text [text]="step.title" /></div>
                @if (step.subtitle) {
                  <div class="dg-sub"><app-dg-text [text]="step.subtitle" /></div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DiagramSequence {
  readonly spec = input.required<SequenceSpec>();

  private readonly count = computed(() => this.spec().actors.length);

  protected readonly columns = computed(() => `repeat(${this.count()}, minmax(0, 1fr))`);
  protected readonly minWidth = computed(() => `${this.count() * 9 + 3}rem`);
  protected readonly lifelines = computed(() => this.spec().actors.map((_, i) => this.center(i)));

  /** Horizontal centre of an actor's lane, as a percentage of the lane width. */
  private center(index: number): number {
    return ((index + 0.5) / this.count()) * 100;
  }

  protected mid(m: SequenceMessage): number {
    return (this.center(m.from) + this.center(m.to)) / 2;
  }

  protected arrowLeft(m: SequenceMessage): number {
    return this.center(Math.min(m.from, m.to));
  }

  protected arrowWidth(m: SequenceMessage): number {
    return Math.abs(this.center(m.to) - this.center(m.from));
  }

  protected noteLeft(n: SequenceNote): string {
    return `calc(${(n.from / this.count()) * 100}% + 0.4rem)`;
  }

  protected noteWidth(n: SequenceNote): string {
    return `calc(${((n.to - n.from + 1) / this.count()) * 100}% - 0.8rem)`;
  }
}
