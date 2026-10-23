---
id: lesson-33
slug: singleton-services-facade-pattern
title: "Singleton Services & the Facade Pattern"
level: advanced
order: 31
duration: 55
tags:
  - services
  - design-patterns
  - singleton
  - facade
  - state-management
---

## Learning Objectives

By the end of this lesson you will be able to:

- Explain how Angular's injector turns a `providedIn: 'root'` service into a **singleton**, and why that makes services a natural home for shared state.
- Choose the right scope for a service (root, route, or component) and spot the bug where a component accidentally creates a second instance.
- Design a **facade**: a feature service that exposes read-only signals and intent methods, and hides HTTP, caching, and error handling.
- Update facade state immutably, including optimistic updates with rollback.
- Keep components thin by consuming a facade from smart components only.
- Test a facade with a stubbed API, and test components with a fake facade.

## Why This Concept Exists

When a component talks to `HttpClient` directly, it has to know a lot: the URL, the response shape, when to reload, how to handle errors, and which other components need the same data. Spread that across a few screens and you get:

- **Duplicate requests and duplicate state.** Two components each fetch the diary, keep their own copy, and show different numbers after an edit.
- **Fat components.** Half of every component is subscription and error-handling code instead of UI.
- **Fragile changes.** Renaming one API field means editing every component that reads the response.
- **Slow tests.** Testing a page means mocking HTTP for every scenario.

Two patterns fix this together. The **Singleton** pattern, which Angular's DI gives you for free, means one shared instance holds the state. The **Facade** pattern puts a simple, purpose-built interface in front of the messy details. Components ask the facade for data and tell it what the user wants to do. Everything else is the facade's job.

## Concept Explanation

### Singletons come from the injector

A **singleton** is a class with exactly one instance that everyone shares. In plain TypeScript you'd have to hand-roll that with a static `getInstance()` method. In Angular, the injector does it: it creates a service the first time something asks for it, then hands the **same instance** to everyone else who asks the same injector.

`@Injectable({ providedIn: 'root' })` registers the service with the root injector, so there's one instance for the whole app. It's also tree-shakable: if nothing injects the service, it isn't included in the bundle.

### Choosing a scope

| Where it's provided | Instances | Use it for |
|---|---|---|
| `providedIn: 'root'` | One per app | App-wide state: auth, cart, user preferences, most feature facades |
| A route's `providers` | One per route subtree | State shared by the pages of one feature, kept out of the root injector |
| A component's `providers` | One per component instance (shared with its children) | State that must be private to one widget and reset when it's destroyed, like an editor or a wizard |

### The accidental second instance

The most common singleton bug: a service is `providedIn: 'root'`, and someone *also* lists it in a component's `providers`. Angular now creates a second, separate instance for that component and its children. Changes made there never reach the rest of the app. If "the badge doesn't update", check for this first.

### The Facade pattern

A **facade** is a simple interface in front of a complicated subsystem. In an Angular feature, the subsystem is usually: HTTP calls, response mapping, caching, loading and error flags, retries, and coordination between several services.

A good Angular facade has:

1. **Private, writable state.** Usually one `signal` holding a state object.
2. **Public, read-only selectors.** `computed()` signals such as `entries`, `loading`, `error`, and derived values like `totalVolume`.
3. **Intent methods.** Methods named after what the user wants (`load()`, `add(entry)`, `remove(id)`), not after HTTP verbs.
4. **No leaked internals.** Components never see `HttpClient`, raw response shapes, or writable signals.

It often sits on top of a thin **API service** that only does HTTP and mapping. That split keeps each class small: the API service knows endpoints, and the facade knows state and rules.

```text
Smart component ──► Facade (state + intents) ──► API service (HTTP only) ──► Backend
       ▲                    │
       └──── read-only signals
```

### Immutable updates and optimistic UI

Signals notify readers when the value changes by reference. Every update should produce a new state object, which is easy with a small `patch()` helper: `state.update(s => ({ ...s, ...changes }))`.

An **optimistic update** applies a change to the UI *before* the server confirms it, then rolls it back if the request fails. It makes actions like "delete" feel instant. The facade is the right place for this, because it owns both the state and the request.

### Facade vs. a full store library

A signal-based facade covers most apps. Consider NgRx SignalStore or the global NgRx Store (see the **State Management with NgRx & Component Store** lesson) when many features share and modify the same state, when you need time-travel debugging or strict event logs, or when a large team wants one enforced convention. A facade is also a good stepping stone: components that only talk to a facade don't change when you swap its internals for a store later.

## Key Terminology

- **Singleton**: a class with exactly one shared instance. In Angular, one instance per injector.
- **Injector**: the object that creates and caches service instances. Angular has a tree of them: root, route, and component injectors.
- **`providedIn: 'root'`**: registers a tree-shakable service with the root injector, making it an app-wide singleton.
- **Facade**: a service that offers a simple interface (state plus intent methods) over a more complex subsystem.
- **Selector**: a read-only signal (often `computed()`) that exposes a slice of state or a derived value.
- **Intent method**: a method that describes what the user wants (`remove(id)`), leaving the "how" to the facade.
- **Optimistic update**: updating the UI immediately and rolling back if the server rejects the change.
- **API service**: a thin service that only performs HTTP requests and maps responses.

## Syntax Overview

```typescript
interface FeatureState {
  items: Item[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class FeatureFacade {
  private readonly api = inject(FeatureApi);
  private readonly state = signal<FeatureState>({ items: [], status: 'idle', error: null });

  // Read-only selectors
  readonly items = computed(() => this.state().items);
  readonly loading = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().error);

  // Intent methods
  load(): void { /* call api, patch state */ }
  remove(id: string): void { /* optimistic update + rollback */ }

  private patch(changes: Partial<FeatureState>): void {
    this.state.update((current) => ({ ...current, ...changes }));
  }
}
```

## Real World Analogy

Think of a hotel concierge.

- You walk up and say "a table for two at 8, somewhere quiet". That's an **intent method**.
- Behind the desk, the concierge calls restaurants, checks waiting lists, and confirms the booking. That's the **subsystem** the facade hides. You never learn the restaurant's phone number.
- There's **one** concierge desk for the whole hotel, so when another guest asks "is the Italian place full tonight?", the answer reflects your booking. That's the **singleton**.
- If someone set up a *second* concierge desk in one hallway (a component-level provider), guests there would get answers that ignore everyone else's bookings.
- A whiteboard behind the desk shows today's bookings. Guests can read it, but only the concierge writes on it. Those are **read-only selectors**.

## Examples

### 1. Basic Example: A singleton cart shared by two unrelated components

```typescript
// cart.service.ts
import { Injectable, computed, signal } from '@angular/core';

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<CartLine[]>([]);

  readonly lines = this._lines.asReadonly();
  readonly count = computed(() => this._lines().reduce((total, line) => total + line.quantity, 0));
  readonly total = computed(() =>
    this._lines().reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );

  add(product: Product): void {
    this._lines.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      return existing
        ? lines.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...lines, { product, quantity: 1 }];
    });
  }
}
```

```typescript
// cart-badge.ts: lives in the navbar
@Component({
  selector: 'app-cart-badge',
  template: `<span class="badge">🛒 {{ cart.count() }}</span>`,
})
export class CartBadge {
  protected readonly cart = inject(CartService);
}

// product-page.ts: a routed page, nowhere near the navbar in the tree
@Component({
  selector: 'app-product-page',
  // providers: [CartService],  ❌ would create a second cart; the badge would never change
  template: `<button type="button" (click)="cart.add(product)">Add to cart</button>`,
})
export class ProductPage {
  protected readonly cart = inject(CartService);
  protected readonly product: Product = { id: 'p1', name: 'Kettlebell', price: 39 };
}
```

**Why this works:** both components inject the same root instance, so clicking "Add to cart" updates the badge immediately, even though neither component knows the other exists. The writable `_lines` signal is private, so the only way to change the cart is through `add()`.

### 2. Real-World Example: A diary facade over an API service

The API service only knows HTTP. The facade owns state, caching, and error handling, and offers intent methods. The page stays tiny.

```typescript
// diary.api.ts: HTTP and mapping only
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ExerciseSet, NewExerciseSet } from './exercise-set.model';

@Injectable({ providedIn: 'root' })
export class DiaryApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/diary';

  list(): Observable<ExerciseSet[]> {
    return this.http.get<{ items: ExerciseSet[] }>(this.url).pipe(map((res) => res.items));
  }

  create(entry: NewExerciseSet): Observable<ExerciseSet> {
    return this.http.post<ExerciseSet>(this.url, entry);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

```typescript
// diary.facade.ts: state, rules, and intents
import { Injectable, computed, inject, signal } from '@angular/core';
import { DiaryApi } from './diary.api';
import { ExerciseSet, NewExerciseSet } from './exercise-set.model';

interface DiaryState {
  entries: ExerciseSet[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
}

const initialState: DiaryState = { entries: [], status: 'idle', error: null };

@Injectable({ providedIn: 'root' })
export class DiaryFacade {
  private readonly api = inject(DiaryApi);
  private readonly state = signal<DiaryState>(initialState);

  readonly entries = computed(() => this.state().entries);
  readonly loading = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().error);
  readonly totalVolume = computed(() =>
    this.entries().reduce((sum, entry) => sum + entry.sets * entry.reps, 0),
  );

  /** Loads once and reuses the cached list unless `force` is true. */
  load(force = false): void {
    const { status } = this.state();
    if (!force && (status === 'loading' || status === 'loaded')) return;

    this.patch({ status: 'loading', error: null });
    this.api.list().subscribe({
      next: (entries) => this.patch({ entries, status: 'loaded' }),
      error: () => this.patch({ status: 'error', error: 'Could not load your diary.' }),
    });
  }

  add(entry: NewExerciseSet): void {
    this.api.create(entry).subscribe({
      next: (saved) => this.patch({ entries: [...this.state().entries, saved], error: null }),
      error: () => this.patch({ error: 'Could not save the entry.' }),
    });
  }

  /** Optimistic: the entry disappears immediately and comes back if the server fails. */
  remove(id: string): void {
    const entries = this.state().entries;
    const index = entries.findIndex((entry) => entry.id === id);
    if (index === -1) return;
    const removed = entries[index];

    this.patch({ entries: entries.filter((entry) => entry.id !== id), error: null });

    this.api.remove(id).subscribe({
      error: () => {
        const restored = [...this.state().entries];
        restored.splice(index, 0, removed);
        this.patch({ entries: restored, error: 'Could not delete the entry.' });
      },
    });
  }

  private patch(changes: Partial<DiaryState>): void {
    this.state.update((current) => ({ ...current, ...changes }));
  }
}
```

```typescript
// diary-page.ts: a smart component that only talks to the facade
import { Component, inject } from '@angular/core';
import { EntryList } from './entry-list';
import { DiaryFacade } from './diary.facade';

@Component({
  selector: 'app-diary-page',
  imports: [EntryList],
  template: `
    @if (diary.loading()) {
      <p>Loading…</p>
    }
    @if (diary.error(); as message) {
      <p role="alert" class="text-red-600">{{ message }}</p>
    }
    <p>Total volume: {{ diary.totalVolume() }} reps</p>
    <app-entry-list [entries]="diary.entries()" (remove)="diary.remove($event)" />
  `,
})
export class DiaryPage {
  protected readonly diary = inject(DiaryFacade);

  constructor() {
    this.diary.load();
  }
}
```

**Why this works:** the page has no `HttpClient`, no `subscribe()`, and no error-handling code. Navigating away and back doesn't refetch, because the facade caches the list. Any other component that injects `DiaryFacade`, such as a dashboard widget showing `totalVolume()`, sees the same data and updates with it. Subscribing inside a root service is safe here because HTTP observables complete after one response.

### 3. Best-Practice Example: Testing the facade and the page separately

Because the layers are separate, each can be tested with a simple stand-in for the layer below.

```typescript
// diary.facade.spec.ts: stub the API, test the rules
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DiaryApi } from './diary.api';
import { DiaryFacade } from './diary.facade';
import { ExerciseSet } from './exercise-set.model';

const squat: ExerciseSet = { id: '1', exercise: 'Squat', sets: 3, reps: 10 };
const deadlift: ExerciseSet = { id: '2', exercise: 'Deadlift', sets: 2, reps: 5 };

describe('DiaryFacade', () => {
  let api: jasmine.SpyObj<DiaryApi>;
  let facade: DiaryFacade;

  beforeEach(() => {
    api = jasmine.createSpyObj<DiaryApi>('DiaryApi', ['list', 'create', 'remove']);
    TestBed.configureTestingModule({ providers: [{ provide: DiaryApi, useValue: api }] });
    facade = TestBed.inject(DiaryFacade);
  });

  it('loads once and reuses the cached list', () => {
    api.list.and.returnValue(of([squat]));
    facade.load();
    facade.load();
    expect(api.list).toHaveBeenCalledTimes(1);
    expect(facade.entries()).toEqual([squat]);
  });

  it('puts a deleted entry back when the server call fails', () => {
    api.list.and.returnValue(of([squat, deadlift]));
    api.remove.and.returnValue(throwError(() => new Error('500')));

    facade.load();
    facade.remove(squat.id);

    expect(facade.entries()).toEqual([squat, deadlift]);
    expect(facade.error()).toBe('Could not delete the entry.');
  });
});
```

```typescript
// diary-page.spec.ts: replace the whole facade with a fake
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DiaryPage } from './diary-page';
import { DiaryFacade } from './diary.facade';
import { ExerciseSet } from './exercise-set.model';

class FakeDiaryFacade {
  readonly entries = signal<ExerciseSet[]>([{ id: '1', exercise: 'Squat', sets: 3, reps: 10 }]);
  readonly loading = signal(false);
  readonly error = signal<string | null>('Could not load your diary.');
  readonly totalVolume = signal(30);
  readonly load = jasmine.createSpy('load');
  readonly remove = jasmine.createSpy('remove');
}

describe('DiaryPage', () => {
  it('asks the facade to load and shows its error message', () => {
    TestBed.configureTestingModule({
      imports: [DiaryPage],
      providers: [{ provide: DiaryFacade, useClass: FakeDiaryFacade }],
    });

    const fixture = TestBed.createComponent(DiaryPage);
    fixture.detectChanges();
    const fake = TestBed.inject(DiaryFacade) as unknown as FakeDiaryFacade;

    expect(fake.load).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Could not load your diary.',
    );
  });
});
```

**Why this is best practice:** the facade test checks the rules (caching, rollback) without HTTP, because `of()` and `throwError()` run synchronously. The page test checks the UI without any of the facade's logic. Swapping the real facade for a fake is one line, which is the payoff of components depending on a small, clear interface.

## Common Mistakes

- **Providing a root service again in a component.** `providers: [CartService]` on a component creates a second instance, so that part of the app stops seeing shared changes. Only add component providers when you *want* a private instance.
- **Exposing writable signals.** `readonly entries = signal([])` lets any component call `facade.entries.set([])`. Keep the writable signal private and expose `asReadonly()` or `computed()`.
- **Mutating state in place.** `this.state().entries.push(saved)` keeps the same reference, so readers aren't notified. Always build a new object or array.
- **Naming methods after HTTP verbs.** `postEntry()` and `getEntries()` leak the subsystem. Name intents after what the user wants: `add()`, `load()`.
- **One "god facade" for the whole app.** A single facade with 40 methods is a monolith in disguise. Create one facade per feature.
- **Leaking observables of raw responses.** If components still `subscribe()` to `facade.http$` and map the response, the facade isn't hiding anything.
- **Facades depending on each other in circles.** If `DiaryFacade` injects `ExercisesFacade` and vice versa, extract the shared piece into a lower-level service.
- **Long-lived subscriptions in services without cleanup.** HTTP calls complete on their own, but subscriptions to things like `interval()` or WebSocket streams need a teardown plan (`takeUntilDestroyed(this.destroyRef)` or a finite operator).

## Best Practices

- Use `providedIn: 'root'` for shared services, and reserve route and component `providers` for deliberate scoping.
- Give each feature one facade, with private writable state, public read-only selectors, and intent methods.
- Keep HTTP in a thin API service, and keep state and rules in the facade.
- Store state as one object updated through a `patch()` helper, so every change is immutable and easy to follow.
- Derive values with `computed()` instead of storing them alongside the data they come from.
- Use optimistic updates for quick, reversible actions (delete, toggle, reorder), and always write the rollback path.
- Let only smart components inject facades. Presentational components still get data through inputs.
- Test facades with stubbed API services, and test components with fake facades.

## Summary

- Angular's injector creates one instance per injector, so `providedIn: 'root'` services are app-wide singletons. That makes them a natural home for shared state.
- Route providers scope a service to a feature, and component providers create a private instance per component. Providing a root service again in a component is a common bug.
- A facade gives components a small interface (read-only signals and intent methods) and hides HTTP, caching, and error handling.
- Facade state should be private, updated immutably, and exposed through `computed()` selectors.
- Optimistic updates make actions feel instant. The facade owns both the change and the rollback.
- Splitting API service, facade, and component makes each layer easy to test with a simple stand-in for the one below.

## Flash Cards

**Q: How does Angular make a `providedIn: 'root'` service a singleton?**
A: The root injector creates the service the first time it's requested and returns that same cached instance to every later request in the app.

**Q: A cart badge doesn't update when a product page adds items. Both use `CartService`, which is `providedIn: 'root'`. What's the likely cause?**
A: The product page (or an ancestor) also lists `CartService` in its `providers`, creating a second, separate instance for that part of the tree.

**Q: What should a facade expose to components?**
A: Read-only signals for state and derived values, plus intent methods like `load()`, `add()`, and `remove()`. Never `HttpClient`, raw responses, or writable signals.

**Q: What is an optimistic update, and what must you always write alongside it?**
A: Applying a change to the UI before the server confirms it. You must always write the rollback that restores the previous state if the request fails.

**Q: When might you move from a signal facade to NgRx?**
A: When many features share and modify the same state, when you need strict event logs or time-travel debugging, or when a large team needs one enforced convention.

## Exercises

**Easy**
Build a `ThemeService` (`providedIn: 'root'`) with a private `signal<'light' | 'dark'>`, a read-only `theme` selector, and a `toggle()` method. Use it from a navbar button and from a settings page, and confirm both stay in sync. Then add `providers: [ThemeService]` to the settings page, observe the bug, and remove it.

**Medium**
Create an `ExercisesApi` (HTTP only) and an `ExercisesFacade` with `exercises`, `loading`, and `error` selectors, a cached `load()`, and an `add(description)` intent. Make the page that lists exercises inject only the facade. Write a facade test with a stubbed `ExercisesApi` that proves `load()` only calls the API once.

**Challenging**
Add an optimistic `rename(id, description)` intent to `ExercisesFacade`. Update the UI immediately, call the API, and roll back to the old description (and set an error message) if the call fails. Write tests for both the success and failure paths, and make sure a rename that fails doesn't undo a *different* exercise that was renamed successfully in the meantime.

## Further Reading

- [Angular: Creating and using services](https://angular.dev/guide/di/creating-and-using-services)
- [Angular: Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [Angular: Signals](https://angular.dev/guide/signals)
- [Angular: Testing services](https://angular.dev/guide/testing/services)
- [Refactoring Guru: Facade pattern](https://refactoring.guru/design-patterns/facade)
- [Refactoring Guru: Singleton pattern](https://refactoring.guru/design-patterns/singleton)
- [NgRx SignalStore](https://ngrx.io/guide/signals/signal-store)
