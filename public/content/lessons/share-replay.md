---
slug: share-replay
title: "Sharing a request with shareReplay"
topic: rxjs
kind: api
summary: "Turn a cold Observable into a shared one, so several subscribers cause one request, and clean it up with refCount."
tags: [rxjs, sharereplay, multicast, cache]
related: [combination-operators, http-cold-requests, unsubscribe-cleanup, rxjs-signal-interop]
---
> **In one line:** `shareReplay({ bufferSize: 1, refCount: true })` makes several subscribers share one execution and replays the last value to late ones.

## The idea

A cold Observable runs again for every subscriber. Two parts of a template that read `products$` through two `async` pipes send **two** HTTP requests. `shareReplay` turns the stream into a shared one: the first subscriber starts it, the rest join, and a new subscriber immediately receives the most recent value.

The configuration object matters more than it looks:

| Form | Source subscription after the last subscriber leaves |
|---|---|
| `shareReplay(1)` (shorthand) | stays open **forever**: a potential leak |
| `shareReplay({ bufferSize: 1, refCount: true })` | is closed, and restarts if someone subscribes again |

`refCount: true` is almost always what you want for component-scoped streams.

## See it

```typescript
products$ = combineLatest([this.category$, this.sort$]).pipe(
  switchMap(([category, sort]) =>
    this.http.get<Product[]>('/api/products', { params: { category, sort } }),
  ),
  shareReplay({ bufferSize: 1, refCount: true }),
);
```

```html
@if (products$ | async; as products) {
  <p>{{ products.length }} results</p>
  <ul>
    @for (p of products; track p.id) { <li>{{ p.name }}</li> }
  </ul>
}
```

Both the count and the list read the same stream, but the request is sent once.

## Go deeper

Often a signal is the simpler way to share. `toSignal(products$)` subscribes **once** and every reader of the signal sees the same value, with no operator to configure. Prefer it when the consumers are in the template or in `computed()` values.

`shareReplay` caches the last value but never *refreshes* it. For a long-lived cache you need an invalidation strategy: add a refresh trigger with `switchMap`, or recreate the Observable when data changes. A forgotten cache that serves stale data for the whole session is a classic bug.

An error is replayed to everyone too, and the next subscriber after an error re-subscribes to the source. If errors should not poison the cache, `catchError` upstream of `shareReplay` or reset on failure.

Use it deliberately. Most Angular code needs it far less than first examples suggest, because signals and `httpResource()` already give a single shared source.

You can see the effect with a throwaway counter. Wrap a source with `defer(() => { runs++; return of(1); })`, subscribe twice, and check `runs`: it is 2 without sharing and 1 with it. Tests like this make the cost of a cold stream concrete, and they protect a request count you rely on, such as "the list loads once".

Remember that sharing hides the lifecycle. With `refCount: true`, the source restarts when all subscribers leave and a new one arrives, which is correct for a component but surprising if you expected a permanent cache.

## Watch out

- `shareReplay(1)` on a component-scoped stream, which leaks.
- Serving a cached value that never refreshes.
- Reaching for it when `toSignal` would share just as well.

## Remember

- `shareReplay` shares one execution and replays the last value.
- Use `{ bufferSize: 1, refCount: true }`.
- Consider `toSignal` first, and plan cache invalidation.
