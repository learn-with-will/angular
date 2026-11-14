import { Component, input } from '@angular/core';
import { TreeNode, TreeSpec } from './diagram-parser';
import { DiagramText } from './diagram-text';

/** One node plus its children; calls itself for each child. */
@Component({
  selector: 'app-dg-tree-node',
  imports: [DiagramText],
  template: `
    <div class="dg-tn">
      <div
        class="dg-node"
        [class]="'dg-tone-' + node().tone"
        [class.dg-root]="root()"
        [class.dg-card]="node().card"
        [class.dg-label]="!node().card"
      >
        @if (node().badge) {
          <span class="dg-badge">{{ node().badge }}</span>
        }
        <span class="dg-node-text">
          <span class="dg-title"><app-dg-text [text]="node().title" /></span>
          @if (node().subtitle) {
            <span class="dg-sub"><app-dg-text [text]="node().subtitle!" /></span>
          }
        </span>
      </div>

      @if (node().children.length) {
        <div class="dg-tkids">
          @for (child of node().children; track $index) {
            <div class="dg-tkid"><app-dg-tree-node [node]="child" /></div>
          }
        </div>
      }
    </div>
  `,
})
export class DiagramTreeNode {
  readonly node = input.required<TreeNode>();
  readonly root = input(false);
}

/** A left-to-right decision tree. */
@Component({
  selector: 'app-dg-tree',
  imports: [DiagramTreeNode],
  template: `
    <div class="dg-tree">
      <app-dg-tree-node [node]="spec().root" [root]="true" />
    </div>
  `,
})
export class DiagramTree {
  readonly spec = input.required<TreeSpec>();
}
