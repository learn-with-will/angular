---
id: lesson-03
slug: data-binding-and-signals
title: Data Binding & Signals
level: beginner
order: 3
duration: 25
tags:
  - signals
  - binding
  - reactivity
---

# Learning Objectives

- Use interpolation, property binding, and event binding.
- Create reactive state with `signal()`.
- Derive state with `computed()` and react with `effect()`.

# Why This Concept Exists

UIs must stay in sync with data. **Data binding** connects your template to your
class so the screen updates when data changes. **Signals** are Angular's modern,
fine-grained reactivity primitive: they make that synchronisation explicit and
efficient.

# Concept Explanation

There are three everyday bindings:

- **Interpolation** — `{{ value }}` puts data into text.
- **Property binding** — `[disabled]="isBusy()"` sets DOM/component properties.
- **Event binding** — `(click)="save()"` runs a method on an event.

A **signal** is a wrapper around a value. You read it by calling it (`count()`) and
write it with `.set()` or `.update()`. Anything that reads a signal re-runs when it
changes.

# Syntax

```typescript
import { signal, computed } from '@angular/core';

const count = signal(0);
count();              // read -> 0
count.set(5);         // write
count.update(n => n + 1);

const doubled = computed(() => count() * 2); // derived, read-only
```

# Real World Analogy

A signal is a **spreadsheet cell**. When you change cell A1, every formula that
references A1 recalculates automatically. `computed()` is exactly such a formula
cell.

# Code Examples

A counter wiring together all three bindings plus signals:

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }} (doubled: {{ doubled() }})</p>
    <button [disabled]="count() >= 10" (click)="inc()">+1</button>
  `,
})
export class Counter {
  protected readonly count = signal(0);
  protected readonly doubled = computed(() => this.count() * 2);

  inc() {
    this.count.update((n) => n + 1);
  }
}
```

# Common Mistakes

- Reading a signal without calling it: `{{ count }}` instead of `{{ count() }}`.
- Mutating objects inside a signal instead of calling `.set()`/`.update()`.
- Putting side effects in `computed()` — use `effect()` for those.

# Best Practices

- Prefer `computed()` over recalculating values in methods.
- Keep signals private and expose `asReadonly()` where appropriate.
- Reserve `effect()` for synchronising with the outside world (DOM, storage).

# Summary

Bindings connect template and class; signals make state reactive. Read with `()`,
write with `set`/`update`, derive with `computed`, and react with `effect`.

# Flash Cards

- **Q:** How do you read a signal's value? **A:** call it, e.g. `count()`
- **Q:** What creates derived, read-only state? **A:** `computed()`
- **Q:** Which binding handles a click? **A:** event binding `(click)`

# Exercises

1. Build a temperature signal in Celsius and a `computed` Fahrenheit value.
2. Disable a button with property binding when an input signal is empty.
3. Use `effect()` to log the count every time it changes.
