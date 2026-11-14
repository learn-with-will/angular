---
slug: rxjs-signal-interop
title: "toSignal and toObservable"
topic: rxjs
kind: api
summary: "Bridge signals and Observables, so each handles what it is best at."
tags: [rxjs, signals, tosignal, toobservable]
related: [unsubscribe-cleanup, timing-operators, flattening-operators, switchmap-typeahead]
---
> **In one line:** `toSignal()` turns a stream into state you can read in a template. `toObservable()` turns a signal into a stream so you can use operators on it.

## The idea

Signals are excellent for synchronous state. They have no built-in notion of time, so debouncing or cancelling is awkward. Observables are excellent at time but clumsy to read in a template. `@angular/core/rxjs-interop` lets each do its job:

| Function | Direction | Use it to |
|---|---|---|
| `toSignal(obs$, { initialValue })` | stream to signal | read the latest value in a template or `computed()` |
| `toObservable(sig)` | signal to stream | apply `debounceTime`, `switchMap` and friends |

The common recipe is a sandwich: signal in, operators in the middle, signal out.

```flow
term: Signal `term` | the user's input @primary
obs: `toObservable` | stream of changes @blue
ops: Operators | debounce, then `switchMap` to HTTP @amber
res: `toSignal` | results for the template @green
term -> obs: changes
obs -> ops: values
ops -> res: responses
```

## See it

```typescript
export class ProductSearch {
  private readonly http = inject(HttpClient);
  protected readonly term = signal('');

  protected readonly results = toSignal(
    toObservable(this.term).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => this.http.get<Product[]>('/api/products', { params: { q: term } })),
    ),
    { initialValue: [] },
  );
}
```

## Go deeper

Without `initialValue`, a `toSignal` starts as `undefined` until the stream emits, so the type becomes `T | undefined`. Provide an initial value for a clean type, or use `{ requireSync: true }` when the source emits synchronously on subscription, such as a `BehaviorSubject`.

`toObservable` does not emit synchronously. It runs through an effect, so the first value arrives after change detection settles, and several quick writes can collapse into one emission. That is usually desirable for debouncing, but it surprises people who expect every write to appear.

Errors need care. If the stream behind a `toSignal` errors, reading the signal **throws** that error. Put `catchError` inside the pipeline, as in the typeahead lesson, so one failure does not make the signal unreadable.

For plain HTTP reads, `httpResource()` replaces this whole sandwich, so reach for the interop functions when you need operators that it does not offer.

Choose by where the complexity is. If it is mostly *time* (debounce, cancel, retry, combine), do the work in RxJS and finish with `toSignal`. If it is mostly *state* (derived values, flags, selection), keep it in signals and use `computed()`. A screen usually mixes both, and the interop functions are the narrow seam between them.

Avoid ping-ponging: converting signal to Observable to signal to Observable inside one feature means you have no clear home for the logic. Pick a side per feature, and convert once at its boundary.

## Watch out

- Forgetting `initialValue` and handling `undefined` everywhere.
- Calling `toSignal()` outside an injection context.
- Letting a stream error reach the signal, so reading it throws.

## Remember

- `toSignal` makes state; `toObservable` makes a stream.
- Signal, operators, signal is the standard sandwich.
- Catch errors inside the pipeline.
