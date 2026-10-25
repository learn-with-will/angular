---
id: lesson-13
slug: component-communication
title: "Component Communication in Angular"
level: intermediate
order: 9
duration: 40
tags:
  - components
  - input
  - output
  - signals
  - two-way-binding
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Pass data from a parent component to a child component using the signal-based `input()` function.
- Emit custom events from a child component to a parent component using the signal-based `output()` function.
- Implement two-way data binding between a parent and child using `model()`.
- Access a child component instance directly from its parent using `viewChild()`.
- Share state between sibling or unrelated components using an injectable service built on signals.
- Recognize which communication pattern fits a given scenario and avoid common anti-patterns like prop drilling.

## Why This Concept Exists

Angular applications are built as a tree of components, and each component is designed to be self-contained: it manages its own template, styles, and logic. That isolation is great for reusability and testability, but real applications are not made of isolated pieces — a shopping cart needs to know what a product card did, a form needs to tell its parent that it was submitted, and a header needs to know how many items are in the cart even though it lives nowhere near the cart logic.

Without a structured way to communicate, developers would be tempted to use global variables, manually query the DOM, or tightly couple components together — all of which make an application fragile and hard to maintain. Angular solves this with a well-defined, predictable set of communication mechanisms that preserve **unidirectional data flow** (data flows down, events flow up) while still allowing more flexible patterns (two-way binding, shared services) when they genuinely simplify your code.

Understanding these patterns is essential for building maintainable Angular applications, because almost every non-trivial UI requires components to coordinate with each other.

## Concept Explanation

There are four main ways components communicate in modern Angular, and choosing the right one depends on the relationship between the components involved.

### 1. Parent → Child: passing data down with `input()`

When a parent component owns some data and a child needs to display or use it, the parent passes that data down as an **input**. The child treats this value as read-only — it should never try to mutate an input directly. This keeps data flow predictable: you can always trace a value back to where it originated.

### 2. Child → Parent: emitting events up with `output()`

A child component doesn't have direct access to its parent, and it shouldn't reach up and modify parent state directly. Instead, it **emits an event**, and the parent decides how to react. This keeps the child reusable — it doesn't need to know anything about who is listening or what happens next.

### 3. Two-way binding with `model()`

Sometimes a value is conceptually "owned" jointly by parent and child — for example, a search box's text, or a star rating. Instead of wiring up a separate input and output manually, Angular provides `model()`, which bundles both directions into a single, ergonomic API using the familiar `[(banana-in-a-box)]` syntax.

### 4. Sibling / unrelated components: shared services

Inputs, outputs, and two-way binding only work between components that have a direct parent-child relationship in the template. When two components don't share that relationship — like a product list and a cart summary badge in a totally different part of the page — the recommended approach is to extract the shared state into an **injectable service**. Both components inject the same service instance (via Angular's dependency injection) and read/write shared state through it, often using signals for reactivity.

### A fifth, more direct tool: `viewChild()`

Occasionally a parent needs to imperatively call a method on a specific child instance — for example, resetting a form or focusing an input on demand. Angular provides `viewChild()` to get a direct reference to a child component or DOM element. This bypasses the input/output contract, so it should be used sparingly, only when imperative access is genuinely the simplest solution.

> **Modern Angular note:** Since Angular 17.1–19, the recommended way to declare inputs, outputs, and two-way bindings is through the **signal-based functions** `input()`, `output()`, and `model()`, used together with `viewChild()`/`viewChildren()` signal queries. The older `@Input()` / `@Output()` decorators (with `EventEmitter`) still work and you will see them in existing codebases, but new code should prefer the signal-based APIs because they integrate directly with Angular's reactivity system, offer better type inference, and remove the need for `ngOnChanges` in many cases.

## Key Terminology

| Term | Meaning |
|---|---|
| **Input** | A property a component exposes so a parent can pass data into it. Declared with `input()`. |
| **Output** | An event a component exposes so a parent can react to something happening inside it. Declared with `output()`. |
| **Signal** | A reactive value container (`signal()`, `computed()`) that notifies Angular when it changes, enabling fine-grained change detection. |
| **`model()`** | A signal-based API that creates an input and output pair bundled together, enabling two-way binding with `[(prop)]`. |
| **Two-way binding** | A binding where data flows both from parent to child and from child back to parent, written as `[(propertyName)]`. |
| **`viewChild()`** | A signal-based query function that gives a component a direct reference to a child component, directive, or DOM element in its own template. |
| **Dependency Injection (DI)** | Angular's system for providing shared instances (like services) to components that need them, without those components creating the instances themselves. |
| **`providedIn: 'root'`** | A service configuration that creates a single, application-wide shared instance — the standard way to make a service available for cross-component communication. |
| **Unidirectional data flow** | The default Angular convention: data flows down through inputs, and events/changes flow up through outputs. |

## Syntax Overview

```typescript
import { Component, ElementRef, booleanAttribute, input, output, model, viewChild } from '@angular/core';

@Component({ /* ... */ })
export class ExampleComponent {
  // A required input: the parent MUST provide a value, or Angular throws a compile-time error.
  title = input.required<string>();

  // An optional input with a default value. The booleanAttribute transform also lets
  // a parent write the bare attribute: <app-example isDisabled /> means true.
  isDisabled = input(false, { transform: booleanAttribute });

  // An output: the child calls `.emit(value)` to notify the parent.
  saved = output<string>();

  // A two-way bindable value: creates both an input and an output under the hood.
  quantity = model<number>(1);

  // A direct reference to a DOM element declared in THIS component's template (#form).
  // Querying an element gives you an ElementRef; read it with this.formRef()?.nativeElement.
  formRef = viewChild<ElementRef<HTMLFormElement>>('form');
}
```

Usage from a parent template:

```html
<!-- One-way input binding: square brackets -->
<app-example [title]="pageTitle" [isDisabled]="loading"></app-example>

<!-- Output binding: parentheses, calling a handler method -->
<app-example (saved)="onSaved($event)"></app-example>

<!-- Two-way binding: banana-in-a-box, combines both directions -->
<app-example [(quantity)]="cartQuantity"></app-example>
```

Note that inputs, outputs, and models are all **signals or signal-producing functions**, so inside the component's own TypeScript code and template you must call them as functions to read the current value: `title()`, `quantity()`, not `title`, `quantity`.

## Real World Analogy

Think of a company's reporting structure:

- **Input = a manager assigning a task.** The manager (parent) hands a task down to an employee (child). The employee doesn't get to redefine the task — they just receive it and act on it.
- **Output = an employee reporting completion.** The employee doesn't walk into the manager's calendar and reschedule things themselves; they send a report upward, and the manager decides what to do with that information.
- **Two-way binding = a shared shift schedule.** Both the manager and employee can update the same schedule document, and both see the latest version — a single shared source of truth updated from two directions.
- **Shared service = a company-wide bulletin board.** Two employees in completely different departments (siblings, with no direct reporting relationship) don't talk to each other directly — they both read and post to a shared bulletin board (the service), and stay in sync that way.

## Examples

### Example 1 — Basic: Parent → Child input and Child → Parent output

A simple counter where the parent owns the count, and a "dumb" display component shows it and asks the parent to increment it.

```typescript
// counter-display.component.ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-counter-display',
  template: `
    <div class="counter">
      <p>Current count: {{ count() }}</p>
      <button type="button" (click)="increment.emit()">+1</button>
    </div>
  `,
})
export class CounterDisplayComponent {
  // Required input: the parent must always provide a count.
  count = input.required<number>();

  // Output with no payload — it's just a notification, "the button was clicked".
  increment = output<void>();
}
```

```typescript
// counter-page.component.ts
import { Component, signal } from '@angular/core';
import { CounterDisplayComponent } from './counter-display.component';

@Component({
  selector: 'app-counter-page',
  imports: [CounterDisplayComponent],
  template: `
    <app-counter-display
      [count]="currentCount()"
      (increment)="onIncrement()"
    />
  `,
})
export class CounterPageComponent {
  // The parent owns the state as a signal.
  currentCount = signal(0);

  onIncrement(): void {
    this.currentCount.update((value) => value + 1);
  }
}
```

**Explanation:** `CounterDisplayComponent` never touches `currentCount` directly — it only knows the value it was given (`count()`) and emits an `increment` event when the button is clicked. The parent is the single source of truth and decides what "increment" actually means. This keeps `CounterDisplayComponent` fully reusable — it could be reused to count anything, in any parent.

### Example 2 — Real-World: A product list and reusable product card

A common real-world scenario: a list component renders a card per product, and the card notifies the list when the user wants to add that product to a cart.

```typescript
// product.model.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}
```

```typescript
// product-card.component.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from './product.model';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe], // needed for the | currency pipe below
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <h3>{{ product().name }}</h3>
      <p>{{ product().price | currency }}</p>
      <button type="button" (click)="addToCart.emit(product())">
        Add to cart
      </button>
    </article>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();
  addToCart = output<Product>();
}
```

```typescript
// product-list.component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ProductCardComponent } from './product-card.component';
import { Product } from './product.model';

@Component({
  selector: 'app-product-list',
  imports: [ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid">
      @for (product of products(); track product.id) {
        <app-product-card
          [product]="product"
          (addToCart)="onAddToCart($event)"
        />
      }
    </div>
  `,
})
export class ProductListComponent {
  products = signal<Product[]>([
    { id: 'p1', name: 'Mechanical Keyboard', price: 89 },
    { id: 'p2', name: 'Wireless Mouse', price: 29 },
  ]);

  onAddToCart(product: Product): void {
    console.log('Add to cart requested for:', product.name);
    // In a real app, this would call a shared cart service (see Example 4).
  }
}
```

**Explanation:** `ProductCardComponent` is completely decoupled from cart logic — it only knows how to display a product and emit the product that was clicked. `ProductListComponent` decides what "add to cart" actually does. This separation lets you reuse `ProductCardComponent` in a wishlist page, a search results page, or anywhere else without changes.

### Example 3 — Two-way binding with `model()`

A star-rating widget where both the parent and the child can read and update the same value.

```typescript
// star-rating.component.ts
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  template: `
    <div class="stars">
      @for (star of [1, 2, 3, 4, 5]; track star) {
        <button
          type="button"
          [class.filled]="star <= rating()"
          (click)="rating.set(star)"
        >
          ★
        </button>
      }
    </div>
  `,
})
export class StarRatingComponent {
  // model() creates BOTH an input and an output automatically.
  // Default value is 0 if the parent doesn't bind anything.
  rating = model<number>(0);
}
```

```typescript
// review-form.component.ts
import { Component, signal } from '@angular/core';
import { StarRatingComponent } from './star-rating.component';

@Component({
  selector: 'app-review-form',
  imports: [StarRatingComponent],
  template: `
    <app-star-rating [(rating)]="userRating" />
    <p>You selected {{ userRating() }} star(s).</p>
  `,
})
export class ReviewFormComponent {
  userRating = signal(0);
}
```

**Explanation:** Inside `StarRatingComponent`, calling `rating.set(star)` updates the signal locally *and* automatically emits the new value upward, because `model()` wires that up for you. The parent binds with `[(rating)]`, meaning `userRating` always mirrors whatever the child sets — no manual event handler required. Use `model()` only when a value is genuinely shared ownership; for pure notifications, prefer a plain `output()`.

### Example 4 — Best Practice: Sharing state between siblings with a signal-based service

`ProductCardComponent` and a completely unrelated `CartBadgeComponent` (say, in the page header) both need access to the cart. Neither is the other's parent or child, so inputs/outputs don't apply — a shared service does.

```typescript
// cart.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { Product } from './product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  // Private, writable signal — only this service can mutate it directly.
  private readonly _items = signal<Product[]>([]);

  // Public, read-only view exposed to consumers.
  readonly items = this._items.asReadonly();

  // A derived value that recalculates automatically whenever items change.
  readonly itemCount = computed(() => this._items().length);

  addItem(product: Product): void {
    this._items.update((current) => [...current, product]);
  }

  removeItem(productId: string): void {
    this._items.update((current) => current.filter((p) => p.id !== productId));
  }
}
```

```typescript
// product-list.component.ts (updated to use the shared service)
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ProductCardComponent } from './product-card.component';
import { CartService } from './cart.service';
import { Product } from './product.model';

@Component({
  selector: 'app-product-list',
  imports: [ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (product of products(); track product.id) {
      <app-product-card [product]="product" (addToCart)="cart.addItem($event)" />
    }
  `,
})
export class ProductListComponent {
  protected readonly cart = inject(CartService);

  products = signal<Product[]>([
    { id: 'p1', name: 'Mechanical Keyboard', price: 89 },
    { id: 'p2', name: 'Wireless Mouse', price: 29 },
  ]);
}
```

```typescript
// cart-badge.component.ts (a sibling, elsewhere in the app — e.g. the header)
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartService } from './cart.service';

@Component({
  selector: 'app-cart-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge">{{ cart.itemCount() }}</span>`,
})
export class CartBadgeComponent {
  protected readonly cart = inject(CartService);
}
```

**Explanation:** Because `CartService` is registered with `providedIn: 'root'`, Angular's dependency injector gives every component that injects it the **same singleton instance**. `ProductListComponent` calls `cart.addItem(...)` (still via its child's `output()`, as in Example 2), and `CartBadgeComponent` — which has no parent-child relationship with the product list at all — reactively updates because `itemCount` is a `computed()` signal derived from the same underlying state. This is the standard, scalable pattern for cross-component communication in Angular.

## Common Mistakes

- **Trying to mutate an input directly.** `input()` returns a read-only signal; you cannot call `.set()` on it. If a child needs to modify a value, either use `model()` for two-way binding, or emit an `output()` and let the parent update its own state.
- **Forgetting to call signals as functions.** Writing `{{ count }}` instead of `{{ count() }}` in a template (or `this.count` instead of `this.count()` in TypeScript) will not give you the current value — signals must be invoked.
- **Prop drilling through many layers.** Passing an input down through three or four intermediate components that don't actually use it themselves is a sign you should extract that state into a shared service instead.
- **Reaching for a shared service too early.** If two components truly have a parent-child relationship, a service adds unnecessary indirection — inputs/outputs (or `model()`) are simpler and easier to trace.
- **Not registering child components in `imports`.** Standalone components must explicitly list any child components they use in their `imports` array, or Angular will fail to recognize the child's selector in the template.
- **Overusing `viewChild()` for things outputs could handle.** `viewChild()` creates tight coupling between parent and child implementation details. Prefer inputs/outputs/`model()` first, and reserve `viewChild()` for genuinely imperative actions (e.g., calling `.focus()` or `.reset()`).
- **Registering a service at the component level when a shared singleton is needed.** Adding a service to a component's own `providers` array creates a *new instance* for that component (and its children), which breaks sharing between siblings. Use `providedIn: 'root'` (or provide it once at a common ancestor) for cross-component state.

## Best Practices

- Prefer the signal-based `input()`, `output()`, and `model()` functions over the legacy `@Input()`/`@Output()` decorators in new code — they're more concise, type-safe, and integrate natively with signals.
- Use `input.required<T>()` for data a component cannot function without; this fails fast at compile time instead of silently rendering with `undefined`.
- Keep components' public APIs (inputs/outputs) small and focused — a large number of inputs/outputs is often a sign a component is doing too much.
- Treat every input as read-only inside the child; never mutate an object or array passed in as an input.
- Use `model()` only for values that are genuinely shared, two-way state (form controls, toggles, ratings) — not as a shortcut to avoid writing an explicit `output()` handler.
- For state shared across unrelated components, use a service with `providedIn: 'root'`, exposing a `readonly` signal (via `.asReadonly()`) plus explicit methods to mutate it — never expose a raw writable signal for others to call `.set()` on directly.
- Pair signal-based components with `ChangeDetectionStrategy.OnPush` for better performance, since signals already notify Angular precisely when something changes.
- Use `viewChild()` sparingly, and only for imperative needs that inputs/outputs genuinely cannot express cleanly.

## Summary

- Angular components communicate primarily through **inputs** (parent → child) and **outputs** (child → parent), preserving unidirectional data flow.
- The modern, recommended APIs are the signal-based `input()`, `output()`, and `model()` functions, replacing the older `@Input()`/`@Output()` decorators for new code.
- `input.required<T>()` enforces that a parent must supply a value, catching mistakes at compile time.
- `model()` bundles an input and output together to support two-way `[(binding)]` syntax for genuinely shared values.
- Sibling or unrelated components should communicate through a shared, injectable service — typically using `providedIn: 'root'` and signals for reactive state.
- `viewChild()` provides direct, imperative access to a child instance and should be used only when input/output patterns aren't sufficient.
- Always treat inputs as read-only, and expose service state as read-only signals with explicit mutation methods.
- Pairing signals with `ChangeDetectionStrategy.OnPush` improves performance because Angular can detect exactly what changed.

## Flash Cards

**Q: What is the difference between `input()` and `model()`?**
A: `input()` creates a one-way, read-only binding from parent to child. `model()` creates a two-way binding, automatically generating both an input and a corresponding output so changes flow in both directions.

**Q: How should two completely unrelated (sibling) components share state?**
A: Through a shared, injectable service — typically registered with `providedIn: 'root'` — exposing signals that both components can inject and read/react to.

**Q: Why should you avoid mutating an `input()` value directly inside a child component?**
A: Because `input()` returns a read-only signal representing data owned by the parent; mutating it breaks the predictable, traceable unidirectional data flow Angular relies on.

**Q: When is it appropriate to use `viewChild()` instead of inputs/outputs?**
A: When a parent needs to imperatively invoke a method or access a property on a specific child instance (e.g., calling `.focus()` or `.reset()`), rather than passing data or reacting to events.

**Q: What does `input.required<T>()` do differently from `input<T>()`?**
A: It marks the input as mandatory — Angular's compiler will produce an error if a parent uses the component without providing that input, instead of silently allowing an `undefined` value.

## Exercises

**Easy:** Create a `ToggleSwitchComponent` with an `enabled = model<boolean>(false)`. It should render a button that flips the value when clicked. Use it from a parent component with `[(enabled)]="isDarkMode"`, and display "Dark mode is on/off" based on `isDarkMode()`.

**Medium:** Build a `TodoItemComponent` that receives a `todo` object (`{ id: string; text: string; done: boolean }`) as a required input, and emits a `toggleDone` output carrying the todo's `id` when its checkbox is clicked. Build a parent `TodoListComponent` that holds an array of todos in a signal, renders one `TodoItemComponent` per todo with `@for`, and updates the correct todo's `done` state when `toggleDone` fires.

**Challenging:** Create a `NotificationService` (`providedIn: 'root'`) with a writable signal holding an array of message strings, a read-only `messages` signal exposed via `.asReadonly()`, and an `addMessage(text: string)` method. Then build two unrelated sibling components: a `NotifierFormComponent` with a text input and "Send" button that calls `notificationService.addMessage(...)`, and a `NotificationListComponent` that displays all current messages using `@for`, reading from `notificationService.messages()`. Confirm that messages sent from the form immediately appear in the list component even though neither is the other's parent or child.

## Further Reading

- [Angular Docs: Component inputs](https://angular.dev/guide/components/inputs)
- [Angular Docs: Component outputs](https://angular.dev/guide/components/outputs)
- [Angular Docs: Two-way binding](https://angular.dev/guide/templates/two-way-binding)
- [Angular Docs: Signals](https://angular.dev/guide/signals)
- [Angular Docs: Component queries (viewChild/viewChildren)](https://angular.dev/guide/components/queries)
- [Angular Docs: Dependency injection](https://angular.dev/guide/di)
- [Angular Docs: Standalone components](https://angular.dev/guide/components/importing)
