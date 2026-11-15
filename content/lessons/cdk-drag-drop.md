---
slug: cdk-drag-drop
title: "CDK drag and drop"
topic: performance
kind: technique
summary: "cdkDrag and cdkDropList own the interaction; you own the data, including keyboard reordering."
tags: [performance, cdk, drag-drop, accessibility]
related: [cdk-virtual-scroll, pitfall-onpush-mutation, onpush-triggers, change-detection-strategies]
---
> **In one line:** The CDK animates the drag and fires an event. It never changes your array, so you apply `moveItemInArray` or `transferArrayItem` yourself.

## The idea

A reorderable list needs pointer and touch tracking, drop-target maths, animation of the siblings and handling of dragging between lists. Hand-rolling it with raw `dragstart` events is fragile and inaccessible.

Two directives cooperate:

| Directive or helper | Role |
|---|---|
| `cdkDrag` | makes an element draggable by mouse or touch |
| `cdkDropList` | marks a container as a drop zone, making its children sortable |
| `cdkDropListGroup` | connects all drop lists inside it, so items can move between them |
| `moveItemInArray` | reorder within one array |
| `transferArrayItem` | move an item from one array to another |

This split, the CDK owns the *interaction* and you own the *data*, makes it work with plain arrays, signals, NgRx or RxJS.

## See it

```typescript
@Component({
  selector: 'app-sortable',
  imports: [CdkDropList, CdkDrag],
  template: `
    <div cdkDropList (cdkDropListDropped)="drop($event)">
      @for (item of items(); track item) {
        <div cdkDrag class="item">{{ item }}</div>
      }
    </div>
  `,
})
export class Sortable {
  protected readonly items = signal(['Plan', 'Build', 'Test', 'Ship']);

  protected drop(event: CdkDragDrop<string[]>): void {
    // moveItemInArray mutates, so work on a copy and set a NEW array
    const next = [...this.items()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.items.set(next);
  }
}
```

## Go deeper

The mutation point is a real trap. `moveItemInArray` changes the array **in place**. With a signal or an `OnPush` component, the reference never changes, so the view does not update and the dragged item snaps back. Copy first, then `set` the new array, as above.

For a board with several columns, put `cdkDropListGroup` on the parent and give each list its own `[cdkDropListData]`. In the handler, compare `event.previousContainer === event.container`: the same container means `moveItemInArray`, otherwise `transferArrayItem`. Update each column array immutably.

**Keyboard users cannot drag.** Offer another way to reorder, such as "move up" and "move down" buttons, or a menu that calls the same data update. Do not rely on mouse-only interaction for something users need to do, and announce the result with an `aria-live` region.

Drag and drop pairs with virtual scrolling poorly, because recycled rows interrupt a drag. Prefer pagination for sortable long lists.

## Watch out

- Calling `moveItemInArray` on a signal's array without making a new one.
- Forgetting a keyboard alternative.
- Combining dragging with virtual scrolling on long lists.

## Remember

- The CDK moves the DOM; you update the data from `(cdkDropListDropped)`.
- Copy the array, reorder, and set a new reference.
- Always provide a keyboard way to reorder.
