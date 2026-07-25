---
id: lesson-26
slug: angular-cdk-virtual-scroll-drag-drop
title: "Angular CDK Deep Dive: Virtual Scroll & Drag/Drop"
level: advanced
order: 24
duration: 75
tags:
  - angular-cdk
  - virtual-scroll
  - drag-and-drop
  - performance
  - signals
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Render lists with tens of thousands of rows smoothly using `CdkVirtualScrollViewport` and `*cdkVirtualFor`.
- Configure and tune virtual scroll performance with `itemSize`, `minBufferPx`, and `maxBufferPx`.
- Build reorderable single lists and multi-list (Kanban-style) interfaces with `cdkDrag` and `cdkDropList`.
- Update your data model correctly after a drag using `moveItemInArray` and `transferArrayItem`.
- Apply advanced CDK drag/drop features — handles, previews, placeholders, boundaries — and recognize the real limitations of combining virtual scroll with drag/drop.

## Why This Concept Exists

Two performance and UX problems show up constantly in real Angular applications:

1. **Huge lists kill performance.** Rendering 10,000 `<div>` elements with `*ngFor` creates 10,000 real DOM nodes. The browser has to lay them out, paint them, and keep them in memory — even though the user can only see 15–20 of them at a time. This causes janky scrolling, slow initial renders, and high memory usage.
2. **Drag-and-drop is deceptively hard to build correctly.** A "simple" reorderable list needs to track pointer/touch events, calculate drop targets, animate sibling elements out of the way, support keyboard users, and handle edge cases like dragging between two separate lists. Hand-rolling this with raw `dragstart`/`dragover` events is fragile and inaccessible.

The **Angular Component Dev Kit (CDK)** solves both problems as *unstyled, behavior-only* building blocks. Unlike Angular Material, the CDK ships zero visual opinions — you get the interaction logic (virtualization math, drag physics, keyboard support) and you supply the CSS. This makes it the standard, low-level toolkit for building custom, high-performance UI in Angular, and it's a dependency of Angular Material itself.

## Concept Explanation

### Virtual Scrolling

Virtual scrolling (also called "windowing") is a technique where **only the DOM elements currently visible in the viewport (plus a small buffer) are rendered**. As the user scrolls, the CDK:

1. Calculates which range of your data array is currently visible, based on scroll offset and item size.
2. Renders only that range of elements.
3. Recycles/repositions DOM nodes as new items scroll into view, instead of creating and destroying nodes constantly.
4. Uses a spacer element to fake the *total* scrollable height, so the scrollbar behaves as if all items were rendered.

The result: scrolling a list of 100,000 items feels identical to scrolling a list of 20 items, because the DOM never contains more than a few dozen nodes at once.

The CDK's `@angular/cdk/scrolling` package exposes this through a **`VirtualScrollStrategy`** — a pluggable algorithm that decides which items are visible. Out of the box, Angular ships `FixedSizeVirtualScrollStrategy`, which assumes every row has the same, known height. This is the strategy you'll use 95% of the time. For variable-height rows you must implement a custom `VirtualScrollStrategy` (advanced, and not needed for most apps).

### Drag and Drop

The `@angular/cdk/drag-drop` package provides two cooperating directives:

- **`cdkDrag`** — makes an element draggable (via mouse, touch, or keyboard).
- **`cdkDropList`** — marks a container as a valid drop zone. Wrapping a set of `cdkDrag` elements in a `cdkDropList` turns them into a **sortable list**: as you drag an item over its siblings, the CDK animates them out of the way in real time.

Critically, **the CDK never touches your data**. Dragging an item only moves the DOM/visual representation. You are responsible for listening to the `(cdkDropListDropped)` event and updating your underlying array with the two provided helper functions:

- `moveItemInArray(array, previousIndex, currentIndex)` — reorder within one list.
- `transferArrayItem(previousArray, currentArray, previousIndex, currentIndex)` — move an item from one list's array to another's.

This separation (CDK owns the *interaction*, you own the *data*) is what makes drag/drop composable with any state management approach — plain arrays, signals, NgRx, or RxJS streams.

## Key Terminology

| Term | Meaning |
|---|---|
| **CDK (Component Dev Kit)** | Angular's library of unstyled, accessible interaction primitives (`@angular/cdk`). Angular Material is built on top of it. |
| **`CdkVirtualScrollViewport`** | The `<cdk-virtual-scroll-viewport>` component that defines the scrollable, virtualized container. |
| **`*cdkVirtualFor`** | A structural directive, similar to `*ngFor`, used *inside* the viewport to repeat items. It supports `trackBy` just like `*ngFor`. |
| **`VirtualScrollStrategy`** | The pluggable algorithm that decides which items are currently rendered. `FixedSizeVirtualScrollStrategy` is the built-in, production-ready default. |
| **Buffer (`minBufferPx` / `maxBufferPx`)** | Extra pixels of content rendered just outside the visible viewport, so items are already in the DOM before they scroll into view (avoids blank flashes). |
| **`cdkDrag`** | Directive that makes a single element draggable. |
| **`cdkDropList`** | Directive that marks a container as a drop zone and, when it wraps `cdkDrag` items, as a sortable list. |
| **`CdkDragDrop<T>`** | The event object emitted by `(cdkDropListDropped)`, containing `previousIndex`, `currentIndex`, `previousContainer`, and `container`. |
| **`cdkDropListGroup`** | Groups several `cdkDropList` containers so items can be dragged *between* them without manually wiring `cdkDropListConnectedTo` on each one. |
| **`cdkDragHandle`** | Restricts the "grabbable" area of a drag item to a specific child element (e.g. a drag icon), leaving the rest of the item interactive. |
| **`cdkDragPreview` / `cdkDragPlaceholder`** | Structural directives to customize, respectively, the element that follows the pointer while dragging, and the placeholder left behind in the original list position. |

## Syntax Overview

### Virtual Scroll — minimal setup

```html
<cdk-virtual-scroll-viewport
  itemSize="48"
  minBufferPx="200"
  maxBufferPx="400"
  class="viewport">
  <div *cdkVirtualFor="let item of items; trackBy: trackByFn" class="row">
    {{ item }}
  </div>
</cdk-virtual-scroll-viewport>
```

- `itemSize` (required for fixed-size scrolling): the pixel height of **one row**. It must match your actual rendered row height, or scrolling will jump/jitter.
- `minBufferPx` / `maxBufferPx`: control how much extra content is pre-rendered outside the visible area (larger buffer = smoother fast-scrolling, more DOM nodes).
- The viewport element **must have an explicit height** (via CSS) and `overflow` handling — the CDK sets `overflow: auto` on it internally, but the container needs bounded dimensions (e.g. `height: 400px`) or there's nothing to scroll.

Programmatic control, via a template reference or `@ViewChild`:

```typescript
@ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

scrollToTop(): void {
  this.viewport.scrollToIndex(0, 'smooth');
}
```

### Drag and Drop — minimal setup

```html
<div cdkDropList (cdkDropListDropped)="drop($event)">
  @for (item of items(); track item) {
    <div cdkDrag class="item">{{ item }}</div>
  }
</div>
```

```typescript
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

drop(event: CdkDragDrop<string[]>): void {
  moveItemInArray(this.items(), event.previousIndex, event.currentIndex);
}
```

Note that `moveItemInArray` **mutates the array in place**. If your component uses signals or `OnPush` change detection with immutable data, you must trigger a reference change afterward (shown in the examples below).

## Real World Analogy

Think of **virtual scrolling like a train window**: the entire landscape exists, but you only ever see (and the "world" only ever needs to render) the small slice framed by the window at any moment. As the train moves, new scenery is drawn in just before it becomes visible, and scenery behind you disappears — but the map (your data) never changes size or order.

Think of **CDK drag/drop like a whiteboard with sticky notes**: the whiteboard (`cdkDropList`) is the surface that accepts notes. Each sticky note (`cdkDrag`) can be picked up and repositioned. Moving a note around the board doesn't change what's written on the note — but *someone* still has to walk over afterward and update the master project list to reflect the new physical order. That "someone" is your `(cdkDropListDropped)` handler.

## Examples

### 1. Basic Example — A Virtualized List of 100,000 Rows

This example renders 100,000 numbered rows with smooth scrolling and near-zero memory overhead, using a standalone component.

```typescript
// basic-virtual-scroll.component.ts
import { Component } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-basic-virtual-scroll',
  standalone: true,
  imports: [ScrollingModule],
  template: `
    <h2>100,000 rows, rendered lazily</h2>
    <cdk-virtual-scroll-viewport itemSize="48" class="viewport">
      <div *cdkVirtualFor="let item of items; trackBy: trackByIndex" class="row">
        Row #{{ item }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 400px;
      width: 100%;
      max-width: 480px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
    }
    .row {
      height: 48px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-bottom: 1px solid #eee;
      font-family: monospace;
    }
    .row:nth-child(odd) {
      background: #fafafa;
    }
  `],
})
export class BasicVirtualScrollComponent {
  // A plain array is fine here: the list is static and never mutated.
  items = Array.from({ length: 100_000 }, (_, i) => i + 1);

  // trackBy avoids re-creating DOM nodes when the visible range shifts by
  // one row — it lets the CDK/Angular reuse existing nodes.
  trackByIndex(_index: number, item: number): number {
    return item;
  }
}
```

**Why this works:** `itemSize="48"` tells the `FixedSizeVirtualScrollStrategy` that every `.row` is exactly 48px tall, so it can compute the total scrollable height (`100,000 × 48px`) and the visible index range from pure arithmetic — without ever measuring 100,000 real DOM elements.

### 2. Real-World Example — A Kanban Board with Connected Drop Lists

A classic real-world use case: a task board with three columns where tasks can be reordered within a column *and* dragged between columns.

```typescript
// kanban-board.component.ts
import { Component, signal } from '@angular/core';
import {
  CdkDropList,
  CdkDropListGroup,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

interface Task {
  id: number;
  title: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CdkDropListGroup, CdkDropList, CdkDrag],
  template: `
    <div class="board" cdkDropListGroup>
      @for (column of columns(); track column.id) {
        <div class="column">
          <h3>{{ column.title }}</h3>
          <div
            class="task-list"
            cdkDropList
            [id]="column.id"
            [cdkDropListData]="column.tasks"
            (cdkDropListDropped)="drop($event)">
            @for (task of column.tasks; track task.id) {
              <div class="task-card" cdkDrag>
                {{ task.title }}
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .board { display: flex; gap: 16px; }
    .column {
      width: 220px;
      background: #f4f5f7;
      border-radius: 6px;
      padding: 8px;
    }
    .task-list {
      min-height: 60px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .task-card {
      background: white;
      border-radius: 4px;
      padding: 10px 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
      cursor: grab;
    }
    .cdk-drag-preview {
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
    .cdk-drop-list-dragging .task-card:not(.cdk-drag-placeholder) {
      transition: transform 200ms ease;
    }
  `],
})
export class KanbanBoardComponent {
  columns = signal<Column[]>([
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { id: 1, title: 'Design login screen' },
        { id: 2, title: 'Write API contract' },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: [{ id: 3, title: 'Implement auth guard' }],
    },
    { id: 'done', title: 'Done', tasks: [{ id: 4, title: 'Project scaffolding' }] },
  ]);

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    // moveItemInArray / transferArrayItem mutate the arrays in place.
    // Because `columns` is a signal, we must produce a new reference so
    // Angular's change detection (and the template) picks up the change.
    this.columns.update((cols) => [...cols]);
  }
}
```

**Key points:**
- `cdkDropListGroup` on the parent automatically connects every child `cdkDropList` inside it, so items can be transferred between all three columns without manually listing connections.
- `[cdkDropListData]` binds each list's underlying array so the `CdkDragDrop` event tells you exactly which array (`previousContainer.data` / `container.data`) to mutate.
- Because state is held in a `signal`, and the CDK helper functions mutate arrays by reference, we explicitly create a new array reference (`[...cols]`) after the mutation so Angular's reactivity picks it up. This is one of the most common gotchas — see **Common Mistakes** below.

### 3. Best-Practice Example — Accessible Reorderable List with Handles, Preview & Boundary

This example demonstrates production-quality drag/drop: a dedicated drag handle (so buttons inside each row remain clickable), a custom preview, a drop boundary, and disabled-state handling.

```typescript
// settings-list.component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  CdkDragPreview,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

interface Widget {
  id: string;
  label: string;
  locked: boolean;
}

@Component({
  selector: 'app-settings-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPreview],
  template: `
    <div class="panel" #boundary>
      <h3>Dashboard widget order</h3>
      <div
        class="widget-list"
        cdkDropList
        cdkDropListLockAxis="y"
        (cdkDropListDropped)="drop($event)">
        @for (widget of widgets(); track widget.id) {
          <div
            class="widget-row"
            cdkDrag
            [cdkDragDisabled]="widget.locked"
            [cdkDragBoundary]="boundary">
            <span class="handle" cdkDragHandle aria-label="Reorder handle">⠿</span>

            <span class="label">{{ widget.label }}</span>

            @if (widget.locked) {
              <span class="lock" title="Locked widgets cannot be reordered">🔒</span>
            }

            <!-- Custom preview: a lightweight ghost instead of a full clone -->
            <div *cdkDragPreview class="drag-preview">{{ widget.label }}</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .panel { max-width: 360px; }
    .widget-list { display: flex; flex-direction: column; gap: 6px; }
    .widget-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background: white;
      border: 1px solid #e2e2e2;
      border-radius: 4px;
    }
    .handle {
      cursor: grab;
      color: #888;
      touch-action: none; /* required so touch drag doesn't fight page scroll */
    }
    .widget-row.cdk-drag-disabled .handle {
      cursor: not-allowed;
      opacity: 0.4;
    }
    .label { flex: 1; }
    .drag-preview {
      padding: 8px 12px;
      background: #333;
      color: white;
      border-radius: 4px;
      font-size: 14px;
    }
    .cdk-drag-placeholder { opacity: 0.2; }
  `],
})
export class SettingsListComponent {
  widgets = signal<Widget[]>([
    { id: 'revenue', label: 'Revenue chart', locked: false },
    { id: 'users', label: 'Active users', locked: false },
    { id: 'audit', label: 'Audit log', locked: true },
    { id: 'alerts', label: 'System alerts', locked: false },
  ]);

  drop(event: CdkDragDrop<Widget[]>): void {
    moveItemInArray(this.widgets(), event.previousIndex, event.currentIndex);
    this.widgets.update((list) => [...list]);
  }
}
```

**Why this is best practice:**
- `cdkDragHandle` means only the `⠿` icon starts a drag — the rest of the row (and any future buttons/links you add) stays fully interactive.
- `[cdkDragDisabled]="widget.locked"` disables dragging per-item based on state, rather than removing the directive conditionally.
- `[cdkDragBoundary]` keeps the dragged element from visually escaping its panel.
- `cdkDropListLockAxis="y"` locks movement to the vertical axis, appropriate for a single-column list.
- `*cdkDragPreview` replaces the default full-element clone with a small, purpose-built ghost — this avoids preview elements that inherit awkward width/overflow from their original container (a very common visual bug).
- `ChangeDetectionStrategy.OnPush` combined with signals keeps this component fast even as the widget list grows, because updates only happen on explicit signal writes.
- **Accessibility for free:** `cdkDrag` items are focusable and keyboard-operable by default — focus the handle, press <kbd>Space</kbd> to pick up, arrow keys to move, <kbd>Space</kbd> again to drop, <kbd>Escape</kbd> to cancel. You get this without writing any keyboard-handling code.

## Common Mistakes

1. **Forgetting the viewport needs a bounded height.** `<cdk-virtual-scroll-viewport>` without an explicit CSS `height` (and no `overflow` constraint) has nothing to scroll — the CDK can't compute a visible range. Always give it `height: <value>` or make it fill a flex/grid cell with a defined size.
2. **`itemSize` not matching the real row height.** If your CSS lets rows wrap to two lines, or you forget padding/border in `box-sizing`, the calculated scroll position drifts from the actual rendered position, causing visible jumps.
3. **Using `*ngFor` instead of `*cdkVirtualFor` inside the viewport.** This silently defeats virtualization — you're back to rendering every item, just inside a scroll container.
4. **Skipping `trackBy` on `*cdkVirtualFor`.** Without it, Angular may recreate DOM nodes (and lose focus/scroll state, or re-trigger animations) more often than necessary as the rendered window shifts.
5. **Mutating a signal-backed or `OnPush` array with `moveItemInArray`/`transferArrayItem` and expecting the UI to update automatically.** These helpers mutate arrays *by reference*. With `OnPush` or signals, you must replace the reference (`signal.update(arr => [...arr])`) or call `markForCheck()`.
6. **Forgetting to connect multiple `cdkDropList`s.** Two side-by-side lists won't accept items from each other unless you use `cdkDropListGroup` (auto-connects everything inside it) or manually list `[cdkDropListConnectedTo]`.
7. **Making the entire card/row draggable when it contains buttons, links, or inputs.** Without a `cdkDragHandle`, users can't click a "delete" button inside a draggable row without accidentally starting a drag. Scope dragging to a handle.
8. **Assuming virtual scroll and drag/drop "just work" together.** `*cdkVirtualFor` only keeps a handful of DOM nodes mounted at any time; a drag interaction that needs an item's DOM node to exist for the whole gesture (e.g. auto-scrolling to reorder across the full dataset) is not something the CDK solves out of the box. If you need both, keep drag-and-drop scoped to data that's fully rendered (e.g. reordering within a non-virtualized, paginated subset) rather than expecting seamless reordering across a 100,000-row virtualized list.
9. **Forgetting `touch-action: none` on drag handles.** On touch devices, the browser's native scroll gesture can compete with the CDK's drag gesture unless you set `touch-action: none` on the draggable/handle element.

## Best Practices

- **Always pair `*cdkVirtualFor` with `trackBy`**, using a stable unique key (an ID), not the array index.
- **Measure your real row height** (via browser dev tools) rather than guessing `itemSize` — a mismatch is the #1 cause of "virtual scroll feels janky" bug reports.
- **Import only the directives you use** (`CdkVirtualScrollViewport`, `CdkFixedSizeVirtualScroll` / `ScrollingModule`; `CdkDrag`, `CdkDropList`, `CdkDropListGroup` / `DragDropModule`) in standalone components — this keeps bundles lean. The bundled `ScrollingModule` / `DragDropModule` are fine too and are simpler when you need most of the feature set.
- **Use a `cdkDragHandle`** whenever a draggable item contains other interactive elements.
- **Customize `*cdkDragPreview`** for cards with complex layouts, images, or elements that don't look right when naively cloned (e.g. elements with `overflow: hidden` ancestors).
- **Update state immutably after a drop.** Treat `moveItemInArray`/`transferArrayItem` as data-layer utilities that must be followed by a change-detection-friendly update (new array/signal write) when using `OnPush` or signals.
- **Prefer signals + `ChangeDetectionStrategy.OnPush`** for any list-heavy component — both virtual scroll and drag/drop generate frequent, fine-grained updates, and `OnPush` avoids unnecessary tree-wide checks.
- **Test with a keyboard.** CDK drag/drop is accessible by default (`Space` to pick up/drop, arrow keys to move) — verify it actually works in your styled UI, since custom previews/placeholders can sometimes visually hide the keyboard-drag state.
- **Don't over-engineer virtualization for small lists.** Under a few hundred rows, `*ngFor` is simpler and the performance difference is imperceptible — reach for `*cdkVirtualFor` when lists are large or backed by paginated/streamed data.

## Summary

- The Angular CDK provides unstyled, accessible interaction primitives; `@angular/cdk/scrolling` and `@angular/cdk/drag-drop` are two of its most-used packages.
- Virtual scrolling renders only the visible slice of a large list (plus a buffer), keeping DOM size constant regardless of dataset size.
- `<cdk-virtual-scroll-viewport itemSize="...">` + `*cdkVirtualFor` is the standard setup; the viewport needs an explicit CSS height, and `itemSize` must match the real row height.
- `cdkDrag` makes elements draggable; `cdkDropList` turns a container into a sortable drop zone.
- The CDK animates drag interactions visually but never mutates your data — you must handle `(cdkDropListDropped)` and call `moveItemInArray` or `transferArrayItem`.
- `cdkDropListGroup` connects multiple lists so items can be transferred between them (e.g. Kanban boards).
- `cdkDragHandle`, `*cdkDragPreview`, `*cdkDragPlaceholder`, `cdkDragBoundary`, and `cdkDropListLockAxis` give fine-grained control over drag UX.
- Mutating helper functions change arrays by reference — remember to trigger change detection (new array/signal update) under `OnPush`.
- Combining virtual scroll with cross-list drag/drop across the *entire* virtualized dataset is a known hard problem; scope drag/drop to fully-rendered data when possible.
- CDK drag/drop includes keyboard support out of the box — verify it in your final styled UI.

## Flash Cards

**Q: What component and directive combination enables virtual scrolling in Angular?**
A: `<cdk-virtual-scroll-viewport>` (from `@angular/cdk/scrolling`) wrapping items rendered with `*cdkVirtualFor` instead of `*ngFor`.

**Q: Why must a virtual scroll viewport have an explicit height in CSS?**
A: The CDK calculates the visible item range from the viewport's rendered dimensions and scroll offset; without a bounded height, there's no scrollable region to compute against.

**Q: Which function reorders items within a single `cdkDropList`, and which moves items between two lists?**
A: `moveItemInArray()` reorders within one list; `transferArrayItem()` moves an item from one list's array to another's. Both come from `@angular/cdk/drag-drop`.

**Q: How do you let a user drag items between two separate `cdkDropList` containers?**
A: Wrap them in a common `cdkDropListGroup` (auto-connects all lists inside it), or manually connect them with `[cdkDropListConnectedTo]`.

**Q: Why would you add a `cdkDragHandle` instead of making the whole `cdkDrag` element draggable?**
A: To keep other interactive elements inside the item (buttons, links, inputs) clickable, by restricting the "grab" area to a specific child element.

## Exercises

**Easy — Virtualized string list**
Build a standalone component that renders a virtual-scrolled list of 5,000 randomly generated strings (e.g. `"Item 1"` through `"Item 5000"`). Use `itemSize="40"`, give the viewport a fixed height of `300px`, and style alternating rows. Add a `trackBy` function.

**Medium — Two-column task mover**
Build a standalone component with two `cdkDropList`s side by side: "Active" and "Completed". Each task is a card with a title. Users should be able to reorder tasks within a column and drag tasks between columns. Connect the lists with `cdkDropListGroup`, and implement the `(cdkDropListDropped)` handler using `moveItemInArray` and `transferArrayItem`. Use a signal to store the two arrays and make sure the UI updates correctly after every drop.

**Challenging — Reorderable contact list with virtualization awareness**
Build a component that displays 10,000 contact objects (`{ id, name, email }`) in a `cdk-virtual-scroll-viewport`, each row showing the name and email with a `cdkDragHandle` icon. Attempt to make the list reorderable via drag-and-drop. You will run into the virtual-scroll + drag/drop limitation described in **Common Mistakes**. Document (in code comments or a short written note) which strategy you chose to work around it — for example: (a) disabling reordering entirely for the virtualized view and instead providing a separate "reorder mode" that loads a non-virtualized, paginated subset, or (b) restricting reordering to only the currently-rendered window of items. Implement one of these strategies.

## Further Reading

- [Angular CDK — Scrolling overview](https://material.angular.dev/cdk/scrolling/overview) — official documentation for `CdkVirtualScrollViewport`, `*cdkVirtualFor`, and virtual scroll strategies.
- [Angular CDK — Drag and Drop overview](https://material.angular.dev/cdk/drag-drop/overview) — official documentation for `cdkDrag`, `cdkDropList`, handles, previews, placeholders, and connected lists.
- [Angular — Signals guide](https://angular.dev/guide/signals) — official guide to Angular's reactive primitives, useful for managing list state alongside CDK drag/drop.
- [Angular — Standalone components guide](https://angular.dev/guide/components/importing) — how standalone components import directives/modules like the ones used throughout this lesson.
