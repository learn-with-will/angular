---
slug: pitfall-onpush-mutation
title: "Pitfall: mutating under OnPush"
topic: performance
kind: pitfall
summary: "Changing an object in place keeps its reference, so an OnPush child never sees the update."
tags: [performance, onpush, immutability, bugs]
related: [onpush-triggers, change-detection-strategies, zoneless-and-signals, mark-for-check]
---
> **In one line:** OnPush compares inputs by reference. Mutating the same object leaves the reference unchanged, so the UI silently goes stale.

## The idea

This is the bug that makes OnPush feel broken. The fix is never to abandon OnPush; it is to stop mutating.

A parent passes an object to a child. The user clicks "birthday", and the parent changes `user.age`. The child receives no new reference, so by trigger 1 there is no reason to check it, and the DOM keeps the old age. Replace the object and the reference changes, so Angular checks the child.

| You write | Reference | OnPush child updates? |
|---|---|---|
| `this.user.age++` | same | **no** |
| `this.user = { ...this.user, age: this.user.age + 1 }` | new | yes |
| `this.items.push(x)` | same | **no** |
| `this.items = [...this.items, x]` | new | yes |
| `this.items.update((l) => [...l, x])` (signal) | new | yes |

## See it

```typescript
// Before: same reference, so the OnPush child never sees the change
mutateUser(): void {
  this.user.age++;
}

// After: a brand-new object, so Angular detects the new input
replaceUser(): void {
  this.user = { ...this.user, age: this.user.age + 1 };
}
```

```typescript
@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h3>{{ user().name }}</h3><p>Age: {{ user().age }}</p>`,
})
export class UserCard {
  readonly user = input.required<User>();
}
```

## Go deeper

The opposite mistake wastes the work OnPush saves. Passing `{ ...sameData }` on every parent render creates a *new* reference with identical content, so the child is re-checked each time even though nothing changed. Build derived objects once, in a `computed()`, so the reference only changes when the data does.

Make immutability a **project-wide convention**, not a per-component decision. Use `readonly` types, spread, and array methods that return new arrays (`map`, `filter`, `concat`) instead of mutators (`push`, `splice`, `sort`). A single mutating service can quietly break several OnPush components downstream.

Signals make the bug structurally hard to write. `signal.update()` with an immutable transformation always produces a new value, and reading it in a template registers the dependency. `sort()` is a classic trap: it sorts in place, so call it on a copy, `[...list].sort(...)`, or use `toSorted()`.

## Watch out

- `push`, `splice` and `sort` on arrays passed to OnPush children.
- Creating a new object on every render, defeating the optimisation.
- Mutating in a service and expecting every component to notice.

## Remember

- OnPush compares input references, not contents.
- Replace, never mutate: spread, `map`, `filter`, `signal.update()`.
- Make immutability a convention for the whole project.
