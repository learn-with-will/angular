import { Component, DestroyRef, ElementRef, afterNextRender, inject, input, signal, viewChild } from '@angular/core';
import { FlowSpec } from './diagram-parser';
import { DiagramText } from './diagram-text';

interface EdgePath {
  d: string;
  label?: string;
  x: number;
  y: number;
}

let nextId = 0;

/**
 * Columns of node cards with curved arrows between them. The columns are plain
 * HTML; the arrows are an SVG overlay drawn from the measured card positions, so
 * they stay attached when the layout reflows.
 */
@Component({
  selector: 'app-dg-flow',
  imports: [DiagramText],
  template: `
    <div class="dg-flow" #root>
      <div class="dg-flow-cols">
        @for (layer of spec().layers; track $index) {
          <div class="dg-flow-col">
            @for (node of layer; track node.id) {
              <div class="dg-card" [class]="'dg-tone-' + node.tone" [attr.data-node]="node.id">
                <div class="dg-title"><app-dg-text [text]="node.title" /></div>
                @if (node.subtitle) {
                  <div class="dg-sub"><app-dg-text [text]="node.subtitle" /></div>
                }
              </div>
            }
          </div>
        }
      </div>

      <svg class="dg-flow-edges" aria-hidden="true">
        <defs>
          <marker [attr.id]="markerId" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>
        @for (edge of edges(); track $index) {
          <path [attr.d]="edge.d" class="dg-edge" [attr.marker-end]="'url(#' + markerId + ')'" />
          @if (edge.label) {
            <text class="dg-edge-label" [attr.x]="edge.x" [attr.y]="edge.y">{{ edge.label }}</text>
          }
        }
      </svg>
    </div>
  `,
})
export class DiagramFlow {
  readonly spec = input.required<FlowSpec>();

  protected readonly markerId = `dg-arrow-${nextId++}`;
  protected readonly edges = signal<EdgePath[]>([]);

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.measure();
      // Fonts loading or a narrower container reflows the cards: redraw the arrows.
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(this.root().nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private measure(): void {
    const root = this.root().nativeElement;
    const origin = root.getBoundingClientRect();
    const box = (id: string): DOMRect | undefined =>
      root.querySelector(`[data-node="${id}"]`)?.getBoundingClientRect();

    const paths: EdgePath[] = [];
    for (const edge of this.spec().edges) {
      const a = box(edge.from);
      const b = box(edge.to);
      if (!a || !b) continue;

      const x1 = a.right - origin.left;
      const y1 = a.top + a.height / 2 - origin.top;
      const x2 = b.left - origin.left - 2;
      const y2 = b.top + b.height / 2 - origin.top;
      const bend = Math.max(24, (x2 - x1) / 2);
      paths.push({
        d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
        label: edge.label,
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2 - 7,
      });
    }
    this.edges.set(paths);
  }
}
