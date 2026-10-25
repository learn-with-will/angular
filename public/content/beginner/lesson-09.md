---
id: lesson-09
slug: control-flow-syntax
title: "Angular Control Flow: @if, @for, and @switch"
level: beginner
order: 5
duration: 30
tags:
  - templates
  - control-flow
  - conditional-rendering
  - lists
  - signals
---


# Learning Objectives

After completing this lesson, you will be able to:

- Use the `@if`, `@else if`, and `@else` blocks to conditionally render parts of a template.
- Loop over collections with `@for`, apply a correct `track` expression, and handle empty lists with `@empty`.
- Choose between many states using `@switch`, `@case`, and `@default`.
- Explain why Angular's built-in control flow replaced the older `*ngIf`, `*ngFor`, and `*ngSwitch` structural directives.
- Migrate existing templates to the new syntax and avoid the most common beginner mistakes.

# Why This Concept Exists

Every real application needs to make decisions in the UI: show a button only when the user is logged in, render one row per item in a list, or display a different screen depending on whether data is loading, loaded, or errored. This is **control flow** — controlling *what* renders and *how many times*.

For years, Angular handled this with **structural directives**: `*ngIf`, `*ngFor`, and `*ngSwitch`. They worked, but they had real friction:

- The leading asterisk (`*`) and the `; else templateRef` patterns were confusing to read and write.
- You had to import `CommonModule` (or individual directives) into every component just to use them.
- `*ngFor` performance depended on remembering to add a separate `trackBy` function — and forgetting it caused slow, buggy list updates.
- Type-checking and tooling support were limited.

Starting in Angular 17 (developer preview) and becoming **stable in Angular 18**, Angular introduced a **built-in block control flow** using an `@` syntax. It is now the recommended approach for all new code. It solves the problems above: cleaner syntax that reads like normal code, no imports required, mandatory and ergonomic list tracking, better performance, and stronger type-checking that integrates naturally with Signals.

# Concept Explanation

Built-in control flow is part of the **template compiler itself**, not a set of directives you import. Angular recognizes special blocks that start with `@` and compiles them into highly optimized rendering instructions.

There are three blocks:

- **`@if`** — render a block only when a condition is truthy (with optional `@else if` / `@else`).
- **`@for`** — repeat a block once per item in an iterable (with a required `track` and an optional `@empty`).
- **`@switch`** — render exactly one branch out of several based on a single value.

A few important properties:

- **No imports needed.** Because the syntax is built into the framework, you do *not* import `CommonModule`. This works out of the box in standalone components, which are the default in modern Angular.
- **Curly braces define the block.** The content to render goes inside `{ ... }`. This makes nesting and reading much clearer than the old asterisk syntax.
- **It pairs naturally with Signals.** When a value is a signal, you read it in the template by calling it (e.g. `@if (isLoggedIn())`). When the signal changes, Angular efficiently re-renders only the affected block.
- **The old directives still work.** `*ngIf`, `*ngFor`, and `*ngSwitch` are not removed, but you should prefer the new blocks for new code.

# Key Terminology

- **Control flow block** — a template construct starting with `@` (`@if`, `@for`, `@switch`) that controls rendering.
- **`@else if` / `@else`** — alternative branches of an `@if` that render when earlier conditions are false.
- **`track`** — a required expression in `@for` that uniquely identifies each item so Angular can reuse DOM nodes efficiently when the list changes.
- **`@empty`** — an optional block tied to `@for` that renders when the collection has zero items.
- **Contextual (implicit) variables** — special values available inside `@for`: `$index`, `$count`, `$first`, `$last`, `$even`, `$odd`.
- **`@case` / `@default`** — branches inside `@switch`; `@default` renders when no case matches.
- **Alias (`as`)** — saving an expression's result into a named variable, e.g. `@if (user.profile; as profile)`.

# Syntax Overview

**Conditional rendering with `@if`:**

```typescript
@if (condition) {
  <!-- rendered when condition is truthy -->
} @else if (otherCondition) {
  <!-- rendered when the first is false and this is true -->
} @else {
  <!-- rendered when nothing above matched -->
}
```

You can also save the condition's value into a variable for reuse inside the block:

```typescript
@if (user.address; as address) {
  <p>{{ address.city }}, {{ address.country }}</p>
}
```

**Looping with `@for` (the `track` expression is required):**

```typescript
@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items found.</li>
}
```

You can expose contextual variables with `let`:

```typescript
@for (item of items; track item.id; let i = $index, isLast = $last) {
  <p>{{ i + 1 }}. {{ item.name }}</p>
}
```

**Choosing one branch with `@switch`:**

```typescript
@switch (status) {
  @case ('loading') {
    <p>Loading…</p>
  }
  @case ('success') {
    <p>Done!</p>
  }
  @default {
    <p>Something went wrong.</p>
  }
}
```

> Note: `@switch` compares values using the strict equality operator (`===`). There is no fallthrough, so you never need a `break`. If no `@case` matches and there is no `@default`, nothing renders.

# Real World Analogy

Think of control flow blocks as a **restaurant host standing at the door**.

- **`@if`** is the host checking a single rule: *"Do you have a reservation?"* If yes, seat them; otherwise (`@else`) point them to the waiting area.
- **`@for`** is the host walking down a line of guests and seating each one, **using their name tag** (`track`) to know exactly who is who — so if one guest leaves, the host doesn't have to re-seat the entire line, only adjust that one spot. The `@empty` block is the sign that reads *"No one is waiting"* when the line is empty.
- **`@switch`** is the host reading a guest's ticket type — *VIP*, *standard*, or *staff* — and sending them down exactly one matching hallway (`@case`), with a *"please see reception"* fallback (`@default`) for anything unexpected.

The `track` "name tag" is the part beginners forget, and it's exactly what keeps the line moving efficiently.

# Examples

### Example 1 — Basic: a simple toggle with `@if` / `@else`

This shows the core conditional pattern. Notice there are no imports for the control flow — it just works.

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-login-status',
  template: `
    <button (click)="isLoggedIn.set(!isLoggedIn())">
      Toggle login
    </button>

    @if (isLoggedIn()) {
      <p>Welcome back! 🎉</p>
    } @else {
      <p>Please log in to continue.</p>
    }
  `,
})
export class LoginStatusComponent {
  // A signal holding a boolean. We read it as isLoggedIn() in the template.
  isLoggedIn = signal(false);
}
```

**What's happening:** `isLoggedIn` is a signal. Clicking the button flips its value with `.set(...)`. The `@if` block reads `isLoggedIn()` and renders the matching branch. Because signals are reactive, Angular updates only this block when the value changes.

### Example 2 — Real-world: a product list with `@for`, `track`, and `@empty`

A typical list-rendering scenario, including a per-item conditional and an empty state.

```typescript
import { Component, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

@Component({
  selector: 'app-product-list',
  // Pipes still need importing in standalone components — but the
  // control flow blocks do not.
  imports: [CurrencyPipe],
  template: `
    <h2>Products</h2>

    <ul>
      @for (product of products(); track product.id) {
        <li>
          {{ product.name }} — {{ product.price | currency }}
          @if (product.inStock) {
            <span class="badge">In stock</span>
          } @else {
            <span class="badge sold-out">Sold out</span>
          }
        </li>
      } @empty {
        <li>No products available right now.</li>
      }
    </ul>
  `,
})
export class ProductListComponent {
  products = signal<Product[]>([
    { id: 1, name: 'Mechanical Keyboard', price: 89.99, inStock: true },
    { id: 2, name: 'Wireless Mouse', price: 24.99, inStock: false },
    { id: 3, name: 'USB-C Hub', price: 39.99, inStock: true },
  ]);
}
```

**What's happening:** `@for` repeats the `<li>` once per product. `track product.id` tells Angular each product's stable identity, so if the list reorders or one item changes, Angular reuses existing DOM nodes instead of rebuilding everything. The nested `@if` chooses a badge per item, and `@empty` covers the case where the array is empty.

### Example 3 — Best-practice: combining `@switch`, `@for` context variables, and computed state

This models a common UI-state machine (loading / error / loaded) and a clean todo list. It uses a `computed` signal to keep logic out of the template, tracks by a stable `id`, and uses contextual variables.

```typescript
import { Component, signal, computed } from '@angular/core';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-todo-board',
  template: `
    @switch (state()) {
      @case ('loading') {
        <p>Loading your todos…</p>
      }

      @case ('error') {
        <p>Couldn't load todos. Please retry.</p>
      }

      @case ('loaded') {
        <h2>Todos — {{ remaining() }} remaining</h2>

        @for (todo of todos(); track todo.id; let i = $index, isLast = $last) {
          <div [class.completed]="todo.done">
            {{ i + 1 }}. {{ todo.title }}
            @if (todo.done) {
              <span>✓</span>
            }
          </div>
          @if (!isLast) {
            <hr />
          }
        } @empty {
          <p>🎉 All clear — add your first task!</p>
        }
      }

      @default {
        <p>Unknown state.</p>
      }
    }
  `,
})
export class TodoBoardComponent {
  state = signal<LoadState>('loaded');

  todos = signal<Todo[]>([
    { id: 1, title: 'Learn @if', done: true },
    { id: 2, title: 'Learn @for', done: false },
    { id: 3, title: 'Learn @switch', done: false },
  ]);

  // Derived state computed once and cached — not recalculated in the template.
  remaining = computed(() => this.todos().filter((t) => !t.done).length);
}
```

**Why this is good practice:** the "how many are left" logic lives in a `computed` signal, not inline in the template; the loop tracks by the stable `id`; `$index` and `$last` are aliased with clear names; and `@empty` gives the user a friendly empty state. The `@switch` cleanly separates the three top-level UI states without nesting multiple `@if` blocks.

> **Advanced tip — exhaustive `@switch`:** When the switched value is a TypeScript union type, you can add `@default never;` to ask the compiler to verify that *every* possible case is handled. If someone later adds a new value to the union and forgets a matching `@case`, you get a compile-time error instead of a silent bug. This is optional and best reserved for state machines where completeness matters. (It needs a recent Angular version: Angular 20's compiler doesn't accept `@default never;`, so check your version before using it.)

# Common Mistakes

- **Forgetting `track` in `@for`.** Unlike the old `*ngFor`, `track` is **required** — the template will not compile without it. Add `track item.id` (or another unique key).
- **Tracking by `$index` for dynamic lists.** `track $index` is only safe for static lists that never reorder or change. For lists that can change, track by a stable unique property like `id`; otherwise Angular may reuse the wrong DOM nodes and you'll see stale data or lost input focus.
- **Still importing `CommonModule` "just in case."** The control flow blocks are built in. Importing `CommonModule` only to use `@if`/`@for`/`@switch` is unnecessary (you only need imports for things like pipes or other directives you actually use).
- **Putting heavy logic inside the block condition.** Calling expensive functions in `@if (computeThing())` runs on every change detection. Move the work into a `computed` signal or a component property.
- **Expecting `@switch` fallthrough.** There is none, and matching uses strict `===`. Each `@case` has its own block, and an empty `@case` simply renders nothing. If several values need the same content, move that content into a small component or an `<ng-template>` and render it from each case.
- **Assuming the control-flow migration changes nothing.** `ng generate @angular/core:control-flow` turns `NgSwitch` (loose `==`) into `@switch` (strict `===`), so a case like `@case ('1')` no longer matches the number `1`. The schematic only rewrites templates (HTML files and inline templates), and where an `*ngFor` had no `trackBy` it picks a fallback `track` expression. Review every `@switch` and `track` after migrating.
- **Forgetting the empty state.** Without `@empty`, an empty list renders nothing and can look like a bug. Add `@empty` to show a clear message.

# Best Practices

- **Prefer the built-in control flow for all new code.** Use `@if`, `@for`, and `@switch` rather than `*ngIf`, `*ngFor`, and `*ngSwitch`.
- **Always track by a stable, unique identifier** (`track item.id`). Add an `id` to your data model if it doesn't have one. Use `$index` only for truly static collections.
- **Keep templates declarative.** Compute derived values (`remaining`, filtered lists, flags) with `computed` signals or component fields, and read them in the template — don't embed complex logic in conditions.
- **Always provide `@empty`** for user-facing lists so empty states are intentional and friendly.
- **Use `@switch` instead of long `@if`/`@else if` chains** when branching on a single value.
- **Read signals by calling them** in conditions and loops: `@if (open())`, `@for (x of items(); track x.id)`.
- **Migrate existing projects automatically.** Run the official schematic to convert old directives in one pass:

```bash
ng generate @angular/core:control-flow
```

# Summary

- Built-in control flow uses `@`-prefixed blocks and is the modern, recommended way to render conditionally and loop in Angular templates.
- It became **stable in Angular 18** and is the default through the latest release; the older `*ngIf`/`*ngFor`/`*ngSwitch` directives still work but should not be used for new code.
- **`@if`** handles conditions and supports `@else if` and `@else`, plus an `as` alias for reusing a value.
- **`@for`** loops over any iterable, **requires a `track` expression**, and offers `@empty` plus contextual variables (`$index`, `$count`, `$first`, `$last`, `$even`, `$odd`).
- **`@switch`** selects one branch with `@case`/`@default`, compares with strict `===`, and has no fallthrough.
- The blocks are built into the compiler, so **no `CommonModule` import** is needed.
- `track` by a **stable unique id** for performance and correctness; avoid `$index` for dynamic lists.
- It integrates cleanly with **Signals** — read signals by calling them in conditions and loops.
- Keep derived logic in **`computed` signals**, not in template expressions.
- Use the **`ng generate @angular/core:control-flow`** schematic to migrate existing templates automatically.

# Flash Cards

Q: What three blocks make up Angular's built-in control flow?
A: `@if` (with `@else if` / `@else`), `@for` (with `@empty`), and `@switch` (with `@case` / `@default`).

Q: Why is the `track` expression required in `@for`?
A: It gives each item a stable identity so Angular can reuse DOM nodes efficiently when the collection changes, improving performance and preventing rendering bugs. The template won't compile without it.

Q: Do you need to import `CommonModule` to use `@if`, `@for`, or `@switch`?
A: No. The control flow blocks are built into the template compiler and work out of the box, including in standalone components.

Q: What contextual variables are available inside an `@for` block?
A: `$index`, `$count`, `$first`, `$last`, `$even`, and `$odd`.

Q: What operator does `@switch` use to match a `@case`, and does it fall through?
A: It uses strict equality (`===`) and does not fall through, so no `break` is needed.

# Exercises

### Easy

Create a standalone component with a boolean signal `darkMode` and a button that toggles it. Use `@if` / `@else` to display "🌙 Dark mode on" when true and "☀️ Light mode on" when false.

### Medium

Build a `MovieListComponent` that holds a signal array of movies (`{ id, title, rating }`). Render them with `@for`, tracking by `id`. For each movie, use `@if` to add a "⭐ Top rated" label when `rating >= 8`. Add an `@empty` block that says "No movies in your watchlist." Then test it by initializing the array as empty.

### Challenging

Create an `OrderStatusComponent` with a signal `status` typed as the union `'pending' | 'shipped' | 'delivered' | 'cancelled'`. Use `@switch` to render a different message and color for each status. Add buttons to change the status. As a stretch goal, add a `computed` signal `isFinal` that is `true` when the status is `'delivered'` or `'cancelled'`, and use `@if` to show a "This order is closed" notice when it's final.

# Further Reading

- [Control flow — official Angular guide](https://angular.dev/guide/templates/control-flow)
- [Angular templates documentation](https://angular.dev/guide/templates)
- [Signals — official Angular guide](https://angular.dev/guide/signals)
- [Migration to control flow syntax (CLI schematic)](https://angular.dev/reference/migrations/control-flow)
- [Angular releases and versioning](https://angular.dev/reference/releases)
