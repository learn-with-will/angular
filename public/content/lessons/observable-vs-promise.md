---
slug: observable-vs-promise
title: "Observable or Promise?"
topic: rxjs
kind: concept
summary: "Both represent async results, but they differ in how many values, when they run and whether they can be cancelled."
tags: [rxjs, promise, observable, async]
related: [what-is-observable, creation-functions, flattening-operators, http-cold-requests]
---
> **In one line:** A Promise is one eager value you cannot cancel. An Observable is zero or more lazy values you can cancel and transform.

## The idea

Both describe "something that finishes later", so people treat them as interchangeable. They are not, and the differences decide which one fits.

| Feature | Promise | Observable |
|---|---|---|
| Values | exactly one | zero, one or many, over time |
| Execution | **eager**: runs as soon as it is created | **lazy**: runs only when subscribed |
| Cancellation | no | yes, with `unsubscribe()` |
| Operators | `then` and little else | a large library: `map`, `filter`, `switchMap`... |
| Many consumers | share one resolved value | each subscription may run again, unless shared |

A Promise is right for "fetch this once and I am done". An Observable is right when a source can produce several values, when a consumer may need to **cancel**, or when you want to compose and time several sources.

## See it

```typescript
// Eager: the work has already started, even though nobody asked for the result yet
const promise = fetch('/api/data');

// Lazy: nothing happens here
const data$ = this.http.get('/api/data');

// ...until something subscribes
const sub = data$.subscribe((data) => console.log(data));

// Cancel it: the browser aborts the request
sub.unsubscribe();
```

A promise cannot be aborted from the outside. The Observable can, and Angular uses that: `switchMap` cancels a stale request, and the router and `async` pipe unsubscribe when a view goes away.

## Go deeper

You can convert between them. `from(promise)` wraps a Promise as an Observable that emits once and completes, and `firstValueFrom(obs$)` or `lastValueFrom(obs$)` gives a Promise for the first or last value. Reach for `firstValueFrom` in `async` code that needs one result, such as a startup initialiser, and prefer staying in Observables everywhere else.

Beware `toPromise()` in older code. It is deprecated and slated for removal, because it silently resolved `undefined` for an empty stream. The two replacements make the intent explicit.

The *laziness* has a cost people notice later: an Observable subscribed to twice runs twice, so two `async` pipes on one HTTP call mean two requests. A Promise would have shared one result, which is a point in its favour for one-shot reads.

In Angular specifically, most APIs already chose for you. `HttpClient`, the router and forms expose Observables, so you stay in that world and convert only at the edges. A one-shot startup task, such as loading configuration in an app initialiser, is a good place for a Promise-returning function built with `firstValueFrom`, because the framework awaits it.

The reverse is rare but real: `async` and `await` read well for sequential one-shot steps. Using `firstValueFrom` inside an `async` function is fine, as long as you accept that it cannot be cancelled.

## Watch out

- Assuming an Observable runs when created.
- Using a Promise where users must be able to cancel, such as a typeahead search.
- Still using `toPromise()`.

## Remember

- Promise: one, eager, not cancellable. Observable: many, lazy, cancellable.
- Convert with `from()` and `firstValueFrom()`.
- Two subscriptions mean two executions unless you share.
