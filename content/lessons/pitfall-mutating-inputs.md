---
slug: pitfall-mutating-inputs
title: "Pitfall: mutating an input"
topic: components
kind: pitfall
summary: "Editing an object a parent passed in changes the parent's data behind its back; emit an event instead."
tags: [components, inputs, immutability, data-flow]
related: [input, output, smart-and-presentational, pitfall-mutating-signal-array]
---
> **In one line:** An input belongs to the parent. If the child edits the object it received, the parent's data changes without the parent knowing. Describe the change in an event and let the owner apply it.

## The idea

An `input()` is a read-only signal, so `entry.set(...)` does not exist, and that seems to protect you. It does not protect the *object inside*. The child holds a reference to the very same object the parent holds, so `this.entry().reps++` quietly edits the parent's data.

The damage is two-fold. State now changes from two places, so nobody can tell which one broke it. And `OnPush` parents, plus signals, decide to re-render by comparing references, which did not change, so the screen may not update at all.

The fix keeps the one-way flow: the child says *what should change*, the owner changes it, and the new data flows back down.

| The child wants to... | It should... |
|---|---|
| bump a counter | emit the new value or the intent |
| edit a field | emit a copy with the change |
| delete the item | emit the item's id |

## See it

```typescript
export class EntryItem {
  readonly entry = input.required<ExerciseSet>();
  readonly changed = output<ExerciseSet>();

  protected addRep(): void {
    // Before: this.entry().reps++   (edits the parent's object behind its back)

    // After: describe the change, and let the owner apply it
    const current = this.entry();
    this.changed.emit({ ...current, reps: current.reps + 1 });
  }
}
```

```typescript
// The smart parent applies it, immutably
protected save(updated: ExerciseSet): void {
  this.entries.update(list => list.map(e => (e.id === updated.id ? updated : e)));
}
```

Only the parent ever writes to `entries`, and it always writes a **new** array, so every reader is notified.

## Go deeper

The same rule covers arrays handed in as inputs. `list.push(x)` inside the child, or inside a `signal.update()` that returns the same array, keeps the reference, so nothing downstream notices. Return a new array: `[...list, x]`, `filter`, `map`.

You can prove a component respects this in its unit test:

```typescript
fixture.componentRef.setInput('entry', original);
fixture.componentInstance.changed.subscribe(v => (emitted = v));
fixture.nativeElement.querySelector('[data-testid="add-rep"]').click();

expect(emitted?.reps).toBe(11);
expect(original.reps).toBe(10);   // the input was not mutated
```

## Watch out

- Writing `this.input().field = x` or `this.input().list.push(x)`. It compiles, because only the signal is read-only, not what it holds.
- Mutating arrays in place inside `update()` and returning the same array. Signals and `OnPush` compare references.
- Emitting the same mutable object you received and then editing it later. Emit a copy so the parent gets a stable value.

## Remember

- An input is read-only as a signal, but the object inside is still the parent's.
- Describe changes with an output and let the owner apply them, creating new objects and arrays.
- A test that checks the original input is unchanged proves the component is safe.
