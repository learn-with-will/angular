---
slug: rx-method
title: "rxMethod and tapResponse"
topic: state
kind: api
summary: "Give a SignalStore method the power of RxJS, with cleanup tied to the store and errors that cannot kill it."
tags: [state, signalstore, rxmethod, tapresponse]
related: [signal-store-basics, switchmap-typeahead, catch-error-placement, store-effects]
---
> **In one line:** `rxMethod` lets a store method use operators such as `debounceTime` and `switchMap`. Pair it with `tapResponse` so one failed request does not end the stream.

## The idea

Plain methods are synchronous. A search needs time: wait for a pause, cancel stale requests, then load. `rxMethod` (from `@ngrx/signals/rxjs-interop`) turns an RxJS pipeline into a method you call with a value, a signal or an Observable. Its subscription ends when the store is destroyed, so there is nothing to clean up.

Inside it, you write the same typeahead pipeline you already know, but updating state with `patchState`:

| Step | Operator | Purpose |
|---|---|---|
| record the term | `tap` with `patchState` | the input stays responsive |
| wait for a pause | `debounceTime(300)` | no request per keystroke |
| skip repeats | `distinctUntilChanged()` | no repeated work |
| start loading | `tap` | show the spinner |
| load, cancelling stale | `switchMap` | latest response wins |
| handle result and error | `tapResponse` | the stream survives failures |

## See it

```typescript
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
            error: () => patchState(store, { results: [], loading: false }),
          }),
        ),
      ),
    ),
  ),
})),
```

```typescript
onSearch(event: Event): void {
  this.store.search((event.target as HTMLInputElement).value);
}
```

## Go deeper

`tapResponse` from `@ngrx/operators` handles `next` and `error` in one place and **never errors the outer stream**. A plain `catchError` that re-throws would end the pipeline, and later searches would silently stop working, which is the same inner-catch rule as before in a packaged form.

`inject()` in `withMethods((store, productsService = inject(ProductsService)) => ...)` works because the factory runs in an injection context. Resolve services there, once, instead of inside the operators.

The debounce and distinct logic live *inside* the store, not scattered across components. Several components can then share the behaviour by calling `search`, and it is tested once, with the store alone.

You may pass a signal to an `rxMethod`: `store.search(this.term)` re-runs the pipeline whenever the signal changes, so a component can bind the method to its own state declaratively.

## Watch out

- Using `catchError` that re-throws, which stops later calls.
- Calling `inject()` inside an operator instead of at the top of the factory.
- Putting debounce logic in the component when the store should own it.

## Remember

- `rxMethod` runs an RxJS pipeline as a store method.
- `tapResponse` keeps the stream alive on errors.
- Cleanup follows the store's lifetime.
