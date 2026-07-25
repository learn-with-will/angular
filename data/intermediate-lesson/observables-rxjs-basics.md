---
title: "Observables & RxJS Basics in Angular"
level: "intermediate"
estimatedTime: 45
tags:
  - angular
  - rxjs
  - observables
  - reactive-programming
  - typescript
---

# Observables & RxJS Basics in Angular

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what an Observable is and how it differs from a Promise.
- Create, subscribe to, and unsubscribe from Observables safely inside Angular components.
- Use core RxJS operators (`map`, `filter`, `tap`, `switchMap`, `catchError`) to transform and combine asynchronous data streams.
- Use the `async` pipe to consume Observables directly in templates without manual subscription management.
- Recognize and avoid the most common RxJS mistakes, including memory leaks and unnecessary manual subscriptions.

## Why This Concept Exists

Angular applications are full of asynchronous events: HTTP responses, user clicks, form input changes, router navigation, WebSocket messages, and timers. Handling all of these with plain callbacks or Promises quickly becomes messy, especially when you need to:

- Cancel an in-progress operation (e.g., a previous HTTP request when the user types a new search term).
- Combine multiple asynchronous sources together.
- React to a *stream* of values over time, not just a single resolved value.
- Apply the same transformation logic (debouncing, retrying, filtering) consistently across many async sources.

**RxJS (Reactive Extensions for JavaScript)** solves this by modeling asynchronous data as **Observables** — streams of values that can be composed with a rich library of operators. Angular is built around RxJS: `HttpClient`, the `Router`, and Reactive Forms all return or expose Observables. Understanding Observables is therefore essential to working effectively with Angular, even as Signals (introduced in recent Angular versions) now handle some of the simpler state-management use cases.

## Concept Explanation

### What is an Observable?

An **Observable** is a blueprint for a stream of values delivered over time. Nothing happens until you **subscribe** to it — this is called being "lazy." Once subscribed, the Observable can emit:

- Zero, one, or many **values** (via `next`)
- An **error** that terminates the stream (via `error`)
- A **completion** signal that terminates the stream successfully (via `complete`)

This is often summarized as the Observable contract: `next* (error | complete)?` — meaning any number of `next` emissions, optionally followed by exactly one `error` or `complete`.

### Observable vs. Promise

| Feature | Promise | Observable |
|---|---|---|
| Values emitted | Exactly one | Zero, one, or many, over time |
| Execution | Eager (runs immediately when created) | Lazy (runs only when subscribed) |
| Cancellable | No | Yes (via `unsubscribe()`) |
| Operators | None built-in | Huge library (`map`, `filter`, `switchMap`, etc.) |
| Multiple subscribers | Shares the same resolved value | Each subscription can trigger a new execution (unless "shared") |

A Promise is great for "fetch this once and I'm done." An Observable is better when the data source can produce multiple values over time, or when you need the ability to cancel.

### The Building Blocks

1. **Observable** — the stream itself. You subscribe to it to start receiving values.
2. **Observer** — an object with `next`, `error`, and `complete` callbacks that reacts to emissions.
3. **Subscription** — the object returned by `.subscribe()`. Call `.unsubscribe()` on it to stop listening and release resources.
4. **Operators** — pure functions like `map`, `filter`, and `switchMap` that take an Observable as input and return a new Observable, allowing you to transform, filter, or combine streams using `.pipe()`.
5. **Subject** — a special type of Observable that also acts as an Observer, allowing you to manually push values into the stream (useful for event buses, user-triggered events, or shared state).

### Where Angular Uses Observables

- `HttpClient.get()`, `.post()`, etc. all return `Observable<T>`.
- `ActivatedRoute.params`, `.queryParams`, and `.data` are Observables.
- Reactive Forms' `valueChanges` and `statusChanges` are Observables.
- The `Router` exposes navigation events as an Observable (`router.events`).

## Key Terminology

- **Observable**: A lazy, cancellable stream of values over time.
- **Observer**: An object (or set of callback functions) that consumes emitted values, errors, or completion.
- **Subscription**: The active connection between an Observer and an Observable; can be cancelled with `unsubscribe()`.
- **Operator**: A pure function used inside `.pipe()` to transform, filter, or combine Observable streams (e.g., `map`, `debounceTime`, `switchMap`).
- **Subject**: A multicast Observable that can also emit values manually via `.next()`. Variants include `BehaviorSubject` (holds a current value, emits it to new subscribers) and `ReplaySubject` (replays a buffer of past values to new subscribers).
- **Unsubscribe**: The act of ending a subscription to prevent memory leaks and stop further emissions from being processed.
- **Async pipe**: An Angular template pipe (`| async`) that subscribes to an Observable automatically and unsubscribes when the component is destroyed.
- **Higher-order mapping operator**: An operator like `switchMap`, `mergeMap`, `concatMap`, or `exhaustMap` that maps each emitted value to a new inner Observable and flattens the result.

## Syntax Overview

### Creating an Observable

```typescript
import { Observable } from 'rxjs';

// Manually creating an Observable
const numbers$ = new Observable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});
```

> **Convention:** Variable names holding Observables are typically suffixed with `$` (e.g., `numbers$`, `user$`) to make them easy to spot.

### Common Creation Functions

```typescript
import { of, from, fromEvent, interval, EMPTY } from 'rxjs';

of(1, 2, 3);                 // emits 1, 2, 3 synchronously, then completes
from([10, 20, 30]);          // emits array items one by one, then completes
from(fetch('/api/data'));    // converts a Promise into an Observable
fromEvent(button, 'click');  // emits every time the DOM event fires
interval(1000);              // emits an incrementing number every 1000ms
EMPTY;                       // completes immediately, no values
```

### Subscribing

```typescript
const subscription = numbers$.subscribe({
  next: (value) => console.log('Received:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Stream complete'),
});

// Always clean up when done:
subscription.unsubscribe();
```

### Using Operators with `.pipe()`

```typescript
import { map, filter } from 'rxjs';

numbers$
  .pipe(
    filter((n) => n % 2 === 0),
    map((n) => n * 10)
  )
  .subscribe((result) => console.log(result));
```

### The Async Pipe (Recommended for Templates)

```typescript
@Component({
  selector: 'app-user-badge',
  standalone: true,
  imports: [AsyncPipe],
  template: `<span>{{ userName$ | async }}</span>`,
})
export class UserBadgeComponent {
  userName$ = this.userService.getCurrentUserName();
  constructor(private userService: UserService) {}
}
```

The `async` pipe subscribes automatically when the template renders and **unsubscribes automatically** when the component is destroyed — no manual cleanup required.

## Real World Analogy

Think of an Observable like a **YouTube live stream** rather than a **video download**:

- A **download (Promise)** happens once — you request the file, wait, and get exactly one complete result.
- A **live stream (Observable)** doesn't start producing content until you hit "play" (subscribe). Once you're watching, new content can arrive continuously — chat messages, video frames, live polls — until the stream ends (`complete`) or something goes wrong (`error`).
- If you close the browser tab, you **stop watching** (unsubscribe) — the stream doesn't care about you anymore, and your browser stops using resources on it.
- You can also apply a **filter or overlay** to what you watch (an operator), transforming the raw stream without changing the original broadcast.

## Examples

### 1. Basic Example — Creating and Subscribing to an Observable

This example demonstrates the fundamental Observable lifecycle: creation, emission, transformation, and cleanup.

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { map, take } from 'rxjs';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<p>Current count: {{ count }}</p>`,
})
export class CounterComponent implements OnInit, OnDestroy {
  count = 0;
  private subscription?: Subscription;

  ngOnInit(): void {
    // Emits 0, 1, 2, ... every second, but only takes the first 5 values
    this.subscription = interval(1000)
      .pipe(
        take(5),
        map((tick) => tick + 1)
      )
      .subscribe({
        next: (value) => (this.count = value),
        complete: () => console.log('Counter finished'),
      });
  }

  ngOnDestroy(): void {
    // Prevents memory leaks if the component is destroyed before the stream completes
    this.subscription?.unsubscribe();
  }
}
```

**Explanation:**
- `interval(1000)` creates an Observable that emits an incrementing number every second.
- `take(5)` automatically completes the stream after 5 emissions — no manual unsubscribe is even required in this case, but we still store the subscription and clean it up in `ngOnDestroy()` as a defensive best practice, in case the component is destroyed early.
- `map()` transforms each emitted value before it reaches `subscribe()`.

### 2. Real-World Example — Debounced Search with `HttpClient`

This is one of the most common real-world RxJS patterns in Angular: reacting to user input, waiting for the user to pause typing, cancelling stale requests, and handling errors gracefully.

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  of,
} from 'rxjs';

interface SearchResult {
  id: number;
  title: string;
}

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  template: `
    <input [formControl]="searchControl" placeholder="Search products..." />

    <ul>
      @for (item of results$ | async; track item.id) {
        <li>{{ item.title }}</li>
      }
    </ul>
  `,
})
export class ProductSearchComponent {
  private http = inject(HttpClient);

  searchControl = new FormControl('', { nonNullable: true });

  results$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),               // wait 300ms after the user stops typing
    distinctUntilChanged(),          // skip if the value hasn't actually changed
    switchMap((term) =>
      this.http.get<SearchResult[]>(`/api/products?q=${term}`).pipe(
        catchError(() => of([] as SearchResult[])) // fail gracefully, return empty list
      )
    )
  );
}
```

**Explanation:**
- `valueChanges` on the `FormControl` is an Observable that emits every time the input changes.
- `debounceTime(300)` prevents firing a request on every keystroke.
- `distinctUntilChanged()` avoids duplicate requests if the value didn't really change.
- `switchMap` is critical here: if a new search term arrives *before* the previous HTTP request finishes, `switchMap` **cancels the previous request** and switches to the new one. This avoids race conditions where an old, slow response overwrites a newer one.
- `catchError` inside the inner `pipe()` ensures one failed request doesn't kill the entire outer stream — the `results$` Observable keeps working for future searches.
- The `async` pipe in the template subscribes to `results$` and handles unsubscription automatically.

### 3. Best-Practice Example — Manual Subscriptions with Safe Cleanup

Sometimes you can't use the `async` pipe (e.g., you need the value in component logic, not just the template). In modern Angular (16+), the recommended way to manage cleanup in these cases is `takeUntilDestroyed()`, which ties the subscription's lifetime to the component's `DestroyRef` automatically.

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';

interface Order {
  id: number;
  status: string;
}

@Component({
  selector: 'app-order-tracker',
  standalone: true,
  template: `
    @if (order) {
      <p>Order #{{ order.id }}: {{ order.status }}</p>
    } @else {
      <p>Loading order...</p>
    }
  `,
})
export class OrderTrackerComponent implements OnInit {
  private http = inject(HttpClient);
  order: Order | null = null;

  ngOnInit(): void {
    this.http
      .get<Order>('/api/orders/current')
      .pipe(
        tap((order) => (this.order = order)),
        catchError((err) => {
          console.error('Failed to load order', err);
          return of(null);
        }),
        takeUntilDestroyed() // automatically unsubscribes when the component is destroyed
      )
      .subscribe();
  }
}
```

**Explanation:**
- `takeUntilDestroyed()` (from `@angular/core/rxjs-interop`) automatically completes the Observable when the component is destroyed, so you don't need `ngOnDestroy()` or a manually tracked `Subscription` object.
- By default it must be called within an **injection context** (e.g., a constructor or field initializer, or `ngOnInit` when the component uses `inject()` — as shown, it correctly picks up the `DestroyRef` from the enclosing class).
- `catchError` combined with `of(null)` ensures the stream still completes gracefully on error, instead of silently dying without ever calling `.subscribe()`'s next handler.
- This pattern (`tap` + `catchError` + `takeUntilDestroyed`) is the modern, boilerplate-free replacement for the older "store a `Subscription`, unsubscribe in `ngOnDestroy`" pattern — use it whenever the `async` pipe isn't a good fit.

## Common Mistakes

1. **Forgetting to unsubscribe**, causing memory leaks and duplicate logic execution (e.g., a `interval()` subscription that keeps running after the component is destroyed). **Fix:** prefer the `async` pipe, or use `takeUntilDestroyed()` for manual subscriptions.
2. **Subscribing inside a subscription ("nested subscribe")** instead of using a flattening operator like `switchMap` or `mergeMap`. This makes code hard to read and breaks cancellation. **Fix:** chain operators inside `.pipe()` instead of nesting `.subscribe()` calls.
3. **Using `mergeMap` when `switchMap` is needed (or vice versa)**, causing race conditions in searches (`mergeMap` doesn't cancel previous inner Observables, so old results can arrive after new ones) or lost values in sequential operations (`switchMap` cancels previous ones, which is wrong for things like save/submit actions where every request must complete). **Fix:** use `switchMap` for "cancel the old, use the new" (search, typeahead); use `concatMap` for "must run in order" (sequential writes); use `exhaustMap` for "ignore new triggers until the current one finishes" (e.g., preventing duplicate form submissions).
4. **Treating Observables like Promises** by assuming `.subscribe()` only fires once. Observables can emit multiple times, and forgetting this can lead to logic that only handles the first emission correctly.
5. **Not handling errors**, causing the entire Observable stream to terminate silently on the first error and never emit again. **Fix:** always add `catchError` where failures are possible, especially for HTTP calls.
6. **Overusing manual subscriptions in components** when the `async` pipe would be simpler and safer. Manual subscriptions should be reserved for cases where you need side effects or non-template access to the value.

## Best Practices

- **Prefer the `async` pipe** in templates whenever possible — it handles subscription and unsubscription automatically and works well with Angular's change detection.
- **Use `takeUntilDestroyed()`** (from `@angular/core/rxjs-interop`) for manual subscriptions that must live inside component/service logic rather than a template.
- **Choose the right flattening operator deliberately**: `switchMap` for cancel-and-replace, `concatMap` for strict ordering, `mergeMap` for concurrent independent work, `exhaustMap` for ignoring new triggers while busy.
- **Always handle errors** with `catchError` on streams that can fail (especially HTTP), so one failure doesn't silently break the whole stream.
- **Keep Observable chains pure and declarative** — build your logic with operators inside `.pipe()` rather than mutating external state inside `subscribe()` whenever possible.
- **Name Observable properties with a `$` suffix** (e.g., `products$`) as a widely-adopted convention for readability.
- **Avoid nested subscriptions.** If you find yourself calling `.subscribe()` inside another `.subscribe()`, refactor using a mapping operator instead.
- **Consider Angular Signals** for simple synchronous state that doesn't need operators like `debounceTime` or `switchMap` — Signals and Observables can be converted between each other using `toSignal()` and `toObservable()` from `@angular/core/rxjs-interop`, so you can use whichever model fits a given piece of state.

## Summary

- An **Observable** is a lazy, cancellable stream that can emit zero, one, or many values over time.
- Observables differ from Promises in that they are lazy, can emit multiple values, and support cancellation via `unsubscribe()`.
- Angular's `HttpClient`, `Router`, and Reactive Forms all expose data as Observables.
- **Operators** like `map`, `filter`, `debounceTime`, and `switchMap` let you transform and compose streams declaratively inside `.pipe()`.
- The **`async` pipe** is the safest and most idiomatic way to consume Observables in templates, since it auto-subscribes and auto-unsubscribes.
- For manual subscriptions, use **`takeUntilDestroyed()`** to avoid memory leaks without writing boilerplate `ngOnDestroy` logic.
- Choose flattening operators carefully: `switchMap` (cancel), `concatMap` (order), `mergeMap` (concurrency), `exhaustMap` (ignore while busy).
- Always add `catchError` to streams that can fail, particularly HTTP requests.
- Avoid nested `.subscribe()` calls — use operators to flatten and compose streams instead.

## Flash Cards

**Q: What is the key difference between a Promise and an Observable?**
A: A Promise resolves eagerly with exactly one value and cannot be cancelled. An Observable is lazy (only runs when subscribed), can emit multiple values over time, and can be cancelled via `unsubscribe()`.

**Q: What does the `async` pipe do in an Angular template?**
A: It automatically subscribes to an Observable (or Promise), displays its latest emitted value, and automatically unsubscribes when the component is destroyed.

**Q: Which operator should you use to cancel a previous in-flight HTTP request when a new search term is typed?**
A: `switchMap` — it cancels the previous inner Observable and switches to the newest one.

**Q: What is a `Subject` in RxJS?**
A: A special type of Observable that is also an Observer — you can manually push values into it with `.next()`, making it useful for multicasting events to multiple subscribers.

**Q: How can you unsubscribe from a manually created subscription in a modern Angular component without writing `ngOnDestroy()` boilerplate?**
A: Use the `takeUntilDestroyed()` operator from `@angular/core/rxjs-interop` inside the `.pipe()` chain.

## Exercises

### Easy
Create a standalone Angular component that uses `interval(1000)` and the `take` operator to display a countdown from 10 to 0 in the template. Use the `async` pipe to render the value — do not manually call `.subscribe()`.

### Medium
Build a standalone component with a text input bound to a `FormControl`. Using `valueChanges`, `debounceTime`, `distinctUntilChanged`, and `map`, display the number of characters currently typed, but only update the displayed count 400ms after the user stops typing.

### Challenging
Build a "save button" component that calls a mock save function returning `Observable<{ success: boolean }>` (simulate with `of({ success: true }).pipe(delay(1000))`). Use `exhaustMap` so that repeated clicks on the save button while a save is already in progress are ignored, preventing duplicate submissions. Show a loading indicator while the save is in progress, and handle potential errors with `catchError` so the button becomes clickable again after a failure.

## Further Reading

- [Angular Official Docs — Observables Overview](https://angular.dev/guide/observables)
- [Angular Official Docs — HttpClient](https://angular.dev/guide/http)
- [Angular Official Docs — RxJS Interop (`takeUntilDestroyed`, `toSignal`, `toObservable`)](https://angular.dev/ecosystem/rxjs-interop)
- [RxJS Official Documentation](https://rxjs.dev/guide/overview)
- [RxJS Operator Decision Tree](https://rxjs.dev/operator-decision-tree)
- [Angular Official Docs — Async Pipe API Reference](https://angular.dev/api/common/AsyncPipe)
