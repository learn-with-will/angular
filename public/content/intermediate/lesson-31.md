---
id: lesson-31
slug: smart-and-presentational-components
title: "Smart & Presentational Components"
level: intermediate
order: 20
duration: 45
tags:
  - components
  - design-patterns
  - architecture
  - unidirectional-data-flow
  - signals
---

## Learning Objectives

By the end of this lesson you will be able to:

- Explain the difference between **smart** (container) and **presentational** components, and decide which role a new component should play.
- Build presentational components that only use `input()` and `output()`, with `OnPush` change detection.
- Build smart components that own state, call services, and compose presentational children.
- Keep data flowing in one direction by updating state **immutably** in the component that owns it.
- Bubble events up through nested presentational components, and recognize when a shared service is the better tool.
- Unit-test a presentational component in isolation by setting inputs and listening to outputs.

## Why This Concept Exists

The first version of most screens is one big component: it fetches data, stores it, formats it, renders a list, handles every button, and navigates. That works until:

- **You need the same list somewhere else.** It's welded to one API call and one page, so you copy it.
- **A bug changes data "from somewhere".** Several components modify the same array, and nobody knows which one broke it.
- **Tests are painful.** Testing how a card *looks* now requires mocking HTTP, the router, and three services.

The **smart and presentational** pattern (also called *container and presentational*, or *smart and dumb*) splits these jobs. A few smart components own the state and the side effects. Many presentational components just display what they're given and report what the user did. State lives in one place, and data flows in one direction.

## Concept Explanation

### Two roles

| | Smart (container) component | Presentational component |
|---|---|---|
| Knows about | Services, the router, the store, HTTP | Only its own inputs |
| Owns state | Yes: it's the source of truth | No, apart from purely visual state (open/closed, hover) |
| Gets data from | Services | `input()` |
| Reports user actions by | Calling services, navigating | Emitting `output()` events |
| Typical examples | Routed pages, feature shells | Cards, lists, list items, badges, form sections |
| Reusable? | Rarely, it's tied to a use case | Highly |
| Easy to test? | Needs mocked services | Just set inputs and check outputs |

Routed pages are usually smart. Most of what's inside them should be presentational.

### Unidirectional data flow

The pattern only works if data moves one way:

1. The smart component holds the state, typically in signals.
2. It passes data **down** to presentational children through inputs.
3. Children emit events **up** through outputs. They never change the data they received.
4. The smart component reacts to the event: it calls a service and updates its own state.
5. The new state flows back down, and the view updates.

Because only one component writes to the state, every change has one obvious place to look.

### Immutability: replace, don't mutate

Signals decide whether to notify by comparing the old and new value with `Object.is`. If you push into the same array and return it, the reference didn't change, so nothing downstream updates. `OnPush` components have the same blind spot.

```typescript
// ❌ Same array reference: dependents may never update
this.entries.update((list) => {
  list.push(newEntry);
  return list;
});

// ✅ New array: every reader is notified
this.entries.update((list) => [...list, newEntry]);
```

The same rule applies inside presentational components. Never do `this.entry().reps++`. The object belongs to the parent. Emit an event that describes the change, and let the owner apply it.

### Bubbling events vs. reaching for a service

When an event starts deep in the tree (the Delete button inside an item inside a list), each presentational layer re-emits it: `(remove)="remove.emit($event)"`. That's fine for two or three levels and keeps everything explicit.

When you find yourself passing the same inputs and outputs through layers that don't use them (*prop drilling*), move the state into a shared service that the smart component and the deep child can both inject. The **Singleton Services & the Facade Pattern** lesson shows how to design that service.

### It's a guideline, not a law

- Presentational components can keep **visual** state, like whether a dropdown is open. They just shouldn't own *business* data.
- Not every app needs a strict split. A tiny one-off widget can be both.
- The goal is a small number of components that know about the outside world, and a large number that don't.

## Key Terminology

- **Smart / container component**: a component that owns state, injects services, and composes other components. Usually a routed page.
- **Presentational / dumb component**: a component that renders its inputs and emits outputs, with no knowledge of where data comes from.
- **Unidirectional data flow**: data travels down through inputs and events travel up through outputs, so state changes happen in one place.
- **Source of truth**: the single place that owns a piece of state. Everything else reads from it.
- **Immutable update**: creating a new object or array instead of modifying the existing one.
- **Prop drilling**: passing inputs or outputs through intermediate components that don't use them, just to reach a deeper child.
- **`OnPush`**: a change detection strategy where Angular only re-checks a component when its inputs change, a bound event fires, or a signal it reads changes.

## Syntax Overview

```typescript
// Presentational: inputs in, outputs out, OnPush
@Component({
  selector: 'app-thing-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3>{{ thing().name }}</h3>
    <button type="button" (click)="selected.emit(thing().id)">Select</button>
  `,
})
export class ThingCard {
  readonly thing = input.required<Thing>();
  readonly selected = output<string>();
}

// Smart: injects services, owns state, composes children
@Component({
  selector: 'app-things-page',
  imports: [ThingCard],
  template: `
    @for (thing of things(); track thing.id) {
      <app-thing-card [thing]="thing" (selected)="open($event)" />
    }
  `,
})
export class ThingsPage {
  private readonly thingsService = inject(ThingsService);
  protected readonly things = toSignal(this.thingsService.list(), { initialValue: [] });

  protected open(id: string): void {
    // navigate, call a service, update state...
  }
}
```

## Real World Analogy

Think of a restaurant.

- The **kitchen** is the smart component. It talks to suppliers (services), keeps track of every order (state), and decides what gets cooked.
- The **waiters and plates** are presentational components. A plate shows whatever the kitchen put on it. A waiter takes the customer's request back to the kitchen (an output event).
- A waiter never cooks or changes a dish on the way to the table. If the customer wants extra sauce, the waiter tells the kitchen, and the kitchen sends out a new plate (an immutable update).
- Because only the kitchen changes food, when something tastes wrong there's exactly one place to investigate.

## Examples

### 1. Basic Example: A product card and a product page

```typescript
// product.model.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}
```

```typescript
// product-card.ts (presentational)
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from './product.model';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="rounded border p-4">
      <h3 class="font-bold">{{ product().name }}</h3>
      <p>{{ product().price | currency }}</p>
      <button type="button" (click)="addToCart.emit(product())">Add to cart</button>
    </article>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly addToCart = output<Product>();
}
```

```typescript
// products-page.ts (smart)
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductCard } from './product-card';
import { ProductsService } from './products.service';
import { CartService } from './cart.service';
import { Product } from './product.model';

@Component({
  selector: 'app-products-page',
  imports: [ProductCard],
  template: `
    <h1>Products</h1>
    @for (product of products(); track product.id) {
      <app-product-card [product]="product" (addToCart)="add($event)" />
    }
  `,
})
export class ProductsPage {
  private readonly productsService = inject(ProductsService);
  private readonly cart = inject(CartService);

  protected readonly products = toSignal(this.productsService.list(), { initialValue: [] });

  protected add(product: Product): void {
    this.cart.add(product);
  }
}
```

**Why this works:** `ProductCard` has no idea where products come from or what "add to cart" does. You could reuse it on a search page, a wishlist, or a Storybook story without changing a line. `ProductsPage` is the only component that knows about services.

### 2. Real-World Example: A workout diary with nested events and immutable updates

The diary page owns the list. The list and the item are presentational. Events from the item bubble up through the list to the page.

```typescript
// exercise-set.model.ts
export interface ExerciseSet {
  id: string;
  exercise: string;
  sets: number;
  reps: number;
}
```

```typescript
// entry-item.ts (presentational)
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ExerciseSet } from './exercise-set.model';

@Component({
  selector: 'app-entry-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between p-3">
      <span>{{ entry().exercise }}: {{ entry().sets }} × {{ entry().reps }}</span>
      <span class="flex gap-2">
        <button type="button" data-testid="add-rep" (click)="addRep()">+1 rep</button>
        <button type="button" data-testid="remove" (click)="remove.emit(entry().id)">Delete</button>
      </span>
    </div>
  `,
})
export class EntryItem {
  readonly entry = input.required<ExerciseSet>();
  readonly remove = output<string>();
  readonly changed = output<ExerciseSet>();

  protected addRep(): void {
    // ❌ this.entry().reps++  mutates the parent's object behind its back.
    // ✅ Describe the change and let the owner apply it.
    const current = this.entry();
    this.changed.emit({ ...current, reps: current.reps + 1 });
  }
}
```

```typescript
// entry-list.ts (presentational, re-emits its children's events)
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EntryItem } from './entry-item';
import { ExerciseSet } from './exercise-set.model';

@Component({
  selector: 'app-entry-list',
  imports: [EntryItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="divide-y rounded border">
      @for (entry of entries(); track entry.id) {
        <li>
          <app-entry-item
            [entry]="entry"
            (remove)="remove.emit($event)"
            (changed)="changed.emit($event)"
          />
        </li>
      } @empty {
        <li class="p-3">No entries yet.</li>
      }
    </ul>
  `,
})
export class EntryList {
  readonly entries = input.required<ExerciseSet[]>();
  readonly remove = output<string>();
  readonly changed = output<ExerciseSet>();
}
```

```typescript
// diary-page.ts (smart, the single source of truth)
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EntryList } from './entry-list';
import { DiaryService } from './diary.service';
import { ExerciseSet } from './exercise-set.model';

@Component({
  selector: 'app-diary-page',
  imports: [EntryList],
  template: `
    <h1>Workout diary</h1>
    <app-entry-list [entries]="entries()" (remove)="remove($event)" (changed)="save($event)" />
  `,
})
export class DiaryPage {
  private readonly diary = inject(DiaryService);
  protected readonly entries = signal<ExerciseSet[]>([]);

  constructor() {
    this.diary
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe((list) => this.entries.set(list));
  }

  protected remove(id: string): void {
    this.diary.remove(id).subscribe(() =>
      this.entries.update((list) => list.filter((entry) => entry.id !== id)),
    );
  }

  protected save(updated: ExerciseSet): void {
    this.diary.update(updated).subscribe((saved) =>
      this.entries.update((list) => list.map((entry) => (entry.id === saved.id ? saved : entry))),
    );
  }
}
```

**Why this works:** only `DiaryPage` ever writes to `entries`, and it always writes a *new* array (`filter`, `map`). The item and list are reusable and know nothing about HTTP. `track entry.id` means that when one entry changes, Angular updates one row instead of rebuilding the list.

### 3. Best-Practice Example: Derived display data and an isolated unit test

Presentational components can still compute things for display, as long as they're derived from inputs. Here a stats card turns a list into a total volume, and a test checks it without any services.

```typescript
// volume-card.ts (presentational, derived display state)
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ExerciseSet } from './exercise-set.model';

@Component({
  selector: 'app-volume-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded border p-4">
      <h2 class="font-bold">Total volume</h2>
      <p data-testid="volume">{{ volume() }} reps</p>
      @if (isPersonalBest()) {
        <p class="text-emerald-600">New personal best!</p>
      }
    </section>
  `,
})
export class VolumeCard {
  readonly entries = input.required<ExerciseSet[]>();
  readonly previousBest = input(0);

  protected readonly volume = computed(() =>
    this.entries().reduce((total, entry) => total + entry.sets * entry.reps, 0),
  );
  protected readonly isPersonalBest = computed(() => this.volume() > this.previousBest());
}
```

```typescript
// volume-card.spec.ts
import { TestBed } from '@angular/core/testing';
import { VolumeCard } from './volume-card';

describe('VolumeCard', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [VolumeCard] }));

  it('shows the total volume and flags a personal best', () => {
    const fixture = TestBed.createComponent(VolumeCard);
    fixture.componentRef.setInput('entries', [
      { id: '1', exercise: 'Squat', sets: 3, reps: 10 },
      { id: '2', exercise: 'Deadlift', sets: 2, reps: 5 },
    ]);
    fixture.componentRef.setInput('previousBest', 30);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelector('[data-testid="volume"]').textContent).toContain('40');
    expect(text).toContain('New personal best!');
  });
});
```

```typescript
// entry-item.spec.ts: outputs are just as easy to test
it('emits an updated copy when +1 rep is clicked', () => {
  const fixture = TestBed.createComponent(EntryItem);
  const original = { id: '1', exercise: 'Squat', sets: 3, reps: 10 };
  fixture.componentRef.setInput('entry', original);
  fixture.detectChanges();

  let emitted: ExerciseSet | undefined;
  fixture.componentInstance.changed.subscribe((value) => (emitted = value));
  fixture.nativeElement.querySelector('[data-testid="add-rep"]').click();

  expect(emitted?.reps).toBe(11);
  expect(original.reps).toBe(10); // the input was not mutated
});
```

**Why this is best practice:** the derived values use `computed()`, so they update exactly when the inputs change and cost nothing otherwise. The tests need no `HttpClient`, router, or service mocks, which is the payoff of keeping components presentational. The second test even proves the component respects immutability.

## Common Mistakes

- **Mutating an input object.** `this.entry().reps++` changes the parent's data without the parent knowing. `OnPush` parents may not re-render, and the state now changes from two places. Emit an event instead.
- **Mutating arrays in place.** `list.push(x); return list;` inside `signal.update()` keeps the same reference, so signals and `OnPush` components may not update. Return a new array.
- **Injecting services into presentational components "just this once".** As soon as a card injects `HttpClient` or the router, it stops being reusable and becomes hard to test.
- **Making every component smart.** If several siblings each fetch and own their own copy of the same data, they drift out of sync. Lift the state to one owner.
- **Prop drilling five levels deep.** Re-emitting through two or three layers is fine. Beyond that, move the shared state into a service.
- **Business logic inside presentational components.** Formatting for display is fine. Rules like "a user can't delete a locked entry" belong in the smart component or a service.
- **Forgetting `track` in `@for`.** Without a stable key, replacing the array rebuilds every row and loses focus and scroll state.

## Best Practices

- Make routed pages smart, and keep most of their children presentational.
- Give presentational components a small, typed API: `input.required<T>()` for essential data, `output<T>()` for user intents.
- Use `ChangeDetectionStrategy.OnPush` on presentational components. With signal inputs and immutable data, it's both safe and fast.
- Name outputs after what the user did (`remove`, `addToCart`, `changed`), not after how the parent should handle it, and don't prefix them with `on`.
- Update state immutably in one place, with `set()` or `update()` returning new objects and arrays.
- Derive display values with `computed()` instead of storing duplicate state.
- Re-emit events for shallow trees. Switch to a shared service when inputs and outputs start passing through components that don't use them.
- Test presentational components with `fixture.componentRef.setInput()` and by subscribing to their outputs.

## Summary

- Smart components own state, inject services, and compose the page. Presentational components render inputs and emit outputs.
- Data flows down through inputs and events flow up through outputs, so every state change happens in one place.
- Update state immutably. Signals and `OnPush` compare references, so mutated arrays and objects can silently fail to update the view.
- Presentational components can keep visual state and derive display values with `computed()`, but they don't own business data.
- Bubble events through a few layers explicitly. Use a shared service when prop drilling gets deep.
- Presentational components are reusable and easy to test because they don't depend on services.

## Flash Cards

**Q: What is the main job of a presentational component?**
A: To display the data it receives through inputs and report user actions through outputs, without knowing where the data came from or what happens next.

**Q: Why should a child emit an event instead of changing an object it received as an input?**
A: The object belongs to the parent. Changing it directly hides the change from the owner, breaks the single source of truth, and may not trigger updates in `OnPush` components or signals.

**Q: Why doesn't `list.push(x); return list;` inside `signal.update()` reliably update the view?**
A: Signals compare old and new values with `Object.is`. Returning the same array reference looks like "no change", so dependents aren't notified. Return a new array, for example `[...list, x]`.

**Q: When should you stop bubbling events and use a shared service instead?**
A: When inputs and outputs pass through several layers that don't use them (prop drilling), or when unrelated parts of the page need the same state.

**Q: How do you set a signal input in a unit test?**
A: Call `fixture.componentRef.setInput('inputName', value)`, then `fixture.detectChanges()`.

## Exercises

**Easy**
Split a `UserProfilePage` that fetches a user and renders their avatar, name, and bio into a smart `UserProfilePage` and a presentational `UserCard` with `user = input.required<User>()`. Add `OnPush` to the card.

**Medium**
Build a `TodoPage` (smart) that owns `todos = signal<Todo[]>([])`, a `TodoList` (presentational), and a `TodoItem` (presentational) with `toggle` and `remove` outputs. Bubble both events up to the page and update the signal immutably. Add a unit test proving `TodoItem` emits a toggled *copy* and leaves its input unchanged.

**Challenging**
Take a screen in this portal, such as the dashboard, and sketch its component tree. Mark each component smart or presentational. Find one place where a presentational component injects a service or receives inputs it only passes along, refactor it, and write a test for the newly presentational component that uses no service mocks.

## Further Reading

- [Angular: Component inputs](https://angular.dev/guide/components/inputs)
- [Angular: Component outputs](https://angular.dev/guide/components/outputs)
- [Angular: Signals](https://angular.dev/guide/signals)
- [Angular: Skipping component subtrees with OnPush](https://angular.dev/best-practices/skipping-subtrees)
- [Angular: Basics of testing components](https://angular.dev/guide/testing/components-basics)
- [Dan Abramov: Presentational and Container Components (the original idea)](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)
