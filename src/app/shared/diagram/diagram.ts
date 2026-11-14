import { Component, computed, input } from '@angular/core';
import { DiagramSpec, FlowSpec, SequenceSpec, TreeSpec } from './diagram-parser';
import { DiagramFlow } from './diagram-flow';
import { DiagramSequence } from './diagram-sequence';
import { DiagramTree } from './diagram-tree';

/**
 * Draws a parsed lesson diagram. The text is real HTML, so it stays selectable
 * and readable by screen readers; colours come from CSS variables in styles.css,
 * so light and dark themes need no re-render.
 */
@Component({
  selector: 'app-diagram',
  imports: [DiagramSequence, DiagramTree, DiagramFlow],
  host: { class: 'dg', role: 'group', 'aria-label': 'Diagram' },
  template: `
    @if (sequence(); as s) {
      <app-dg-sequence [spec]="s" />
    } @else if (tree(); as t) {
      <app-dg-tree [spec]="t" />
    } @else if (flow(); as f) {
      <app-dg-flow [spec]="f" />
    }
  `,
})
export class Diagram {
  readonly spec = input.required<DiagramSpec>();

  protected readonly sequence = computed(() => {
    const s = this.spec();
    return s.type === 'sequence' ? (s as SequenceSpec) : null;
  });
  protected readonly tree = computed(() => {
    const s = this.spec();
    return s.type === 'tree' ? (s as TreeSpec) : null;
  });
  protected readonly flow = computed(() => {
    const s = this.spec();
    return s.type === 'flow' ? (s as FlowSpec) : null;
  });
}
