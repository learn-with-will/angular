---
slug: switchmap-typeahead
title: "Typeahead search with switchMap"
topic: rxjs
kind: pattern
summary: "Debounce, de-duplicate, cancel stale requests and survive errors: the canonical search-as-you-type pipeline."
tags: [rxjs, search, debounce, switchmap]
related: [flattening-operators, timing-operators, catch-error-placement, rxjs-signal-interop]
---
> **In one line:** `debounceTime`, then `distinctUntilChanged`, then `switchMap` to the request with `catchError` inside it. Each operator earns its place.

## The idea

Every keystroke could fire a request. Done naively, that wastes bandwidth and, worse, lets a slow response to an *earlier* query arrive after a faster later one and overwrite correct results. The pipeline fixes four things in order:

| Operator | Problem it solves |
|---|---|
| `debounceTime(300)` | a request per keystroke |
| `distinctUntilChanged()` | re-searching the same term |
| `switchMap(...)` | stale responses: cancels the old request |
| `catchError` inside `switchMap` | one failure killing the whole stream |

```sequence
actor user: User
actor pipe: Pipeline
actor api: Server
user -> pipe: types "ang"
pipe -> api: GET `q=ang`
user -> pipe: types "angular"
pipe -> api: Cancels the `q=ang` request
pipe -> api: GET `q=angular`
api --> pipe: results for "angular"
```

## See it

```typescript
results$: Observable<Book[]> = this.searchControl.valueChanges.pipe(
  debounceTime(300),           // wait for a pause in typing
  distinctUntilChanged(),      // skip if the term did not change
  switchMap((term) => {
    if (!term.trim()) return of([]);          // empty term: no request
    return this.http
      .get<Book[]>('/api/books', { params: { q: term } })
      .pipe(catchError(() => of([])));        // keep the outer stream alive
  }),
);
```

```html
@for (book of results$ | async; track book.id) {
  <li>{{ book.title }}</li>
}
```

## Go deeper

With `switchMap`, typing "angular" before the "ang" response arrives unsubscribes from the first request, and the browser aborts it. The stale response can never be delivered.

Pass `params` rather than building `?q=${term}` yourself, so spaces and symbols are encoded. The old pattern of interpolating the term into the URL is a classic injection of unexpected characters.

Handle the empty term explicitly. Returning `of([])` clears the list without a request, whereas `EMPTY` would leave the previous results on screen, because nothing is emitted.

If the term lives in a signal, use the interop sandwich: `toSignal(toObservable(term).pipe(...))`, as in the interop lesson, and the template reads a signal with no `async` pipe at all.

A few refinements are common in real search boxes. Require a minimum length (`filter((t) => t.length >= 2)`) to avoid noisy one-letter queries. Show a loading flag with `tap` before the request and `finalize` after it. Keep the previous results visible while the next ones load, so the list does not flicker to empty.

The pipeline stays the same. You are adding operators around the same core, which is why it is worth learning the core in the right order: debounce, distinct, switch, inner catch.

## Watch out

- Using `mergeMap` here, which lets stale results win.
- Putting `catchError` outside `switchMap`, which ends the stream on the first failure.
- Building the query string by hand.

## Remember

- Debounce, distinct, `switchMap`, inner `catchError`.
- `switchMap` cancels the previous request.
- Return `of([])`, not `EMPTY`, for an empty term.
