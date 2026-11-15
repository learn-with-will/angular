---
slug: projection-fallback-content
title: "ng-content fallback content"
topic: components
kind: technique
summary: "Show default markup in a slot only when the parent projects nothing into it."
tags: [components, projection, defaults, ng-content]
related: [content-projection, multi-slot-projection, pitfall-ng-content-in-if]
since: "18"
---
> **In one line:** Markup placed *inside* `<ng-content>` is fallback content: it renders only when the parent projected nothing into that slot.

## The idea

A reusable component should look sensible even when the caller supplies nothing. A display frame in a shop ships with a sample photo so it never looks empty, and that sample vanishes when you put your own in. Since Angular 18, `<ng-content>` works the same way.

A modal's footer slot can hold a Close button between its `<ng-content>` tags, as shown below. If the parent does not project a `modal-footer`, the Close button appears. If it does, the parent's footer replaces it. Before this existed you had to check whether content was provided with a content query, which was much more code.

The detail that surprises people is *when* the fallback is decided: once, when the slot is created. It appears only if **nothing at all** was projected into it.

## See it

```typescript
@Component({
  selector: 'app-modal',
  template: `
    <section><ng-content /></section>
    <footer>
      <ng-content select="[modal-footer]">
        <button type="button" (click)="closed.emit()">Close</button>
      </ng-content>
    </footer>
  `,
})
export class Modal {
  readonly closed = output<void>();
}
```

```html
<!-- No footer passed: the Close button shows -->
<app-modal><p>Saved.</p></app-modal>

<!-- Footer passed: it replaces the fallback -->
<app-modal>
  <p>Delete this?</p>
  <div modal-footer><button type="button">Delete</button></div>
</app-modal>
```

## Go deeper

An `@if` block counts as projected content even when its condition is false. So this does *not* fall back to the Close button when `canDelete()` is false. The slot received something, a block that rendered nothing, so the footer stays empty:

```html
<!-- Before: the @if is the projected content, so there is no fallback -->
@if (canDelete()) {
  <div modal-footer>…</div>
}

<!-- After: always project the element, and put the condition inside it -->
<div modal-footer>
  @if (canDelete()) { <button type="button">Delete</button> } @else { <button type="button">Close</button> }
</div>
```

Use fallback for "the caller passed nothing", and use conditions *inside* a projected element for "the caller passed something that varies".

## Watch out

- Expecting the fallback to appear when a projected `@if` is false. The `@if` counts as content, so wrap the condition in an always-present element.
- Expecting fallback to fill in around partial content. It is all or nothing: one projected node in the slot means no fallback at all.
- Relying on fallback in Angular versions before 18. It does not exist there.

## Remember

- Content inside `<ng-content>` is fallback, shown only if nothing was projected into that slot.
- An `@if` in the parent counts as projected content even when it renders nothing.
- Put conditions inside a projected element, not around it.
