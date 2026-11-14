---
slug: combination-operators
title: "combineLatest, forkJoin, zip, withLatestFrom"
topic: rxjs
kind: concept
summary: "Four ways to merge independent streams, distinguished by when they emit and what they pair."
tags: [rxjs, combinelatest, forkjoin, zip, withlatestfrom]
related: [flattening-operators, share-replay, switchmap-typeahead, pipe-and-operators]
---
> **In one line:** Pick by *when* you want output: on every change (`combineLatest`), once at the end (`forkJoin`), by position (`zip`), or only when the main stream fires (`withLatestFrom`).

## The idea

A page often depends on two sources: the route's category and a sort order, or three API calls that must all finish. Each combination operator gives a different timing.

| Operator | Emits | Typical use |
|---|---|---|
| `combineLatest([a$, b$])` | whenever **any** source emits, with the latest of each | a list that depends on route plus filter |
| `forkJoin({ a: a$, b: b$ })` | **once**, after all complete, with the last value of each | run N requests in parallel, then continue |
| `zip(a$, b$)` | pairs values by **index**: 1st with 1st | data pipelines; rare in UI |
| `a$.pipe(withLatestFrom(b$))` | only when `a$` emits, with the latest `b$` | a click that needs the current form value |

`combineLatest` waits until **every** source has emitted at least once, which is why a form control often needs `startWith`.

## See it

```typescript
private category$ = this.route.paramMap.pipe(map((p) => p.get('category') ?? 'all'));
private sort$ = this.sortControl.valueChanges.pipe(startWith(this.sortControl.value));

// Re-fetch when EITHER the category OR the sort changes
products$ = combineLatest([this.category$, this.sort$]).pipe(
  switchMap(([category, sort]) =>
    this.http.get<Product[]>('/api/products', { params: { category, sort } }),
  ),
);
```

```typescript
// Three independent calls; continue only when all have finished
forkJoin({
  user: this.api.user(id),
  orders: this.api.orders(id),
  prefs: this.api.preferences(id),
}).subscribe(({ user, orders, prefs }) => this.show(user, orders, prefs));
```

## Go deeper

`forkJoin` emits only on completion, so it suits HTTP calls, which complete after one response. Used with a stream that never completes, it never emits. It also fails fast: if any source errors, the whole `forkJoin` errors and the other results are lost, so add `catchError` per source if partial results are acceptable.

`withLatestFrom` is the answer to "I need the current value of something *when* a click happens". A `combineLatest` here would fire again every time the form changes, which is almost never intended.

The `startWith` in the example emits the initial control value. `valueChanges` does not emit on subscription, so without it `combineLatest` would produce nothing until the user touched the control.

Layer `switchMap` on top of `combineLatest`, as above, so a quick second change cancels the request still in flight.

## Watch out

- Using `combineLatest` with a control that has not emitted, with no `startWith`.
- Using `forkJoin` with a stream that never completes.
- Using `combineLatest` where `withLatestFrom` was meant.

## Remember

- `combineLatest`: every change. `forkJoin`: once at the end.
- `zip` pairs by position; `withLatestFrom` samples on the main stream.
- Add `startWith` for controls, and `switchMap` for the request.
