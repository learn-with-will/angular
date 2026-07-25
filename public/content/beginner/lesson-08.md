---
id: lesson-08
slug: introduction-to-signals
title: "Introduction to Signals"
level: beginner
order: 4
duration: 30
tags:
  - signals
  - reactivity
  - state-management
  - change-detection
---


# Learning Objectives

After completing this lesson, you will be able to:

- Explain what an Angular **signal** is and why signals exist.
- Create and read a writable signal, and update it with `.set()` and `.update()`.
- Derive new values with `computed()` and run side effects with `effect()`.
- Read signals correctly inside component templates and TypeScript code.
- Apply the recommended pattern for exposing signal-based state safely from a service.

# Why This Concept Exists

Every UI framework needs an answer to one question: *when a piece of state changes, how do we update only the parts of the screen that depend on it?*

For most of Angular's history, the answer was **Zone.js**. Zone.js patched browser APIs (timers, events, HTTP) and, after almost any async event, told Angular to re-check the entire component tree to see what might have changed. This worked, but it was coarse: Angular often re-evaluated parts of the page that had not actually changed, and it could be hard to reason about *why* something updated.

Signals provide **fine-grained reactivity**. A signal knows exactly which parts of your template and which computations read its value. When the value changes, Angular updates *only* those consumers, no full-tree checking required. This is faster, more predictable, and it is the foundation for **zoneless** Angular (running without Zone.js), which is the default for new projects in Angular 20+ together with `OnPush` change detection.

The Signals API has been stable since Angular 20 and is the recommended way to manage reactive state in modern Angular (the current stable release is Angular 22).

# Concept Explanation

A **signal** is a wrapper around a value that notifies interested consumers whenever that value changes.

There are three core pieces to learn:

### 1. Writable signals — `signal()`

You create a writable signal by calling `signal()` with an initial value. A signal is a **getter function**: you read its current value by *calling it* with parentheses.

```typescript
import { signal } from '@angular/core';

const count = signal(0);

console.log(count());     // reads the value -> 0
```

Calling `count()` does two things: it returns the current value, and it tells Angular "whoever is running right now depends on this signal." That dependency tracking is what makes everything else work automatically.

You change a writable signal in one of two ways:

```typescript
count.set(5);                      // replace the value directly
count.update(value => value + 1);  // compute the next value from the current one -> 6
```

> Note: there is **no `.mutate()`** method. Signals treat their value as immutable, you always provide a *new* value. (More on this in Common Mistakes.)

### 2. Derived values — `computed()`

A `computed()` signal calculates its value from other signals. It is **read-only** (you cannot `.set()` it) and it recalculates automatically when any signal it reads changes.

```typescript
import { signal, computed } from '@angular/core';

const count = signal(2);
const doubled = computed(() => count() * 2);

console.log(doubled()); // 4
count.set(10);
console.log(doubled()); // 20 — recalculated automatically
```

Two important behaviors:

- **Lazy**: the calculation does not run until you first read `doubled()`.
- **Memoized (cached)**: the result is cached and only recalculated when a signal it depends on actually changes. This means expensive derivations (filtering, sorting) are safe to put in a `computed()`.

### 3. Side effects — `effect()`

An `effect()` runs a block of code when it is first created and again whenever any signal it reads changes. Effects are for **side effects** that reach outside Angular's state, such as logging, syncing to `localStorage`, or integrating with a non-Angular library.

```typescript
import { signal, effect } from '@angular/core';

const count = signal(0);

effect(() => {
  console.log(`Count changed to: ${count()}`);
});
// Logs "Count changed to: 0" immediately, then again on every change.
```

Effects must be created in an **injection context** (typically a component/service constructor or a class field initializer) so Angular can clean them up automatically when the component is destroyed.

A key rule: **use `computed()` to derive state, and reserve `effect()` for genuine side effects.** Effects are not the right tool for keeping one piece of state in sync with another.

### Signals in templates

In a template, you read a signal exactly the same way: by calling it.

```html
<p>{{ count() }}</p>
@if (count() > 5) {
  <p>That's a lot!</p>
}
```

Because the template reads `count()`, Angular tracks the dependency and re-renders that expression precisely when `count` changes.

### A quick look ahead: signal inputs

Modern Angular also lets component **inputs** be signals, replacing the older `@Input()` decorator:

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `<p>Hello, {{ name() }}!</p>`,
})
export class Greeting {
  // A signal input — read it like any other signal with name()
  readonly name = input.required<string>();
}
```

You will explore signal inputs, `model()` for two-way binding, and async data with `resource()`/`httpResource()` in later lessons. This lesson focuses on the core trio: `signal`, `computed`, and `effect`.

# Key Terminology

- **Signal**: a reactive wrapper around a value that notifies consumers when the value changes. Read it by calling it: `mySignal()`.
- **Writable signal (`WritableSignal<T>`)**: a signal you can change with `.set()` and `.update()`. Created with `signal()`.
- **Read-only signal (`Signal<T>`)**: a signal you can only read, not change. `computed()` produces one, and `.asReadonly()` converts a writable signal into one.
- **`computed()`**: creates a read-only signal whose value is derived from other signals; lazy and memoized.
- **`effect()`**: registers code that runs on creation and re-runs when its tracked signals change; used for side effects.
- **Dependency tracking**: Angular automatically records which signals were read during a `computed`/`effect`/template expression, and re-runs only when those signals change.
- **Fine-grained reactivity**: updating only the exact consumers of changed state, instead of re-checking everything.
- **Zoneless**: running Angular without Zone.js, relying on signals (and explicit triggers) for change detection. The default for new projects in recent Angular versions.

# Syntax Overview

```typescript
import { signal, computed, effect } from '@angular/core';

// 1. Create a writable signal
const temperature = signal(20);

// 2. Read it (note the parentheses!)
const current = temperature();          // 20

// 3. Update it
temperature.set(25);                     // replace
temperature.update(t => t + 1);          // transform -> 26

// 4. Derive a read-only signal
const status = computed(() =>
  temperature() > 25 ? 'warm' : 'cool'
);

// 5. React to changes (side effects only)
effect(() => {
  console.log(`It is ${status()} (${temperature()}°C)`);
});

// 6. Expose a writable signal as read-only
const readonlyTemp = temperature.asReadonly(); // cannot .set() or .update()
```

The single most important rule of syntax: **a signal is a function. To read its value, call it.** Writing `temperature` (without parentheses) gives you the signal itself; writing `temperature()` gives you its value.

# Real World Analogy

Think of a signal as a **spreadsheet cell**.

- A **writable signal** is a cell you type a number into directly (cell `A1 = 10`).
- A **computed signal** is a cell with a formula, like `B1 = A1 * 2`. You never type a value into `B1` directly, it recalculates itself whenever `A1` changes.
- An **effect** is like a chart or a printout wired to a cell: when the cell changes, the chart redraws. It reacts to the data but is not part of the data.

And crucially, when you change `A1`, the spreadsheet does not recalculate *every* cell in the workbook, it only updates the cells whose formulas actually reference `A1`. That selective, automatic updating is exactly what Angular signals give your UI.

# Examples

## Example 1 — Basic: a counter

A minimal standalone component using all three core APIs. (In Angular 19+, components are standalone by default, so no `standalone: true` is needed.)

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <p>Doubled: {{ doubled() }}</p>
    <button (click)="increment()">+1</button>
    <button (click)="reset()">Reset</button>
  `,
})
export class Counter {
  // Writable signal holding the current count.
  protected readonly count = signal(0);

  // Computed signal — recalculated automatically when `count` changes.
  protected readonly doubled = computed(() => this.count() * 2);

  constructor() {
    // Effect runs once now, then again whenever `count` changes.
    effect(() => {
      console.log(`The count is now ${this.count()}`);
    });
  }

  increment(): void {
    // .update() derives the next value from the current one.
    this.count.update(value => value + 1);
  }

  reset(): void {
    // .set() replaces the value directly.
    this.count.set(0);
  }
}
```

**Why this is good:** `doubled` is derived with `computed()` rather than recalculated by hand. The template reads `count()` and `doubled()`, so Angular updates only those two expressions when the count changes. The effect is used only for logging, a real side effect.

## Example 2 — Real-world: a shopping cart with derived totals

This shows signals managing a list and `computed()` deriving values the UI needs.

```typescript
import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe], // pipes must be imported in standalone components
  template: `
    <h2>Your Cart ({{ itemCount() }})</h2>

    @if (items().length > 0) {
      <ul>
        @for (item of items(); track item.id) {
          <li>{{ item.name }} — {{ item.quantity }} × {{ item.price | currency }}</li>
        }
      </ul>
      <p><strong>Total: {{ total() | currency }}</strong></p>
    } @else {
      <p>Your cart is empty.</p>
    }

    <button (click)="addCoffee()">Add coffee</button>
  `,
})
export class Cart {
  protected readonly items = signal<CartItem[]>([]);

  // Derived: total number of units. Recomputed only when `items` changes.
  protected readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0),
  );

  // Derived: total price.
  protected readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  addCoffee(): void {
    // Create a NEW array so the signal detects the change.
    this.items.update(current => [
      ...current,
      { id: Date.now(), name: 'Coffee', price: 4.5, quantity: 1 },
    ]);
  }
}
```

**Why this is good:** `itemCount` and `total` never get out of sync with `items` because they are computed *from* it. Notice `addCoffee()` returns a brand-new array instead of pushing into the existing one, this is required for the signal to notice the change (see Common Mistakes).

## Example 3 — Best practice: a state service with encapsulated signals

The recommended pattern for sharing state: keep the writable signal **private**, and expose **read-only** views. Consumers can read and call methods, but they cannot bypass your logic and overwrite state directly.

```typescript
// counter.store.ts
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CounterStore {
  // Private writable state — only this store can change it.
  private readonly _count = signal(0);

  // Public read-only API.
  readonly count = this._count.asReadonly();
  readonly isZero = computed(() => this._count() === 0);

  increment(): void {
    this._count.update(value => value + 1);
  }

  decrement(): void {
    // Encapsulated rule: never go below zero.
    this._count.update(value => Math.max(0, value - 1));
  }

  reset(): void {
    this._count.set(0);
  }
}
```

```typescript
// counter-page.component.ts
import { Component, inject } from '@angular/core';
import { CounterStore } from './counter.store';

@Component({
  selector: 'app-counter-page',
  template: `
    <p>Count: {{ store.count() }}</p>
    <button (click)="store.increment()">+1</button>
    <button (click)="store.decrement()" [disabled]="store.isZero()">−1</button>
    <button (click)="store.reset()">Reset</button>
  `,
})
export class CounterPage {
  protected readonly store = inject(CounterStore);
}
```

**Why this is good:** the component cannot do `store.count.set(...)`, because `count` is read-only. All changes flow through the store's methods, which enforce rules like "never below zero." The `isZero` computed drives the disabled state of the button automatically. This keeps state predictable as the app grows.

# Common Mistakes

- **Forgetting the parentheses when reading.** `{{ count }}` renders the signal *function*, not its value. Always read with `count()`. The same applies in TypeScript: `if (count > 0)` is a bug; use `if (count() > 0)`.
- **Mutating objects/arrays in place.** Signals compare values with `Object.is` by default. If you do `items().push(item)` and then `items.set(items())`, the array reference is unchanged, so Angular sees no change and does not update. Always produce a **new** value: `items.update(curr => [...curr, item])`.
- **Using `effect()` to derive state.** Writing an effect that reads signal A and sets signal B to keep them in sync is fragile and can cause confusing update loops. Use `computed()` for derived values instead.
- **Looking for `.mutate()`.** It does not exist. Use `.set()` (replace) or `.update()` (transform). For objects, return a new object/array.
- **Putting side effects inside `computed()`.** A computed function must be pure, no logging, HTTP calls, or DOM changes. Side effects belong in `effect()`.
- **Creating effects outside an injection context.** Calling `effect()` from, say, a plain callback can throw or leak. Create effects in the constructor or as a class field so Angular manages their lifecycle.

# Best Practices

- **Derive, don't duplicate.** Any value that can be calculated from other state should be a `computed()`, not a separate writable signal you remember to update.
- **Keep writable signals private; expose read-only views.** Use `private readonly _state = signal(...)` plus `readonly state = this._state.asReadonly()` and `computed()` selectors, as in Example 3.
- **Treat signal values as immutable.** Replace objects and arrays with new copies (`{ ...obj }`, `[...arr]`) instead of mutating them in place.
- **Use `effect()` sparingly and only for true side effects** (logging, persistence, third-party integrations), never for application state.
- **Prefer signal inputs (`input()`) over `@Input()`** in new components, they integrate cleanly with `computed()` and `effect()`.
- **Lean into `OnPush` and zoneless.** Signals are designed for fine-grained updates; in Angular 20+ new components use `OnPush` and new apps are zoneless by default, which signals support naturally.
- **Bridge RxJS at the edges.** When you have an Observable, convert it with `toSignal()` (from `@angular/core/rxjs-interop`) so the rest of your component logic stays signal-based.

# Summary

- A **signal** wraps a value and notifies its consumers when that value changes.
- Read a signal by **calling it**: `count()`. Forgetting the parentheses is the most common beginner bug.
- Create writable signals with `signal(initialValue)`; change them with `.set()` and `.update()`. There is no `.mutate()`.
- Use `computed()` for **derived, read-only** values; it is lazy and cached, and stays in sync automatically.
- Use `effect()` only for **side effects**, and create it inside an injection context (constructor/field).
- Signals enable **fine-grained reactivity**: Angular updates only the exact consumers of changed state.
- Treat signal values as **immutable**, replace objects/arrays rather than mutating them, because comparison uses `Object.is`.
- Encapsulate shared state in a service: keep the writable signal private and expose `.asReadonly()` plus `computed()` selectors.
- Signals are stable and recommended in modern Angular and underpin **zoneless** apps with `OnPush` change detection.
- Signal inputs (`input()`), two-way `model()`, and async `resource()`/`httpResource()` build on these same fundamentals.

# Flash Cards

Q: How do you read the current value of a signal called `total`?
A: Call it as a function: `total()`. The parentheses are required, both in templates and in TypeScript.

Q: What is the difference between a writable signal and a computed signal?
A: A writable signal (from `signal()`) can be changed with `.set()`/`.update()`. A computed signal (from `computed()`) is read-only and derives its value from other signals, recalculating automatically.

Q: When should you use `effect()` instead of `computed()`?
A: Use `effect()` only for side effects that reach outside Angular state (logging, persistence, third-party libraries). Use `computed()` to derive new state from existing signals.

Q: Why does pushing into an array held by a signal often fail to update the UI?
A: Signals compare values with `Object.is`. Mutating the array in place keeps the same reference, so Angular detects no change. You must set a new array, e.g. `items.update(curr => [...curr, item])`.

Q: How do you expose a signal from a service so consumers can read but not modify it?
A: Keep a private writable signal and expose a read-only version with `.asReadonly()` (and/or `computed()` selectors), changing state only through the service's own methods.

# Exercises

### Easy

Create a standalone `TemperatureToggle` component with a writable signal `celsius` initialized to `20`. Add a computed signal `fahrenheit` that converts it (`celsius * 9/5 + 32`). Display both in the template and add a button that increases `celsius` by 1 using `.update()`. Confirm `fahrenheit` updates on its own.

### Medium

Build a `TodoList` component with a signal holding an array of todos (`{ id: number; text: string; done: boolean }`). Render the list with `@for` (remember `track`). Add:
- a computed `remaining` that counts todos where `done` is `false`, and
- a `toggle(id)` method that flips a todo's `done` flag **without mutating** the existing objects (produce new objects/array).
Show `remaining` in the heading and watch it update as you toggle items.

### Challenging

Refactor the medium exercise so all state lives in an injectable `TodoStore` service. Keep the todos signal **private** and expose a read-only `todos` (via `.asReadonly()`) plus computed selectors `remaining` and `allDone`. The component should `inject(TodoStore)` and call its methods only, it must not be able to overwrite the todos directly. Add an `effect()` in the store that logs the remaining count whenever it changes, and explain in a comment why a `computed()` would *not* be the right tool for that logging.

# Further Reading

- Angular Signals overview — https://angular.dev/guide/signals
- `computed()` (dependent state) — https://angular.dev/guide/signals#computed-signals
- `effect()` — https://angular.dev/guide/signals#effects
- Signal inputs — https://angular.dev/guide/signals/inputs
- Two-way binding with `model()` — https://angular.dev/guide/signals/model
- Signal-based queries — https://angular.dev/guide/signals/queries
- `linkedSignal()` — https://angular.dev/guide/signals/linked-signal
- Async data with the Resource API — https://angular.dev/guide/signals/resource
- RxJS interop (`toSignal`, `toObservable`) — https://angular.dev/ecosystem/rxjs-interop
- Zoneless Angular — https://angular.dev/guide/zoneless
