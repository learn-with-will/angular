---
title: "State Management with NgRx Store & SignalStore"
level: "advanced"
estimatedTime: 75
tags:
  - angular
  - ngrx
  - state-management
  - rxjs
  - signal-store
  - signals
  - effects
---

# State Management with NgRx & Component Store

## Learning Objectives

By the end of this lesson, you will be able to:

1. Explain the Redux-inspired architecture behind NgRx (actions, reducers, selectors, effects) and identify when an Angular app actually needs it.
2. Configure NgRx Store, Effects, and DevTools in a standalone Angular application using the modern `provide*` functions.
3. Model feature state with `createActionGroup`, `createReducer`, `createFeature`, and memoized selectors, following current NgRx conventions.
4. Use NgRx **SignalStore** (`@ngrx/signals`) to manage local or feature-level state (loading flags, filters, pagination) with signals, without polluting the global store.
5. Decide — with concrete criteria — when to reach for the global `Store`, when a `signalStore` is enough, and how to recognize the older `ComponentStore` in existing code.

---

## Why This Concept Exists

As an Angular application grows, state stops living in one place. A "logged-in user" might be needed by the header, the sidebar, and a dozen unrelated feature modules. A "shopping cart" might be updated from a product page but read from a checkout page that was never on screen when the update happened. If every component fetches, stores, and mutates its own copy of this data, you get:

- **Duplicated state** — the same data fetched and stored in multiple places, which drifts out of sync.
- **Prop-drilling and tangled `@Output()` chains** — passing data through components that don't care about it just to reach the one that does.
- **Unpredictable mutations** — any service or component can mutate a shared object at any time, making bugs hard to reproduce.
- **Hard-to-trace async bugs** — race conditions between multiple in-flight HTTP calls, with no single place to see "what happened and in what order."

NgRx solves this by giving your application **one predictable, observable source of truth**, updated only through explicit, traceable events (actions), with side effects (HTTP calls, navigation, logging) isolated from your components. **SignalStore** solves a *related but different* problem: not every piece of state deserves to live in the global store. A component's or feature's local state (is this dropdown open, what page am I on, what's the current filter text) doesn't need to be visible app-wide — but it still benefits from the same immutable, predictable patterns. `signalStore` gives you that with signals, and without the full ceremony of actions and reducers.

---

## Concept Explanation

### The global Store: a Redux-style container

NgRx's `Store` implements the **Redux pattern** on top of RxJS:

- **State** is a single, immutable JavaScript object (a tree) representing your whole application (or a lazily-loaded slice of it).
- **Actions** are plain, typed objects describing *something that happened* (`[Products Page] Load Products`). They do not contain logic.
- **Reducers** are pure functions: `(state, action) => newState`. Given the same inputs, they always produce the same output, and they never mutate the existing state — they return a new object.
- **Selectors** are memoized, composable functions that read (and derive) data from the state tree efficiently.
- **Effects** listen for actions, perform side effects (HTTP requests, timers, browser APIs), and dispatch new actions with the result. Reducers stay pure because *all* impure work happens in effects.

Data flows in one direction only:

```
Component → dispatch(action) → Reducer → new State → Selector → Component (re-render)
                                   ↑
                                Effect (listens for actions, calls APIs, dispatches new actions)
```

This unidirectional flow is what makes NgRx apps predictable: to understand *any* state change, you only need to find the action that caused it.

### SignalStore: the same discipline, at a smaller scale

`@ngrx/signals` is a separate, lightweight library. Its `signalStore()` function builds an injectable store out of small, composable *features*. There are no actions or reducers; you call typed methods directly:

- **State** — `withState(initialState)` turns each property into a signal (`store.searchTerm()`, `store.loading()`).
- **Computed values** — `withComputed(...)` derives read-only signals from the state, just like `computed()`.
- **Methods** — `withMethods(...)` adds the operations components call (`store.search('shoes')`). Methods update state immutably with `patchState(store, { ... })`.
- **RxJS-based methods** — `rxMethod()` (from `@ngrx/signals/rxjs-interop`) lets a method use operators such as `debounceTime` and `switchMap`, with subscriptions cleaned up when the store is destroyed.

Where you provide the store decides its lifetime. Add it to a component's `providers` and every component instance gets its own store, created and destroyed with it. Pass `{ providedIn: 'root' }` to `signalStore()` for one app-wide instance.

> **ComponentStore in existing code:** before SignalStore, NgRx offered `@ngrx/component-store`, an RxJS-based class you extend (`class FilterStore extends ComponentStore<FilterState>`) with `select()`, `updater()`, and `effect()`. It is still supported and you'll meet it in many codebases, but for new local or feature state the NgRx team recommends `signalStore`, because it's signal-native and needs no `toSignal()` bridging. The concepts map one to one: `select` → `withComputed`, `updater` → a method calling `patchState`, `effect` → `rxMethod`.

---

## Key Terminology

| Term | Meaning |
|---|---|
| **Store** | The global, app-wide, observable state container (`Store<T>` from `@ngrx/store`). |
| **Action** | A plain object describing an event, e.g. `{ type: '[Products Page] Load Products' }`. Created with `createActionGroup`. |
| **Reducer** | A pure function that computes new state from the current state and an action. Built with `createReducer` + `on()`. |
| **Selector** | A memoized function that reads/derives data from state. Built with `createSelector` or generated by `createFeature`. |
| **Effect** | A class that listens to a stream of actions and performs side effects, dispatching new actions with the result. Built with `createEffect`. |
| **Feature State** | A named slice of the store (e.g. `'products'`), registered independently — often lazily — with `provideState`. |
| **SignalStore** | An injectable, signal-based store built with `signalStore()` from `@ngrx/signals`; NgRx's recommended choice for local and feature-level state. |
| **`withState` / `withComputed` / `withMethods`** | SignalStore features that add state signals, derived signals, and methods to a store. |
| **`patchState`** | The function SignalStore methods use to update state immutably: `patchState(store, { loading: true })`. |
| **`rxMethod`** | A SignalStore helper (from `@ngrx/signals/rxjs-interop`) for methods built from RxJS operators; it unsubscribes when the store is destroyed. |
| **tapResponse** | An RxJS operator (from `@ngrx/operators`) that safely handles the success/error of an inner Observable inside an effect or `rxMethod`, without terminating the outer stream on error. |
| **ComponentStore** | The older, RxJS-based local store from `@ngrx/component-store`. Still supported; common in existing code. |

---

## Syntax Overview

### 1. Registering the global Store (standalone bootstrap)

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideStore(),                 // root store, no reducers yet — features register their own
    provideEffects(),                // root effects registry
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
});
```

`provideStore()`, `provideEffects()`, and `provideStoreDevtools()` are the standalone equivalents of the old `StoreModule.forRoot()`, `EffectsModule.forRoot()`, and `StoreDevtoolsModule.instrument()`. Feature slices are added later with `provideState()` / `provideEffects(SomeEffects)`, ideally at the route level so they load lazily.

### 2. Defining actions with `createActionGroup`

```typescript
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const CounterActions = createActionGroup({
  source: 'Counter',
  events: {
    Increment: emptyProps(),
    Decrement: emptyProps(),
    'Set Value': props<{ value: number }>(),
  },
});
// Usage: CounterActions.increment(), CounterActions.setValue({ value: 5 })
```

`createActionGroup` replaces the older pattern of exporting one `createAction(...)` per action. It gives you strongly-typed action creators grouped under a common `source`, with far less boilerplate.

### 3. Reducers and feature state with `createFeature`

```typescript
import { createFeature, createReducer, on } from '@ngrx/store';

export const counterFeature = createFeature({
  name: 'counter',
  reducer: createReducer(
    { count: 0 },
    on(CounterActions.increment, (state) => ({ count: state.count + 1 })),
  ),
});

// Auto-generated: counterFeature.selectCount, counterFeature.selectCounterState, counterFeature.name
export const { selectCount } = counterFeature;
```

`createFeature` bundles a reducer with its state shape and **automatically generates one selector per state property**, so you rarely write `createSelector` by hand for simple reads.

### 4. Effects

```typescript
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

@Injectable()
export class ProductsEffects {
  private readonly actions$ = inject(Actions);
  private readonly productsService = inject(ProductsService);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsPageActions.loadProducts),
      switchMap(() =>
        this.productsService.getAll().pipe(
          map((products) => ProductsApiActions.loadSuccess({ products })),
          catchError((error: Error) => of(ProductsApiActions.loadFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
```

### 5. SignalStore skeleton

```typescript
import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export const FilterStore = signalStore(
  withState({ term: '' }),
  withComputed(({ term }) => ({
    hasTerm: computed(() => term().length > 0),
  })),
  withMethods((store) => ({
    setTerm(term: string): void {
      patchState(store, { term });
    },
  })),
);

// In a component: providers: [FilterStore], then store = inject(FilterStore);
// Read with store.term() and store.hasTerm(); change with store.setTerm('shoes').
```

Every state property becomes a read-only signal on the store. Only the store's own methods can change state, through `patchState`.

---

## Real World Analogy

Think of the **global NgRx Store** as a company's **central ledger and warehouse system**. Every department (feature module) can read from it and request changes, but no one is allowed to edit the ledger directly — they submit a *change request* (an action). A dedicated clerk (the reducer) applies the request following strict rules and writes the new balance. Anything that requires going outside the building — calling a supplier, checking a bank API — is handled by a separate courier (an effect), who comes back with a result and submits *that* as a new change request. Because every change is logged as a discrete, timestamped request, you can always answer "why does the ledger say this?" by looking at the log — this is exactly what NgRx DevTools' time-travel debugging gives you.

A **SignalStore** provided in a component, by contrast, is like a **department's own filing cabinet**. The sales team doesn't need to route "what page of results am I currently viewing" through the company-wide ledger — that's local, disposable information relevant only while that department's office is open. It still gets filed properly (immutably, reactively) but it's discarded the moment that department's office closes (the component is destroyed).

---

## Examples

### Example 1 — Basic: A Counter with Global Store

This is the smallest complete NgRx feature: an action group, a reducer wrapped in `createFeature`, and a component reading/writing through the store. It intentionally has no HTTP calls, so you can focus purely on the action → reducer → selector cycle.

```typescript
// state/counter.actions.ts
import { createActionGroup, emptyProps } from '@ngrx/store';

export const CounterActions = createActionGroup({
  source: 'Counter',
  events: {
    Increment: emptyProps(),
    Decrement: emptyProps(),
    Reset: emptyProps(),
  },
});
```

```typescript
// state/counter.reducer.ts
import { createFeature, createReducer, on } from '@ngrx/store';
import { CounterActions } from './counter.actions';

export interface CounterState {
  count: number;
}

const initialState: CounterState = { count: 0 };

export const counterFeature = createFeature({
  name: 'counter',
  reducer: createReducer(
    initialState,
    on(CounterActions.increment, (state) => ({ count: state.count + 1 })),
    on(CounterActions.decrement, (state) => ({ count: state.count - 1 })),
    on(CounterActions.reset, () => initialState),
  ),
});

// Auto-generated selector: counterFeature.selectCount
export const { selectCount } = counterFeature;
```

```typescript
// counter.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { CounterActions } from './state/counter.actions';
import { selectCount } from './state/counter.reducer';

@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Count: {{ count() }}</p>
    <button (click)="store.dispatch(CounterActions.increment())">+</button>
    <button (click)="store.dispatch(CounterActions.decrement())">-</button>
    <button (click)="store.dispatch(CounterActions.reset())">Reset</button>
  `,
})
export class CounterComponent {
  protected readonly store = inject(Store);
  protected readonly CounterActions = CounterActions;
  protected readonly count = toSignal(this.store.select(selectCount), { initialValue: 0 });
}
```

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { AppComponent } from './app/app.component';
import { counterFeature } from './app/state/counter.reducer';

bootstrapApplication(AppComponent, {
  providers: [provideStore({ [counterFeature.name]: counterFeature.reducer })],
});
```

**Why this matters:** notice the component never mutates `count` directly — it only dispatches intent (`increment()`), and reads the result back through a memoized selector converted to a Signal with `toSignal()`. This is the full Redux loop in its simplest form. Note also that no `standalone: true` flag is needed on the component — standalone is the default for components in current Angular versions.

---

### Example 2 — Real World: Loading a Product List (Store + Effects)

This example shows the pattern you'll use constantly in real apps: dispatch an intent action, let an `Effect` call the API, and reduce the success/failure result into state — including `loading` and `error` flags the template can react to.

```typescript
// models/product.model.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}
```

```typescript
// state/products.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Product } from '../models/product.model';

export const ProductsPageActions = createActionGroup({
  source: 'Products Page',
  events: {
    'Load Products': emptyProps(),
  },
});

export const ProductsApiActions = createActionGroup({
  source: 'Products API',
  events: {
    'Load Success': props<{ products: Product[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
```

```typescript
// products.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from './models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }
}
```

```typescript
// state/products.reducer.ts
import { createFeature, createReducer, on } from '@ngrx/store';
import { Product } from '../models/product.model';
import { ProductsApiActions, ProductsPageActions } from './products.actions';

export interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = { products: [], loading: false, error: null };

export const productsFeature = createFeature({
  name: 'products',
  reducer: createReducer(
    initialState,
    on(ProductsPageActions.loadProducts, (state) => ({ ...state, loading: true, error: null })),
    on(ProductsApiActions.loadSuccess, (state, { products }) => ({ ...state, products, loading: false })),
    on(ProductsApiActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  ),
});

export const { selectProducts, selectLoading, selectError } = productsFeature;
```

```typescript
// state/products.effects.ts
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ProductsService } from '../products.service';
import { ProductsApiActions, ProductsPageActions } from './products.actions';

@Injectable()
export class ProductsEffects {
  private readonly actions$ = inject(Actions);
  private readonly productsService = inject(ProductsService);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsPageActions.loadProducts),
      switchMap(() =>
        this.productsService.getAll().pipe(
          map((products) => ProductsApiActions.loadSuccess({ products })),
          catchError((error: Error) => of(ProductsApiActions.loadFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
```

```typescript
// products.component.ts
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { ProductsPageActions } from './state/products.actions';
import { selectError, selectLoading, selectProducts } from './state/products.reducer';

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <p>Loading products…</p>
    } @else if (error(); as message) {
      <p class="error">{{ message }}</p>
    } @else {
      <ul>
        @for (product of products(); track product.id) {
          <li>{{ product.name }} — {{ product.price | currency }}</li>
        }
      </ul>
    }
  `,
})
export class ProductsComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly products = toSignal(this.store.select(selectProducts), { initialValue: [] });
  protected readonly loading = toSignal(this.store.select(selectLoading), { initialValue: false });
  protected readonly error = toSignal(this.store.select(selectError), { initialValue: null });

  ngOnInit(): void {
    this.store.dispatch(ProductsPageActions.loadProducts());
  }
}
```

```typescript
// products.routes.ts — register feature state lazily, only when this route is visited
import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { productsFeature } from './state/products.reducer';
import { ProductsEffects } from './state/products.effects';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(productsFeature), provideEffects(ProductsEffects)],
    loadComponent: () => import('./products.component').then((m) => m.ProductsComponent),
  },
];
```

**Why this matters:** the component *never* calls `ProductsService` directly — all async work is isolated in `ProductsEffects`, keeping the reducer pure and the component "dumb" (it only dispatches and reads signals). Registering `provideState`/`provideEffects` on the route means this feature's state and effects are only created when a user navigates there — a real performance win in large apps.

---

### Example 3 — Best Practice: Local Filter State with SignalStore

Not every piece of state belongs in the app-wide store. Here, a search box's debounced filter term, loading flag, and result list are entirely local to one widget. A `signalStore` avoids inventing three new global actions and a reducer case just for this widget's internal bookkeeping, while keeping the same immutable, predictable discipline.

```typescript
// state/product-filter.store.ts
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';
import { ProductsService } from '../products.service';
import { Product } from '../models/product.model';

interface ProductFilterState {
  searchTerm: string;
  results: Product[];
  loading: boolean;
}

const initialState: ProductFilterState = { searchTerm: '', results: [], loading: false };

// No providedIn: 'root' — the widget provides it, so each instance gets its own store.
export const ProductFilterStore = signalStore(
  withState(initialState),

  // ---- Derived signals ------------------------------------------------
  withComputed(({ results, searchTerm }) => ({
    resultCount: computed(() => results().length),
    showEmptyState: computed(() => searchTerm().length > 0 && results().length === 0),
  })),

  // ---- Methods (the only way to change state) -------------------------
  withMethods((store, productsService = inject(ProductsService)) => ({
    search: rxMethod<string>(
      pipe(
        tap((searchTerm) => patchState(store, { searchTerm })),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { loading: true })),
        switchMap((term) =>
          productsService.search(term).pipe(
            tapResponse({
              next: (results) => patchState(store, { results, loading: false }),
              // never let the method's stream die on error
              error: () => patchState(store, { results: [], loading: false }),
            }),
          ),
        ),
      ),
    ),
  })),
);
```

```typescript
// product-filter-widget.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductFilterStore } from './state/product-filter.store';

@Component({
  selector: 'app-product-filter-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductFilterStore], // scoped: a new store per widget instance, destroyed with it
  template: `
    <input
      type="search"
      placeholder="Search products…"
      [value]="store.searchTerm()"
      (input)="onSearch($event)"
    />

    @if (store.loading()) {
      <p>Searching…</p>
    } @else if (store.showEmptyState()) {
      <p>No products match "{{ store.searchTerm() }}".</p>
    } @else {
      <p>{{ store.resultCount() }} results</p>
      <ul>
        @for (product of store.results(); track product.id) {
          <li>{{ product.name }}</li>
        }
      </ul>
    }
  `,
})
export class ProductFilterWidgetComponent {
  protected readonly store = inject(ProductFilterStore);

  onSearch(event: Event): void {
    this.store.search((event.target as HTMLInputElement).value);
  }
}
```

**Why this is best practice:**
- `providers: [ProductFilterStore]` scopes the store to this component's injector — every instance of the widget gets its own isolated state, and it's destroyed automatically with the component, along with the `rxMethod` subscription.
- The template reads signals directly (`store.loading()`, `store.results()`), so there's no `toSignal()` bridging and `OnPush` views update precisely when state changes.
- Components can't write state: they call `store.search(term)`, and only the store's methods call `patchState`.
- `tapResponse` guarantees an HTTP error doesn't kill the `search` stream (a plain `catchError` that rethrows would end it, and later searches would silently stop working).
- `debounceTime` + `distinctUntilChanged` live *inside* the store, not scattered across the component.

---

## Common Mistakes

1. **Mutating state directly in a reducer or updater.**
   `state.count++` silently breaks change detection and NgRx DevTools' time travel. Always return a new object: `{ ...state, count: state.count + 1 }`.

2. **Putting every piece of state in the global Store.**
   A modal's "is it open" flag or a form's "current step" rarely needs to be visible app-wide. Overusing the global store creates unnecessary actions/reducers and couples unrelated features. Prefer component-local signals or a component-provided `signalStore` for state that's genuinely local.

3. **Calling HTTP services directly from components instead of Effects.**
   This defeats the purpose of NgRx — side effects become untraceable, and you lose the single "this action caused this API call" narrative that effects give you.

4. **Using `catchError` in an effect without re-emitting an action/observable.**
   ```typescript
   // ❌ This terminates the effect's source stream after the first error — no more actions
   // of this type will ever be handled again!
   switchMap(() => this.api.getAll().pipe(catchError((e) => { throw e; })))
   ```
   Always catch the error *inside* the inner pipe and return a new observable (an action), or use `tapResponse` (in effects, `rxMethod`, or ComponentStore effects), which does this for you.

5. **Skipping selectors and reading raw state in components.**
   `store.select((s) => s.products.state.items)` inline in a template bypasses memoization and hardcodes the state shape into every consumer. Always export a named, reusable selector.

6. **Making a local store a root singleton by accident.**
   `signalStore({ providedIn: 'root' }, ...)` (or a ComponentStore with `providedIn: 'root'`) turns what should be per-component state into one app-wide instance, shared by every instance of that component. For local state, leave out `providedIn` and add the store to the component's own `providers` array instead.

7. **Forgetting that `createFeature` selector names are derived from state property names.**
   A state shape of `{ isLoading: boolean }` generates `selectIsLoading`, not `selectLoading`. Mismatched expectations here are a very common source of "selector doesn't exist" TypeScript errors.

---

## Best Practices

- **Default to component state (signals) first, then a `signalStore`, then the global `Store`** — escalate only when state genuinely needs to be shared across unrelated parts of the app or benefits from time-travel debugging and a documented action history.
- **Register feature state and effects at the route level** with `provideState()` / `provideEffects()` so they load lazily with the feature, not at app bootstrap.
- **Use `createActionGroup`** instead of many individual `createAction` calls — it reduces boilerplate and keeps related actions typed and discoverable together.
- **Let `createFeature` generate your simple selectors**, and reserve hand-written `createSelector` for genuinely derived/composed data (e.g., filtering, sorting, joining two slices of state).
- **Keep reducers and updaters pure** — no HTTP calls, no `Date.now()`, no random values; all of that belongs in effects.
- **Always pair `switchMap`/`exhaustMap`/`mergeMap` in effects with proper error handling** (`catchError` returning an action, or `tapResponse` in `rxMethod`) so a single failed request can't silently kill the effect.
- **Read state as signals.** A `signalStore` already exposes signals; for the global `Store`, use `store.selectSignal(selector)` (or `toSignal(store.select(...))`) — never call `.subscribe()` manually in a component just to assign a class field.
- **Scope local stores via the component's `providers` array**, not `providedIn: 'root'`, unless you deliberately want one shared instance.
- **Enable NgRx DevTools only in development** (`logOnly: !isDevMode()`), so production users don't pay for the debugging overhead.
- **Use `signalStore` for new local/feature state** — it covers what `ComponentStore` does with a signal-native API and less boilerplate — while the classic `Store` remains the right tool for large, event-driven, cross-cutting state.

---

## Summary

- NgRx applies the Redux pattern to Angular: **actions** describe events, **reducers** purely compute new state, **selectors** read it efficiently, and **effects** isolate side effects like HTTP calls.
- State flows in **one direction**, making every state change traceable back to a specific dispatched action.
- Use the standalone `provideStore`, `provideEffects`, and `provideStoreDevtools` functions to configure NgRx in a modern, non-NgModule Angular app.
- `createActionGroup`, `createReducer`/`createFeature`, and `createSelector` are the current idiomatic APIs for defining state — they replace older, more verbose patterns.
- `signalStore` (`@ngrx/signals`) gives local or feature state the same immutable, predictable discipline as the global store, with signals and without actions or reducers — ideal for filters, pagination, and UI-only flags.
- Provide a local `signalStore` in a component's own `providers` array so its lifecycle is tied to that component instance.
- Always handle errors inside effects (`catchError` returning an action, or `tapResponse`) so a failed request can't silently break the effect stream.
- Reach for the global `Store` when state is shared across unrelated features or needs an auditable history; reach for a `signalStore` for state that's local to one component or small feature.
- `ComponentStore` is the older, RxJS-based local store you'll still find in existing code; its `select`/`updater`/`effect` map to `withComputed`/`patchState` methods/`rxMethod`.

---

## Flash Cards

**Q: What is the difference between an action and a reducer in NgRx?**
A: An action is a plain object describing *that something happened* (with no logic). A reducer is a pure function that takes the current state and an action and computes the new state.

**Q: Why must reducers (and the functions that update a SignalStore) be pure?**
A: Purity guarantees predictable, testable state transitions and enables features like DevTools time-travel debugging; it also ensures Angular's change detection can reliably detect that state actually changed.

**Q: What problem does `tapResponse` solve that a plain `catchError` doesn't?**
A: A plain `catchError` that rethrows (or doesn't return a new observable) can terminate the outer effect stream on error, so it stops reacting to future actions/calls. `tapResponse` safely separates success/error handling so the effect keeps running.

**Q: When should you choose a `signalStore` over the global `Store`?**
A: When the state is local to one component or small feature (filters, pagination, UI flags, form-wizard steps) and doesn't need to be shared across unrelated parts of the app or tracked in a global action history.

**Q: How do you scope a `signalStore` to a single component instance instead of making it an app-wide singleton?**
A: Leave out `providedIn: 'root'` and add the store to that component's own `providers` array, so Angular DI creates and destroys it along with that component instance.

---

## Exercises

### 1. Easy — Extend the Counter Feature
Starting from Example 1's counter feature, add a new action `CounterActions.setValue({ value: number })` and a corresponding reducer case that sets `count` directly to the given value. Add a numeric `<input>` and a "Set" button to `CounterComponent` that dispatches this new action. Verify in NgRx DevTools that the action appears with the correct payload.

### 2. Medium — Add Retry and a Refresh Button to the Products Feature
Using Example 2 as a base:
- Add a `refreshProducts` action (reuse `ProductsPageActions.loadProducts` if you prefer, or create a distinct one) triggered by a "Refresh" button in `ProductsComponent`.
- Modify `ProductsEffects` so that if `getAll()` fails, it automatically retries the request once after a 2-second delay before dispatching `loadFailure` (hint: look into RxJS's `retry` or `retryWhen`-style operators combined with `catchError`).
- Confirm that a genuinely persistent failure still eventually dispatches `ProductsApiActions.loadFailure` and displays the error message.

### 3. Challenging — Build a Paginated, Sortable SignalStore
Extend Example 3's `ProductFilterStore` into a full local list-management store:
- Add `page: number` and `sortBy: 'name' | 'price'` to the state.
- Add methods `setPage` and `setSortBy` (using `patchState`), and make sure changing the search term resets `page` back to `1`.
- Make the search re-run when *any* of `searchTerm`, `page`, or `sortBy` changes. Hint: `rxMethod` also accepts a signal, so you can pass it a `computed()` that combines all three into one query object.
- Add "Next Page" / "Previous Page" buttons and a sort `<select>` to `ProductFilterWidgetComponent`, wired to the new methods.
- Stretch goal: find a `ComponentStore` in an existing codebase (or write the same store with `@ngrx/component-store`) and compare the amount of boilerplate.

---

## Further Reading

- [NgRx Documentation](https://ngrx.io/docs) — official docs home
- [NgRx Store Guide](https://ngrx.io/guide/store) — actions, reducers, selectors in depth
- [NgRx Effects Guide](https://ngrx.io/guide/effects) — side-effect handling patterns
- [NgRx Component Store Guide](https://ngrx.io/guide/component-store) — for the older RxJS-based local store you'll meet in existing code
- [NgRx Operators (`tapResponse`, `concatLatestFrom`)](https://ngrx.io/guide/operators/operators)
- [NgRx Signals (SignalStore) Guide](https://ngrx.io/guide/signals) — `signalStore`, `withState`, `withComputed`, `withMethods`, `rxMethod`
- [Angular Signals Guide](https://angular.dev/guide/signals) — official Angular documentation on Signals
- [Angular Dependency Injection Guide](https://angular.dev/guide/di) — background on how `providers` scoping works, relevant to local stores
