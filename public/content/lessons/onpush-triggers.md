---
slug: onpush-triggers
title: "What triggers an OnPush check"
topic: performance
kind: concept
summary: "Five reasons Angular will check an OnPush component, and the rule that everything else is skipped."
tags: [performance, onpush, signals, async-pipe]
related: [change-detection-strategies, pitfall-onpush-mutation, mark-for-check, zoneless-and-signals]
---
> **In one line:** An OnPush component is checked only after a new input reference, an event from inside it, an `async` pipe emission, a `markForCheck()` call, or a changed signal.

## The idea

If none of the five reasons occurs, Angular skips the component's view entirely, and does not look at its children either. Learn the list, and OnPush stops being mysterious.

| # | Reason | Notes |
|---|---|---|
| 1 | an input receives a **new reference** | compared with `Object.is`, never deeply; a new primitive counts as new |
| 2 | an **event** fires inside the component or a child | `(click)`, `(input)`, `output()`, `@HostListener`; the ancestors on the path are checked too |
| 3 | an **`async` pipe** emits | the pipe calls `markForCheck()` for you |
| 4 | you call **`markForCheck()`** | for changes from outside Angular's reactivity |
| 5 | a **signal read in the template** changes | the view is registered as a dependent; this is the modern route |

The fifth is the important one for new code. A template that reads `count()` or a `computed()` is re-checked exactly when that signal changes, without `markForCheck()` and without Zone.js.

## See it

```typescript
@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>{{ itemCount() }} items</p>
    <button (click)="add()">Add</button>
  `,
})
export class Cart {
  private readonly items = signal<CartItem[]>([]);
  protected readonly itemCount = computed(() => this.items().length);   // reason 5

  protected add(): void {
    // The click is reason 2; the signal update is reason 5
    this.items.update((list) => [...list, { id: list.length + 1, name: 'Item' }]);
  }
}
```

## Go deeper

Reason 1 hides the common bug. A parent that passes `[user]="user"` and then mutates `user.age++` hands the child the **same reference**, so reason 1 never fires and the child stays stale. The next lesson is about exactly this.

Reason 2 has a side effect that surprises people: when an event fires in a deep child, Angular marks the path back to the root for checking, so OnPush ancestors are *also* checked. That is correct, since the event must be able to reach its handler, but it means OnPush prunes unrelated branches, not the path to the event.

Reason 4 exists for code Angular cannot see: a third-party chart callback, a raw WebSocket handler, code run through `NgZone.runOutsideAngular()`. If you hold such state in a signal instead, you do not need it at all.

Declaring OnPush explicitly still helps for signal-driven components in older projects, since it lets Angular skip unrelated ancestors sooner and documents your intent.

## Watch out

- Expecting an OnPush component to refresh after in-place mutation.
- Assuming OnPush ancestors are skipped when a child's event fires.
- Reaching for `markForCheck()` when a signal would do.

## Remember

- Five triggers: new input reference, inner event, `async` pipe, `markForCheck`, changed signal.
- No trigger means the view and its children are skipped.
- Signals are the modern, automatic trigger.
