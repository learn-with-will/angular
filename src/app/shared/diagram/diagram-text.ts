import { Component, computed, input } from '@angular/core';
import { richText } from './diagram-parser';

/** Renders a diagram string, turning `backticked` parts into inline code. */
@Component({
  selector: 'app-dg-text',
  // Plain parts sit in a span so Angular's whitespace handling cannot add a stray space around code.
  template: `@for (seg of segments(); track $index) {@if (seg.code) {<code>{{ seg.text }}</code>} @else {<span>{{ seg.text }}</span>}}`,
})
export class DiagramText {
  readonly text = input.required<string>();
  protected readonly segments = computed(() => richText(this.text()));
}
