---
slug: signal
title: "signal()"
topic: signals
kind: api
summary: "A writable container for a value that Angular can watch; read it by calling it."
tags: [signals, state, reactivity]
related: [computed, effect, signals-in-templates, pitfall-mutating-signal-array]
since: "17"
---
> **In one line:** `signal(initial)` holds a value. Call it like a function to read it, and use `.set()` or `.update()` to change it.

## The idea

A **signal** wraps a value and notifies Angular whenever that value changes. It is a *getter function*: you read the current value by calling it with parentheses.

Think of a spreadsheet cell. `A1 = 10` is a cell you type a number into; other cells and charts can refer to it, and when you change `A1` they all follow. A signal is that cell, living in your component.

Calling `count()` does two things. It returns the value, and it records "whoever is running right now depends on this signal". That recorded dependency is what lets templates, `computed()` and `effect()` update on their own, without you wiring anything up.

Why not a plain class field? Angular cannot tell when a plain field changes, so it has to re-check the whole tree to find out. A signal announces its own changes, which is what makes precise, cheap updates possible.

You change a writable signal in one of two ways:

| Method | Use it when | Example |
|---|---|---|
| `.set(value)` | you already know the next value | `count.set(5)` |
| `.update(fn)` | the next value depends on the current one | `count.update(n => n + 1)` |

There is no `.mutate()`. Signals treat their value as immutable, so you always hand over a *new* value.

## See it

```typescript
import { signal } from '@angular/core';

const count = signal(0);     // WritableSignal<number>

console.log(count());        // 0   <- parentheses read the value
count.set(5);                // replace the value
count.update(n => n + 1);    // derive the next value from the current one
console.log(count());        // 6
```

In a component, the template reads the signal and an event handler writes to it:

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="count.update(n => n + 1)">
      Clicked {{ count() }} times
    </button>
  `,
})
export class Counter {
  protected readonly count = signal(0);
}
```

## Go deeper

Angular infers the type from the initial value, so `signal(0)` is a `WritableSignal<number>`. When the value can be several things, say so with a generic, because an initial `null` alone would type the signal as `null` only:

```typescript
const user = signal<User | null>(null);   // WritableSignal<User | null>
user.set({ name: 'Ada' });                // allowed
```

Declare signals as `readonly` class fields. You change what is *inside* the signal; the field itself should never point at a different signal.

Setting a signal to the value it already holds is a no-op. Angular compares the old and new value with `Object.is` and notifies nobody, so repeated `.set(5)` calls cost nothing and cause no extra re-render. The flip side shows up with arrays and objects: a *different* object with identical contents counts as a change, which is why updates should build new values deliberately.

When you want to share a signal without letting others change it, see "Read-only signals: asReadonly()".

## Watch out

- `count` is the signal itself and `count()` is its value. `if (count > 0)` is always a bug, and `{{ count }}` renders the signal object instead of the number.
- Objects and arrays inside a signal must be replaced, not edited in place, or nothing updates.
- There is no `.mutate()`. If you are looking for it, you want `.update()` returning a new value.

## Remember

- A signal is a function: `count()` reads, `.set()` and `.update()` write.
- Reach for `.update()` when the new value depends on the old one.
- Treat the value as immutable: replace objects and arrays, never mutate them.
