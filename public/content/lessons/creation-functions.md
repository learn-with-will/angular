---
slug: creation-functions
title: "Creating Observables"
topic: rxjs
kind: api
summary: "of, from, fromEvent, interval, timer and EMPTY: the functions you actually use to start a stream."
tags: [rxjs, of, from, fromevent, interval]
related: [what-is-observable, pipe-and-operators, timing-operators, observable-vs-promise]
---
> **In one line:** You rarely write `new Observable(...)`. A handful of creation functions cover almost every source.

## The idea

Each function turns a familiar thing into a stream, and each one has a clear "when does it end" answer, which is the question to ask before using it.

| Function | Emits | Completes? |
|---|---|---|
| `of(1, 2, 3)` | the arguments, synchronously | yes |
| `from([10, 20, 30])` | each array item in turn | yes |
| `from(promise)` | the resolved value | yes |
| `fromEvent(button, 'click')` | every time the DOM event fires | never |
| `interval(1000)` | `0, 1, 2, ...` every second | never |
| `timer(500)` | `0` once, after 500 ms | yes |
| `EMPTY` | nothing | immediately |

The "never completes" rows need cleanup. A subscription to `fromEvent` or `interval` outlives the component unless something ends it, which is the cleanup lesson that follows.

## See it

```typescript
import { EMPTY, from, fromEvent, interval, of, timer } from 'rxjs';
import { map, take } from 'rxjs';

of('a', 'b').subscribe(console.log);                 // a, b, then complete
from([10, 20, 30]).pipe(map((n) => n / 10)).subscribe(console.log);

// Finite: take(5) completes it, so no manual cleanup is required here
interval(1000).pipe(take(5)).subscribe((tick) => console.log(tick));

// Infinite: needs takeUntilDestroyed() in a component
fromEvent(window, 'resize').subscribe(() => this.measure());

timer(0, 1000);   // first value now, then every second
EMPTY.subscribe({ complete: () => console.log('done immediately') });
```

## Go deeper

`EMPTY` is the neutral element for "nothing to do". It is what you return from a `switchMap` branch that should produce no result, such as an empty search term:

```typescript
switchMap((term) => (term ? this.api.search(term) : EMPTY));
```

Prefer `of([])` instead when the consumer needs a value (an empty list) rather than silence. The difference matters: `EMPTY` emits no `next` at all, so an `async` pipe keeps showing its old content.

Angular wraps many of these already. For events in a template use `(click)`, which cleans itself up; reach for `fromEvent` only when you need operators such as debouncing on a DOM event, or an event that is not in the template.

`from(fetch(url))` converts a Promise but loses cancellation, since the underlying `fetch` keeps going. Pass an `AbortSignal` yourself if cancellation matters.

Cold versus hot is worth a sentence here, because it changes how these behave. `of`, `from`, `interval` and `timer` are **cold**: each subscriber gets its own run, so two subscribers to one `interval(1000)` count independently. `fromEvent` is closer to **hot**: it listens to a source that exists regardless of subscribers, so a late subscriber misses earlier clicks.

That distinction is the reason sharing operators exist, and it explains why two `async` pipes on one `interval` show two different numbers.

## Watch out

- Leaving an `interval` or `fromEvent` subscription alive after the component is destroyed.
- Returning `EMPTY` where the template needs an empty list.
- Expecting `from(promise)` to be cancellable.

## Remember

- `of`, `from`, `fromEvent`, `interval`, `timer`, `EMPTY` cover most needs.
- Ask whether the stream ever completes before subscribing.
- Infinite sources need explicit cleanup.
