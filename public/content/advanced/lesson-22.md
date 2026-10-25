---
id: lesson-22
slug: advanced-rxjs-operators
title: "Advanced RxJS Operators in Angular"
level: advanced
order: 25
duration: 70
tags:
  - rxjs
  - observables
  - operators
  - reactive-programming
  - http
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Choose the correct flattening operator (`switchMap`, `mergeMap`, `concatMap`, `exhaustMap`) for a given async scenario, and explain why the wrong choice causes bugs.
- Combine multiple observable streams using `combineLatest`, `forkJoin`, and `withLatestFrom`.
- Build a debounced, deduplicated "search-as-you-type" feature with `debounceTime`, `distinctUntilChanged`, and `switchMap`.
- Handle HTTP errors gracefully with `catchError` and `retry`, without silently breaking the entire stream.
- Cache and share expensive observable results with `shareReplay` while avoiding memory leaks, and clean up subscriptions the modern Angular way with `takeUntilDestroyed`.

---

## Why This Concept Exists

Angular applications are built on streams of asynchronous events: HTTP responses, user keystrokes, router navigation, form value changes, WebSocket messages. Basic operators like `map`, `filter`, and `tap` are great for transforming a *single* stream's values, but they don't answer a harder question:

> **What should happen when a new async operation starts before the previous one has finished?**

For example, if a user types quickly into a search box, each keystroke could trigger an HTTP request. Should the app:

- Cancel the previous request and only care about the latest one? (typeahead search)
- Run every request in parallel and process results as they arrive? (independent uploads)
- Queue requests and run them strictly one after another, in order? (ordered writes)
- Ignore new triggers entirely until the current one finishes? (prevent duplicate form submits)

Each of these is a legitimate, common requirement — and each has a dedicated RxJS operator. Advanced RxJS operators exist to give you **precise control over concurrency, timing, combination, and error recovery**, so you don't have to hand-roll this logic with flags, `setTimeout`, or nested subscriptions (an anti-pattern often called "callback hell" or the "subscribe pyramid").

Angular relies on RxJS internally (the `HttpClient`, `Router` events, and Reactive Forms `valueChanges` are all Observables), so mastering these operators is essential for writing correct, leak-free, production-quality Angular code.

---

## Concept Explanation

RxJS operators used with Angular's advanced patterns fall into a few functional categories. Understanding the *category* helps you pick the right operator faster than memorizing each one in isolation.

### 1. Flattening (higher-order mapping) operators

When you `map` an Observable to a new Observable (e.g., "search term" → "HTTP request Observable"), you get an **Observable of Observables**. You need to "flatten" that into a single stream of values. RxJS gives you four flattening strategies, differing only in **how they handle overlapping inner Observables**:

| Operator | Behavior when a new source value arrives while a previous inner Observable is still running |
|---|---|
| `switchMap` | **Cancels** the previous inner Observable and switches to the new one. |
| `mergeMap` | Runs **all** inner Observables **concurrently**; emits values as they arrive, in any order. |
| `concatMap` | **Queues** inner Observables and runs them **one at a time, in order**. |
| `exhaustMap` | **Ignores** new source values while an inner Observable is still active. |

### 2. Combination operators

These combine two or more *independent* Observables into one:

- `combineLatest([a$, b$])` — emits whenever **any** source emits, using the **latest** value from each. Requires all sources to have emitted at least once before it emits.
- `forkJoin({ a: a$, b: b$ })` — waits for **all** sources to **complete**, then emits once with the last value of each. Ideal for "run N HTTP calls in parallel, then proceed."
- `zip(a$, b$)` — pairs values by **index** (1st with 1st, 2nd with 2nd). Less common in UI code, more common in data-processing pipelines.
- `withLatestFrom(b$)` — used on a primary stream `a$`; emits `a$`'s value combined with the **latest** value of `b$`, but only when `a$` emits (not when `b$` emits).

### 3. Filtering / timing operators

- `debounceTime(ms)` — waits for a pause in emissions before emitting the latest value. Essential for search inputs.
- `distinctUntilChanged()` — skips a value if it's the same as the previous one. Prevents redundant work (e.g., re-searching the same term).
- `throttleTime(ms)` — emits a value, then ignores subsequent ones for a fixed window. Useful for rate-limiting clicks (e.g., "scroll" events).

### 4. Error handling operators

- `catchError((err) => fallback$)` — intercepts an error and replaces the failed stream with a fallback Observable, so subscribers don't just see the stream die silently.
- `retry(count)` or `retry({ count, delay })` — resubscribes to the source a limited number of times before giving up, useful for transient network failures.

### 5. Multicasting operators

- `shareReplay(config)` — turns a "cold" Observable (which re-executes its logic for every subscriber) into a "hot," shared one that replays the last emitted value(s) to new subscribers. Commonly used to cache HTTP GET results.

### 6. Angular-specific cleanup

- `takeUntilDestroyed()` (from `@angular/core/rxjs-interop`, Angular 16+) — automatically completes a subscription when the component, directive, or service is destroyed. This is the modern replacement for the manual `Subject<void>` + `takeUntil` pattern.

---

## Key Terminology

- **Observable** — a lazy, push-based stream of values over time. Nothing runs until you `subscribe()`.
- **Operator** — a pure function used inside `.pipe()` that takes an Observable and returns a new, transformed Observable.
- **Higher-order Observable** — an Observable whose emitted values are themselves Observables (e.g., the result of `map(term => this.http.get(...))`).
- **Flattening** — the process of converting a higher-order Observable into a regular, single-level Observable of values.
- **Cold vs. Hot Observable** — a *cold* Observable (like `HttpClient.get()`) starts its work fresh for each subscriber. A *hot* Observable (like a `Subject`, or a `shareReplay`-wrapped stream) shares one execution among all subscribers.
- **Multicasting** — sharing a single subscription/execution among multiple subscribers, instead of each subscriber triggering its own.
- **Teardown / Unsubscription** — cleaning up a subscription so it stops emitting and releases resources, preventing memory leaks.
- **`DestroyRef`** — an Angular injectable that lets code (including outside a component class) register a callback to run when the current injection context is destroyed; it powers `takeUntilDestroyed()`.

---

## Syntax Overview

```typescript
import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subject,
  combineLatest,
  forkJoin,
  of,
} from 'rxjs';
import {
  switchMap,
  mergeMap,
  concatMap,
  exhaustMap,
  debounceTime,
  distinctUntilChanged,
  catchError,
  retry,
  shareReplay,
  withLatestFrom,
} from 'rxjs/operators';

// Flattening: pick ONE based on the desired concurrency behavior
source$.pipe(switchMap(value => innerObservable(value)));
source$.pipe(mergeMap(value => innerObservable(value)));
source$.pipe(concatMap(value => innerObservable(value)));
source$.pipe(exhaustMap(value => innerObservable(value)));

// Combination
combineLatest([a$, b$]).subscribe(([a, b]) => { /* ... */ });
forkJoin({ a: a$, b: b$ }).subscribe(({ a, b }) => { /* ... */ });
a$.pipe(withLatestFrom(b$)).subscribe(([aValue, bValue]) => { /* ... */ });

// Filtering / timing
source$.pipe(debounceTime(300), distinctUntilChanged());

// Error handling
source$.pipe(
  retry({ count: 2, delay: 1000 }),
  catchError(err => of(fallbackValue)),
);

// Multicasting (cache the last emission for late subscribers)
source$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

// Angular cleanup (inside an injection context, e.g. a component field initializer or constructor)
source$.pipe(takeUntilDestroyed()).subscribe();

// Angular cleanup (outside an injection context, e.g. inside ngOnInit)
private destroyRef = inject(DestroyRef);
ngOnInit() {
  source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
}
```

**Reading the syntax:** every operator inside `.pipe(...)` returns a *new* Observable — operators never mutate the source. Order matters: `.pipe(debounceTime(300), distinctUntilChanged())` first waits for a pause, then checks for duplicates on the debounced result.

---

## Real World Analogy

Think of a **restaurant kitchen** receiving orders (source emissions) that each require cooking (an inner async operation):

- **`switchMap` — "Cancel and restart."** A customer changes their order before the kitchen finishes cooking the first one. The chef throws out the half-cooked first dish and starts the new one. Perfect for search-as-you-type: only the *latest* query result matters.
- **`mergeMap` — "Parallel stations."** Every order goes to its own cooking station simultaneously. Dishes come out whenever they're ready, not necessarily in order. Good for independent tasks like uploading multiple files at once.
- **`concatMap` — "One chef, one ticket rail."** Orders are cooked strictly in the sequence they arrived; the next one doesn't start until the current one is fully done. Good when order matters, like saving a sequence of edits.
- **`exhaustMap` — "Do not disturb."** While the chef is cooking, they ignore any new tickets that come in until the current dish is served. Good for preventing a "Submit" button from firing a second request while the first is still in flight.

`shareReplay` is like a chef who cooks one large pot of soup and lets multiple tables share it — instead of cooking a fresh pot for every single table that orders soup.

---

## Examples

### 1. Basic Example — Typeahead Search with `switchMap`

This example shows the canonical "search-as-you-type" pattern: debounce keystrokes, ignore duplicate terms, and cancel stale HTTP requests automatically. You met it in *Observables & RxJS Basics*; here the focus is on why each operator sits where it does.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';

interface Book {
  id: string;
  title: string;
}

@Component({
  selector: 'app-book-search',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <input
      [formControl]="searchControl"
      placeholder="Search books..."
      aria-label="Search books"
    />

    <ul>
      @for (book of results$ | async; track book.id) {
        <li>{{ book.title }}</li>
      }
    </ul>
  `,
})
export class BookSearchComponent {
  private http = inject(HttpClient);

  searchControl = new FormControl('', { nonNullable: true });

  // valueChanges is a hot Observable; we transform it into search results.
  results$: Observable<Book[]> = this.searchControl.valueChanges.pipe(
    debounceTime(300), // wait for the user to pause typing
    distinctUntilChanged(), // skip if the term didn't actually change
    switchMap((term) => {
      if (!term.trim()) {
        return of([]); // empty term -> empty result, no HTTP call
      }
      return this.http.get<Book[]>(`/api/books?q=${encodeURIComponent(term)}`).pipe(
        catchError(() => of([])), // keep the outer stream alive on error
      );
    }),
  );
}
```

**Why `switchMap` here:** if the user types "ang", then quickly "angular", we only care about the response for "angular". `switchMap` automatically cancels the pending "ang" request, so a slow, stale response can never overwrite the correct, later one — a real race-condition bug that `mergeMap` would *not* prevent.

**Note:** `catchError` is placed **inside** the `switchMap` callback, wrapping only the inner HTTP Observable. This is intentional — see [Common Mistakes](#common-mistakes).

---

### 2. Real-World Example — Combining Route Params and a Filter Form with `combineLatest` + `shareReplay`

This example shows a product list page whose data depends on **two independent sources**: the route's category parameter and a filter form's value, combined and cached so multiple parts of the template can subscribe without re-fetching.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  combineLatest,
} from 'rxjs';
import {
  map,
  switchMap,
  shareReplay,
  startWith,
} from 'rxjs/operators';

interface Product {
  id: string;
  name: string;
  price: number;
}

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <label>
      Sort by price:
      <select [formControl]="sortControl">
        <option value="asc">Low to high</option>
        <option value="desc">High to low</option>
      </select>
    </label>

    @if (products$ | async; as products) {
      <ul>
        @for (product of products; track product.id) {
          <li>{{ product.name }} — {{ product.price | currency }}</li>
        }
      </ul>
    }
  `,
})
export class ProductListComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  sortControl = new FormControl<'asc' | 'desc'>('asc', { nonNullable: true });

  private category$ = this.route.paramMap.pipe(
    map((params) => params.get('category') ?? 'all'),
  );

  private sort$ = this.sortControl.valueChanges.pipe(
    startWith(this.sortControl.value), // emit the initial value immediately
  );

  // Recompute whenever EITHER the route category OR the sort order changes.
  products$: Observable<Product[]> = combineLatest([this.category$, this.sort$]).pipe(
    switchMap(([category, sort]) =>
      this.http.get<Product[]>(`/api/products`, {
        params: { category, sort },
      }),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
```

**Why `combineLatest`:** the list must refresh if the user navigates to a different category **or** changes the sort order — either source triggering a re-fetch is exactly what `combineLatest` provides. `switchMap` is layered on top so an in-flight request is cancelled if the user changes the filter again quickly.

**Why `shareReplay({ bufferSize: 1, refCount: true })`:** the `async` pipe subscribes to `products$` in the template. If `products$` were used in two places (e.g., the list and a "results count" display), without `shareReplay` each subscription would trigger its **own** separate HTTP request. `shareReplay` ensures the HTTP call happens once and the result is shared. `refCount: true` ensures the underlying subscription is cleaned up when there are no more subscribers, preventing a memory leak from an Observable that never tears down.

---

### 3. Best-Practice Example — Preventing Duplicate Submits with `exhaustMap`, Retry, and Proper Cleanup

This example shows a "Save" button that must **never** send two overlapping requests, gracefully retries on transient network failure, and cleans itself up using the modern `takeUntilDestroyed()` API instead of a manual `Subject`.

```typescript
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import {
  exhaustMap,
  retry,
  catchError,
  tap,
} from 'rxjs/operators';

interface SaveResult {
  success: boolean;
}

@Component({
  selector: 'app-save-button',
  template: `
    <button (click)="save$.next()" [disabled]="isSaving()">
      {{ isSaving() ? 'Saving...' : 'Save' }}
    </button>

    @if (errorMessage(); as message) {
      <p role="alert">{{ message }}</p>
    }
  `,
})
export class SaveButtonComponent {
  private http = inject(HttpClient);

  // Signals, so the view updates when the HTTP response arrives, with or without zone.js.
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // A Subject acts as the "click trigger" source.
  save$ = new Subject<void>();

  constructor() {
    this.save$
      .pipe(
        tap(() => {
          this.isSaving.set(true);
          this.errorMessage.set(null);
        }),
        exhaustMap(() =>
          this.http.post<SaveResult>('/api/save', {}).pipe(
            retry({ count: 2, delay: 1000 }), // retry transient failures twice, 1s apart
            catchError(() => {
              this.errorMessage.set('Save failed. Please try again.');
              return of<SaveResult>({ success: false });
            }),
            tap(() => this.isSaving.set(false)),
          ),
        ),
        // Automatically unsubscribes when this component is destroyed.
        // Called inside the constructor, which is a valid injection context.
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
```

**Why `exhaustMap`:** while a save request is in flight, additional clicks on the button are simply ignored at the stream level — no need for a manual `isSaving` guard around the click handler itself, since `exhaustMap` won't even start a new inner Observable until the current one completes.

**Why `retry({ count: 2, delay: 1000 })`:** transient network blips shouldn't immediately fail the user's save. `retry` resubscribes to the failed inner Observable up to 2 additional times, waiting 1 second between attempts, before giving up and letting the error propagate to `catchError`.

**Why `takeUntilDestroyed()` with no arguments:** it's called directly inside the constructor, which Angular treats as a valid injection context, so it automatically resolves the current `DestroyRef`. This replaces the older, more verbose pattern:

```typescript
// Older pattern — still valid, but takeUntilDestroyed() is preferred going forward.
private destroy$ = new Subject<void>();

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// ... source$.pipe(takeUntil(this.destroy$)).subscribe();
```

**Why signals for `isSaving` and `errorMessage`:** they change inside HTTP callbacks. In a zoneless app (the default for new projects since Angular 21), assigning a plain field there wouldn't refresh the view; writing a signal does.

### Bonus: writing your own operator

An operator is just a function that takes an Observable and returns a new one. When the same chain of operators appears in several places, give it a name:

```typescript
import { MonoTypeOperatorFunction, Observable, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';

/** Drops null and undefined values, and narrows the type accordingly. */
export function filterNil<T>() {
  return (source: Observable<T>) => source.pipe(filter((value): value is NonNullable<T> => value != null));
}

/** The "clean up a search term" steps used by every typeahead in the app. */
export function searchTerm(ms = 300): MonoTypeOperatorFunction<string> {
  return (source) =>
    source.pipe(
      map((term) => term.trim()),
      debounceTime(ms),
      distinctUntilChanged(),
    );
}

// Usage: this.searchControl.valueChanges.pipe(searchTerm(), switchMap(...))
```

Because these are plain functions built from existing operators, they keep all the usual behavior (laziness, cancellation, error propagation) and are easy to unit-test on their own.

---

## Common Mistakes

- **Using `mergeMap` for search requests.** Because `mergeMap` runs all inner Observables concurrently, a slow response to an *earlier* keystroke can arrive *after* a faster response to a *later* keystroke, overwriting correct results with stale ones. Use `switchMap` for "only the latest matters" scenarios.
- **Placing `catchError` around the *outer* stream instead of the *inner* one.** If you write `source$.pipe(switchMap(v => http.get(...)), catchError(...))`, an error in the inner HTTP call will terminate the **entire outer stream** — meaning the search box stops working for *all future* keystrokes, not just the failed one. Put `catchError` inside the `switchMap`/`mergeMap`/`concatMap` callback so only that inner Observable is caught, and the outer stream survives.
- **Forgetting to unsubscribe from long-lived streams.** Manually calling `.subscribe()` on an Observable that never completes (like `valueChanges` or a `Subject`) without cleanup causes a memory leak and can trigger callbacks on destroyed components. Prefer the `async` pipe (which unsubscribes automatically) or `takeUntilDestroyed()`.
- **Using `shareReplay` without `{ refCount: true }` on a component-scoped stream.** The older `shareReplay(1)` shorthand keeps the source subscription alive forever, even after all subscribers unsubscribe, which can leak. Prefer the object form: `shareReplay({ bufferSize: 1, refCount: true })`.
- **Nesting subscriptions instead of flattening.** Writing `a$.subscribe(a => b$.subscribe(b => ...))` loses cancellation, error propagation, and readability. Always prefer a flattening operator (`switchMap`, etc.) over a subscribe-inside-subscribe pattern.
- **Choosing `concatMap` "just to be safe" for everything.** Because `concatMap` strictly serializes work, using it where operations are actually independent (e.g., uploading five unrelated files) needlessly slows the app down. Reserve `concatMap` for cases where order genuinely matters.
- **Reaching for `exhaustMap` for search-as-you-type.** `exhaustMap` would *ignore* new keystrokes while a request is in flight, causing the user's latest input to be silently dropped. That's the opposite of what a live search needs — use `switchMap` there instead.

---

## Best Practices

- **Default to the `async` pipe** in templates rather than manually subscribing in the component class — it handles subscription and unsubscription automatically and helps prevent memory leaks and stale-data bugs.
- **Pick the flattening operator based on the required concurrency semantics**, not habit: "cancel and replace" → `switchMap`; "run all in parallel" → `mergeMap`; "strict order" → `concatMap`; "ignore while busy" → `exhaustMap`.
- **Catch errors as close to the source of failure as possible** (typically inside the inner Observable of a flattening operator) so a single failure doesn't kill an entire long-lived stream.
- **Use `shareReplay({ bufferSize: 1, refCount: true })`** when multiple subscribers should share one HTTP call or expensive computation, and you want the subscription to tear down cleanly when unused.
- **Use `takeUntilDestroyed()`** for any manual `.subscribe()` call inside a component, directive, or service — it is the current, recommended cleanup approach in modern Angular (16+), replacing manual `Subject`/`ngOnDestroy` boilerplate.
- **Type your Observables explicitly** (e.g., `Observable<Book[]>`) so operator chains produce clear, self-documenting return types and catch mismatches at compile time.
- **Combine `debounceTime` + `distinctUntilChanged`** before any operator that triggers an HTTP call, to reduce unnecessary network traffic from rapid, redundant input.

---

## Summary

- Advanced RxJS operators give you precise, declarative control over **concurrency**, **combination**, **timing**, and **error recovery** in async streams.
- The four flattening operators — `switchMap`, `mergeMap`, `concatMap`, `exhaustMap` — differ only in how they treat overlapping inner Observables; choosing the right one is the single most important skill in this lesson.
- `combineLatest`, `forkJoin`, and `withLatestFrom` combine independent streams in different ways: "latest of any," "wait for all to complete," and "latest of a secondary stream on a primary stream's emission," respectively.
- `debounceTime` and `distinctUntilChanged` reduce noisy, redundant emissions — critical for search inputs and form-driven requests.
- `catchError` should generally live **inside** a flattening operator's inner Observable so a single failure doesn't terminate the whole outer stream.
- `retry` (or `retry({ count, delay })`) adds resilience against transient failures without extra boilerplate.
- `shareReplay({ bufferSize: 1, refCount: true })` turns a cold, re-executing Observable into a shared, cached one — ideal for expensive or shared HTTP calls.
- `takeUntilDestroyed()` is the modern, Angular-native way to automatically clean up manual subscriptions.
- Prefer the `async` pipe over manual `subscribe()` wherever possible to minimize manual cleanup entirely.

---

## Flash Cards

**Q: Which flattening operator should you use for a typeahead search box, and why?**
A: `switchMap`, because it cancels the previous in-flight request when a new search term arrives, preventing a stale response from overwriting a newer, correct one.

**Q: What's the difference between `mergeMap` and `concatMap`?**
A: `mergeMap` runs all inner Observables concurrently and emits results as they arrive (order not guaranteed); `concatMap` queues them and runs strictly one at a time, in order.

**Q: When would you choose `exhaustMap` over `switchMap`?**
A: When new triggers while an operation is in flight should be *ignored* rather than *cancel and restart* — e.g., preventing duplicate form submissions from repeated button clicks.

**Q: Why should `catchError` usually be placed inside a flattening operator's callback rather than after it?**
A: Placing it after the flattening operator lets an inner error terminate the entire outer stream permanently; placing it inside catches only that inner failure and lets the outer stream keep working for future emissions.

**Q: What does `shareReplay({ bufferSize: 1, refCount: true })` do, and why prefer it over `shareReplay(1)`?**
A: It multicasts an Observable's execution to multiple subscribers while replaying the last emitted value to new ones; the `refCount: true` option ensures the source subscription is torn down when there are no active subscribers, avoiding a memory leak that the bare `shareReplay(1)` shorthand can cause.

---

## Exercises

### Easy

Create a standalone Angular component with a `FormControl` bound to a text input. Using `debounceTime(400)` and `distinctUntilChanged()`, log the debounced, deduplicated value to the console every time it changes (no HTTP call needed — just `tap` or `subscribe`).

### Medium

Build a "load user profile" feature: given a `userId$: Observable<string>` (simulate it with a `Subject<string>`), use `switchMap` to call `http.get<UserProfile>('/api/users/' + id)` whenever `userId$` emits a new id. Add `catchError` **inside** the `switchMap` so that if one user lookup fails, subsequent lookups still work. Verify your placement of `catchError` by simulating an error for one id and confirming the stream still emits correctly for the next id.

### Challenging

Build a batch file-upload component with a queue of files to upload sequentially (order matters — use `concatMap`). For each file: call a simulated `uploadFile(file): Observable<{ file: string; progress: number }>`, retry each upload up to 2 times with a 1-second delay on failure using `retry({ count: 2, delay: 1000 })`, and use `catchError` to convert a permanently failed upload into a `{ file, progress: -1 }` result instead of stopping the whole queue. Clean up the subscription using `takeUntilDestroyed()`. Bonus: use `scan` to accumulate all upload results into a running array you can render in the template.

---

## Further Reading

- [RxJS Operators — official documentation](https://rxjs.dev/guide/operators)
- [RxJS `switchMap` API reference](https://rxjs.dev/api/operators/switchMap)
- [RxJS `mergeMap` API reference](https://rxjs.dev/api/operators/mergeMap)
- [RxJS `concatMap` API reference](https://rxjs.dev/api/operators/concatMap)
- [RxJS `exhaustMap` API reference](https://rxjs.dev/api/operators/exhaustMap)
- [RxJS `combineLatest` API reference](https://rxjs.dev/api/index/function/combineLatest)
- [RxJS `forkJoin` API reference](https://rxjs.dev/api/index/function/forkJoin)
- [RxJS `shareReplay` API reference](https://rxjs.dev/api/operators/shareReplay)
- [RxJS `retry` API reference](https://rxjs.dev/api/operators/retry)
- [Angular — `rxjs-interop` and `takeUntilDestroyed`](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)
- [Angular — HttpClient guide](https://angular.dev/guide/http)
- [Angular — Reactive Forms guide](https://angular.dev/guide/forms/reactive-forms)
