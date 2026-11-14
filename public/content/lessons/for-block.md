---
slug: for-block
title: "@for and @empty"
topic: templates
kind: api
summary: "Repeat a block once per item in a list, with a required track expression and an empty state."
tags: [templates, control-flow, lists]
related: [track-expressions, for-context-variables, if-block, pitfall-mutating-signal-array]
since: "18"
---
> **In one line:** `@for (item of items(); track item.id) { … }` repeats a block per item. `track` is required, and `@empty` renders when the list has no items.

## The idea

`@for` loops over any iterable: arrays, sets, anything you can iterate. It is the control-flow block for "once per item", and two things set it apart from the old `*ngFor`:

- **`track` is part of the syntax.** The template will not compile without it, so you cannot forget the identity of each item. (With `*ngFor` it was a separate `trackBy` function that people skipped, and lists updated slowly and buggily as a result.)
- **`@empty` is built in.** One extra block covers the zero-items case, so an empty list never looks like a bug.

Like the other control-flow blocks, `@for` needs no import and reads naturally with signals: call the signal in the loop header.

```html
<!-- Before: *ngFor, needs CommonModule and a separate trackBy -->
<li *ngFor="let p of products; trackBy: trackById">{{ p.name }}</li>

<!-- After: @for, built in, and track is part of the syntax -->
@for (p of products(); track p.id) {
  <li>{{ p.name }}</li>
} @empty {
  <li>No products yet.</li>
}
```

## See it

```typescript
@Component({
  selector: 'app-product-list',
  template: `
    <ul>
      @for (p of products(); track p.id) {
        <li>
          {{ p.name }}
          @if (!p.inStock) { <em>Sold out</em> }
        </li>
      } @empty {
        <li>No products available right now.</li>
      }
    </ul>
  `,
})
export class ProductList {
  protected readonly products = signal([
    { id: 1, name: 'Keyboard', inStock: true },
    { id: 2, name: 'Mouse', inStock: false },
  ]);
}
```

Blocks nest freely, as the `@if` inside the loop shows. Each product gets its own sold-out badge.

## Go deeper

`track` is what makes list updates cheap. When the list changes, Angular uses the tracked value to match new items with existing ones, reusing their DOM nodes instead of rebuilding the lot. The choice of expression matters, so it has its own lesson, "Choosing a track expression".

Inside the block you also get position variables like `$index` and `$last`, covered in "@for context variables".

## Watch out

- Without `@empty`, an empty list renders nothing and looks broken. Add a friendly message.
- Which expression you track by matters for correctness and speed. See "Choosing a track expression".
- Updating the list in place (`push`) will not refresh a signal-backed list. Replace the array, as in "Pitfall: mutating a signal's array".

## Remember

- `@for (x of xs; track x.id)` needs `track`; it will not compile without it.
- `@empty` renders when the collection has zero items.
- Read a signal list by calling it: `@for (x of items(); …)`.
