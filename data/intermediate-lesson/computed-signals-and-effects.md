---
title: "Computed Signals & Effects in Angular"
level: "intermediate"
estimatedTime: 45
tags:
  - angular
  - signals
  - computed-signals
  - effects
  - reactivity
  - state-management
  - typescript
---

# Computed Signals & Effects in Angular

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what a computed signal is and why it is **lazy** and **memoized**.
- Create derived state with `computed()` instead of manually recalculating values.
- Use `effect()` correctly to synchronize signal state with non-reactive APIs (DOM, `localStorage`, third-party libraries, logging).
- Decide when to reach for `computed()` versus `effect()` versus `linkedSignal()`.
- Recognize and avoid the most common signal-related bugs, such as circular updates and impure computations.

> **Prerequisite:** This lesson assumes you already know the basics of Angular signals — `signal()`, `.set()`, and `.update()`. If you're brand new to signals, skim the [Angular Signals overview](https://angular.dev/guide/signals) first.

---

## Why This Concept Exists

Every non-trivial UI has two kinds of state:

1. **Source state** — data you set directly (a form value, a fetched list, a toggle).
2. **Derived state** — data calculated *from* source state (a filtered list, a total price, a validation message).

Before signals, derived state in Angular was usually handled with getters, `ngOnChanges`, manual recalculation methods, or RxJS operators like `combineLatest`. These approaches share the same weakness: **nothing tells Angular exactly when a derived value actually needs to be recalculated.** Getters re-run on every change detection cycle (even when nothing relevant changed), and manual recalculation is easy to forget in one place after you update state in another.

`computed()` solves this by creating a signal that:

- **Automatically tracks** which signals it depends on.
- **Recalculates only when a dependency actually changes**, not on every check.
- **Caches (memoizes)** its result so repeated reads are cheap.

Once your state is expressed as signals, you eventually need to step *outside* the reactive graph — to write to `localStorage`, update a `<canvas>`, call a third-party charting library, or log analytics. Templates and `computed()` can't do this because they must stay pure. `effect()` exists specifically to bridge signals to that **imperative, non-reactive world**.

---

## Concept Explanation

### Computed signals

A **computed signal** is a read-only signal whose value is derived from other signals using a pure function:

```typescript
const price = signal(25);
const quantity = signal(4);

const total = computed(() => price() * quantity());

console.log(total()); // 100
price.set(30);
console.log(total()); // 120 — recalculated because `price` changed
```

Two properties make `computed()` efficient and safe to use liberally:

- **Lazy evaluation** — the derivation function does not run when you declare the `computed()`. It only runs the first time you *read* the signal (by calling it).
- **Memoization** — after that first read, the result is cached. Reading it again returns the cached value instantly, without re-running the function, until a dependency changes.

This means you can safely put expensive logic (filtering large arrays, formatting, aggregation) inside a `computed()` without worrying about it running needlessly.

**Dependencies are tracked dynamically.** Angular only tracks the signals that were *actually read* during the last execution of the derivation function. If a branch of your logic doesn't read a particular signal this time, that signal isn't a dependency this time — even if it was in a previous run.

```typescript
const showTotal = signal(true);
const total = signal(0);

const summary = computed(() =>
  showTotal() ? `Total: ${total()}` : 'Hidden'
);
```

If `showTotal` is `false`, changing `total` will **not** recompute `summary`, because `total` wasn't read on the last execution.

A computed signal is **not writable** — calling `.set()` or `.update()` on it is a compile-time error. Its only source of truth is its derivation function.

### Effects

An **effect** is an operation that re-runs whenever one or more signals it reads change value:

```typescript
effect(() => {
  console.log(`The current count is: ${count()}`);
});
```

Key behavioral rules:

- Effects **always run at least once**, immediately after being created.
- Like `computed()`, effects track dependencies **dynamically**, based on the signals read during the most recent run.
- Effects run **asynchronously**, as part of Angular's change-detection process — not synchronously the instant a signal changes.
- By default, `effect()` must be called within an **injection context** (typically a component, directive, or service constructor), because Angular needs to tie the effect's lifecycle to something.

```typescript
@Component({ /* ... */ })
export class EffectiveCounter {
  readonly count = signal(0);

  constructor() {
    effect(() => {
      console.log(`The count is: ${this.count()}`);
    });
  }
}
```

If you need to create an effect outside a constructor, pass an explicit `Injector`:

```typescript
private injector = inject(Injector);

initializeLogging(): void {
  effect(
    () => console.log(`The count is: ${this.count()}`),
    { injector: this.injector },
  );
}
```

Effects are automatically destroyed when their owning component, directive, or (for root-level effects) the application is destroyed — you rarely need to manage this manually.

### The most important rule: `computed()` first, `effect()` last

The Angular team is explicit about this: **effects should be the last API you reach for.** If you find yourself using `effect()` to copy a value from one signal into another, that's a sign the derived value should be a `computed()` instead. Using effects to propagate state between signals can cause `ExpressionChangedAfterItHasBeenChecked` errors, unnecessary change-detection cycles, or even circular updates.

Reach for `effect()` only when you need to synchronize signal state with something **outside** Angular's reactivity system:

- Logging signal values for analytics or debugging.
- Keeping data in sync with `localStorage`, `sessionStorage`, or cookies.
- Adding custom DOM behavior that template syntax can't express.
- Driving a third-party UI library or `<canvas>` rendering.

For DOM writes specifically, prefer `afterRenderEffect()` (covered briefly below), since `effect()` runs *before* Angular commits changes to the DOM.

---

## Key Terminology

| Term | Meaning |
|---|---|
| **Signal** | A wrapper around a value that notifies consumers when it changes. |
| **`WritableSignal`** | A signal created with `signal()`, with `.set()` and `.update()` methods. |
| **`computed()`** | Creates a read-only signal derived from other signals; lazy and memoized. |
| **`effect()`** | Registers a function that re-runs whenever its signal dependencies change; used for side effects. |
| **Reactive context** | The runtime state where Angular tracks which signals are read (inside `computed`, `effect`, `linkedSignal`, or a component template). |
| **Producer / Consumer** | A signal being read is a *producer*; the code reading it (a `computed`, `effect`, or template) is a *consumer*. |
| **Memoization** | Caching a computed value so it's only recalculated when a dependency actually changes. |
| **`untracked()`** | Reads a signal's value *without* registering it as a dependency of the current reactive context. |
| **`onCleanup`** | An optional callback parameter inside an effect used to cancel timers/operations before the next run or on destroy. |
| **`EffectRef`** | The object returned by `effect()`, exposing a `.destroy()` method for manual cleanup. |
| **`linkedSignal()`** | A related API for state that is *usually* derived but can also be manually overwritten (a hybrid of `signal` and `computed`). |
| **`afterRenderEffect()`** | Like `effect()`, but runs after Angular has committed changes to the DOM — the right tool for DOM reads/writes. |

---

## Syntax Overview

```typescript
import { signal, computed, effect, untracked, Injector, inject } from '@angular/core';

// 1. Basic computed signal
const count = signal(0);
const doubleCount = computed(() => count() * 2);

// 2. Basic effect (inside a constructor / injection context)
effect(() => {
  console.log(`Count changed to ${count()}`);
});

// 3. Effect with a cleanup function (runs before the next execution or on destroy)
effect((onCleanup) => {
  const timer = setTimeout(() => console.log('tick'), 1000);
  onCleanup(() => clearTimeout(timer));
});

// 4. Reading a signal without tracking it as a dependency
effect(() => {
  console.log(`User: ${user()}, count (untracked): ${untracked(count)}`);
});

// 5. Creating an effect outside a constructor, with an explicit Injector
const injector = inject(Injector);
effect(() => console.log(count()), { injector });
```

A few syntax notes:

- `computed()` and `effect()` both take a single function; `computed()`'s function **must return a value and stay pure** (no writes, no side effects). `effect()`'s function returns nothing and *is* the side effect.
- Calling a signal — `count()` — both reads its value **and** registers it as a dependency when done inside a reactive context.
- `effect()` accepts an optional second argument, an options object (`{ injector, manualCleanup }`), for advanced control.

---

## Real World Analogy

Think of a **spreadsheet**:

- A `signal()` is a plain cell you type a value into, like `A1 = 10`.
- A `computed()` is a formula cell, like `B1 = A1 * 2`. It doesn't recalculate every second — it only updates when `A1` changes, and if you never look at `B1`, the spreadsheet doesn't even bother computing it until you scroll to it. That's laziness and memoization.
- An `effect()` is like a **notification rule** you set up: "email me whenever `B1` goes above 100." That action lives *outside* the grid of formulas — it doesn't produce a cell value, it reacts to one and does something in the real world (send an email, save a file, ring a bell). You wouldn't want every formula cell to also send emails; that's why side effects are kept separate from derived values.

---

## Examples

### 1. Basic Example — Derived Counter State

A minimal standalone component showing lazy, memoized derivation with `computed()`.

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <section>
      <p>Count: {{ count() }}</p>
      <p>Doubled: {{ doubled() }}</p>
      <p>Parity: {{ parity() }}</p>
      <button (click)="increment()">+1</button>
      <button (click)="decrement()">-1</button>
    </section>
  `,
})
export class CounterComponent {
  // Source state
  readonly count = signal(0);

  // Derived state: recalculates only when `count` changes,
  // and only if `doubled()` is actually read somewhere (e.g. the template).
  readonly doubled = computed(() => this.count() * 2);

  readonly parity = computed(() => (this.count() % 2 === 0 ? 'even' : 'odd'));

  increment(): void {
    this.count.update((value) => value + 1);
  }

  decrement(): void {
    this.count.update((value) => value - 1);
  }
}
```

**Why this is good practice:** `doubled` and `parity` never need to be manually kept in sync with `count` — there's no risk of them going stale, because they're recalculated automatically whenever `count` changes and re-read.

---

### 2. Real-World Example — Shopping Cart Totals

A chain of computed signals derives a subtotal, tax, and total from a list of cart items — a very common UI pattern.

```typescript
import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <ul>
      @for (item of items(); track item.id) {
        <li>{{ item.name }} — {{ item.quantity }} × {{ item.price | currency }}</li>
      }
    </ul>

    <p>Subtotal: {{ subtotal() | currency }}</p>
    <p>Tax (8%): {{ tax() | currency }}</p>
    <p><strong>Total: {{ total() | currency }}</strong></p>
  `,
})
export class CartSummaryComponent {
  readonly items = signal<CartItem[]>([
    { id: 'a1', name: 'Keyboard', price: 89.99, quantity: 1 },
    { id: 'a2', name: 'Mouse', price: 29.99, quantity: 2 },
  ]);

  // Computed signals can depend on other computed signals, forming a chain:
  // total -> tax -> subtotal -> items
  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  readonly tax = computed(() => this.subtotal() * 0.08);

  readonly total = computed(() => this.subtotal() + this.tax());

  updateQuantity(id: string, quantity: number): void {
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }
}
```

**Why this is good practice:** Updating `quantity` in one place (`updateQuantity`) automatically ripples through `subtotal`, `tax`, and `total` — there's exactly one source of truth (`items`), and zero manual recalculation code.

---

### 3. Best-Practice Example — Syncing State to `localStorage` with `effect()`

This example shows the *correct* use case for `effect()` (syncing to a non-reactive browser API), including a cleanup function, and contrasts it with the anti-pattern of using `effect()` for derived state.

```typescript
import { Component, signal, computed, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button (click)="toggleTheme()">Switch to {{ nextThemeLabel() }} mode</button>
    <p>Current theme: {{ theme() }}</p>
  `,
})
export class ThemeToggleComponent {
  private readonly storageKey = 'preferred-theme';

  // Source state, initialized from a non-reactive API (localStorage)
  readonly theme = signal<Theme>(
    (localStorage.getItem(this.storageKey) as Theme | null) ?? 'light',
  );

  // ✅ Derived value: use computed(), not effect()
  readonly nextThemeLabel = computed(() => (this.theme() === 'light' ? 'dark' : 'light'));

  constructor() {
    // ✅ Appropriate use of effect(): syncing signal state to an
    // imperative, non-reactive API (localStorage + DOM attribute).
    effect((onCleanup) => {
      const currentTheme = this.theme();
      localStorage.setItem(this.storageKey, currentTheme);
      document.body.setAttribute('data-theme', currentTheme);

      // If this effect kicked off something cancellable, we'd clean it up here.
      onCleanup(() => {
        // e.g. cancel an in-flight animation tied to the previous theme
      });
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }
}
```

Compare that to the anti-pattern it avoids:

```typescript
// ❌ Anti-pattern: using effect() to keep one signal in sync with others.
// This can cause extra change-detection cycles and is harder to reason about.
readonly firstName = signal('Ada');
readonly lastName = signal('Lovelace');
readonly fullName = signal('');

constructor() {
  effect(() => {
    this.fullName.set(`${this.firstName()} ${this.lastName()}`);
  });
}
```

```typescript
// ✅ Fix: derive it directly with computed()
readonly fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
```

**Why this is good practice:** `effect()` is reserved for the one thing `computed()` can't do — reaching outside the reactive graph into `localStorage` and the DOM. Everything that stays *inside* the graph (`fullName`) uses `computed()`.

---

## Common Mistakes

1. **Using `effect()` to derive state instead of `computed()`.**
   Copying a value from one signal to another inside an `effect()` is almost always wrong — it can trigger `ExpressionChangedAfterItHasBeenChecked` errors or unnecessary re-renders. Use `computed()` for any value that's "just a formula" of other signals.

2. **Writing side effects inside `computed()`.**
   A computed derivation function must be **pure** — no `console.log` calls with intent to mutate state, no HTTP calls, no writing to other signals. Angular may call your computed function more or fewer times than you expect (due to laziness), so side effects there are unreliable and considered a bug.

3. **Calling `effect()` outside an injection context.**
   `effect()` needs to be created inside a constructor (or given an explicit `Injector` via the options object). Calling it from an arbitrary method without an injector throws a runtime error.

4. **Forgetting to clean up long-running work started inside an effect.**
   Timers, subscriptions, or animations started in an `effect()` should be cancelled using the `onCleanup` callback, otherwise they can pile up across re-runs.

5. **Expecting `computed()` to run eagerly.**
   A `computed()` signal's function doesn't run when it's declared — only the first time it's *read*. If you never read it, it never runs. This surprises developers coming from `combineLatest` or manual "recalculate on every change" patterns.

6. **Not realizing dependencies are dynamic.**
   If a signal is only read inside a conditional branch, it's only a dependency when that branch executes. Changing that signal while the other branch was last taken will *not* trigger a recompute — this is correct behavior, but can look like a bug if you're not aware of it.

---

## Best Practices

- **Default to `computed()`** for any value that can be expressed as a pure function of other signals.
- **Reserve `effect()`** for syncing signals to non-reactive, imperative APIs: `localStorage`, logging, third-party libraries, custom DOM behavior.
- **Keep computed functions pure** — read signals, return a value, nothing else.
- Use **`untracked()`** when an effect or computed needs to read a signal without treating it as a dependency (e.g., reading a logging service's incidental signal).
- **Clean up effects** that start timers, subscriptions, or async work, using the `onCleanup` parameter.
- For **DOM writes**, prefer `afterRenderEffect()` over `effect()`, since `effect()` runs before Angular commits DOM changes. For DOM *observation* (size, mutation, visibility), prefer native `ResizeObserver`/`MutationObserver`/`IntersectionObserver` over effects entirely.
- Provide a **custom equality function** (`{ equal: ... }`) to `signal()` or `computed()` when working with objects/arrays that are semantically equal but not referentially equal, to avoid unnecessary recomputation.
- If you need state that is *usually* derived but occasionally needs manual overriding (e.g., a form field pre-filled from a computed default but user-editable), reach for **`linkedSignal()`** instead of faking it with an effect.
- Keep effect bodies small; if logic grows complex, extract it into a well-named method or move the derivation into a `computed()`.

---

## Summary

- A **computed signal** (`computed()`) is a read-only signal that derives its value from other signals.
- Computed signals are **lazy** (they don't run until read) and **memoized** (cached until a dependency changes).
- Computed signal dependencies are tracked **dynamically** — only the signals actually read in the last execution count.
- An **effect** (`effect()`) re-runs whenever its signal dependencies change, runs **at least once**, and executes **asynchronously** during change detection.
- `effect()` requires an **injection context** by default, or an explicit `Injector` passed via options.
- **Prefer `computed()` over `effect()`** for anything that's just derived data; using effects to propagate state is an anti-pattern.
- Use `effect()` only to bridge signals to **non-reactive APIs** like `localStorage`, DOM attributes, or third-party libraries.
- Use the **`onCleanup`** callback inside effects to cancel timers or in-flight work between runs.
- For DOM reads/writes specifically, prefer **`afterRenderEffect()`** over `effect()`.

---

## Flash Cards

**Q: What makes `computed()` efficient compared to a plain getter?**
A: It's lazy (doesn't run until read) and memoized (caches its result until a dependency changes), so repeated reads and unrelated change-detection cycles don't trigger recalculation.

**Q: How many times does an `effect()` run when it is first created?**
A: At least once — effects always execute immediately upon creation, then again whenever a tracked dependency changes.

**Q: Why shouldn't you use `effect()` to copy a value from one signal to another?**
A: It's a state-derivation anti-pattern that can cause `ExpressionChangedAfterItHasBeenChecked` errors, extra change-detection cycles, or circular updates — `computed()` is the correct tool for derived state.

**Q: Where can you call `effect()` by default, and how do you call it elsewhere?**
A: By default, `effect()` must be called within an injection context, such as a component/service constructor. To call it elsewhere, pass an explicit `Injector` via the options object: `effect(fn, { injector })`.

**Q: What is `untracked()` used for?**
A: It lets you read a signal's value inside a reactive context (like `effect()` or `computed()`) without registering that signal as a dependency.

---

## Exercises

### Easy

Create a standalone component with two writable signals, `firstName` and `lastName`, and a `computed()` signal called `fullName` that joins them with a space. Display `fullName()` in the template, and add two text inputs bound to `firstName` and `lastName` so the full name updates as the user types.

### Medium

Build on the shopping cart example from this lesson. Add a `discountCode` signal (a string) and a `discountPercent` computed signal that returns `10` if `discountCode() === 'SAVE10'`, otherwise `0`. Then add a `total` computed signal that applies the discount percentage to the subtotal *before* tax is calculated. Make sure `total` stays correct no matter what order `items` or `discountCode` change in.

### Challenging

Create a `RecentSearches` component that:

1. Keeps a `searchTerm` writable signal and a `history` writable signal (an array of strings, most recent first, max 5 entries).
2. Uses an `effect()` to persist `history` to `localStorage` every time it changes (with an appropriate cleanup strategy if you debounce the writes with `setTimeout`).
3. Uses a `computed()` signal called `hasHistory` that returns whether `history()` is non-empty.
4. On component creation, initializes `history` by reading from `localStorage` (outside the effect, since this is a one-time read, not a reactive derivation).

Reflect: which parts of this component *had* to use `effect()`, and which parts would have been a mistake to implement with `effect()` instead of `computed()`? Write one sentence justifying each choice.

---

## Further Reading

- [Angular Signals — Overview](https://angular.dev/guide/signals) — official guide covering writable and computed signals, reactive contexts, and `untracked()`.
- [Side effects for non-reactive APIs (`effect()`)](https://angular.dev/guide/signals/effect) — official guide on effect use cases, injection context, cleanup functions, and `afterRenderEffect()`.
- [Dependent state with `linkedSignal`](https://angular.dev/guide/signals/linked-signal) — for state that is usually derived but sometimes needs manual overrides.
- [Async reactivity with resources](https://angular.dev/guide/signals/resource) — for incorporating asynchronous data (like HTTP calls) into signal-based code.
- [RxJS interop with Angular signals](https://angular.dev/ecosystem/rxjs-interop) — for converting between Observables and signals in existing RxJS-based codebases.
