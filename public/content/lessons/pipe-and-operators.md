---
slug: pipe-and-operators
title: "pipe() and operators"
topic: rxjs
kind: concept
summary: "Operators are pure functions from one Observable to another, chained inside pipe()."
tags: [rxjs, operators, pipe, map]
related: [what-is-observable, creation-functions, flattening-operators, timing-operators]
---
> **In one line:** An operator takes an Observable and returns a *new* one. Chain them inside `.pipe()`, and the source is never changed.

## The idea

Operators are how you transform, filter and combine streams without writing loops or flags. Each one is a pure function, so a pipeline reads top to bottom like a recipe:

```flow
src: Source | `valueChanges` @primary
a: `filter` | keep even numbers @blue
b: `map` | multiply by ten @blue
out: `subscribe` | receives the result @green
src -> a: values
a -> b: kept values
b -> out: transformed
```

Operators fall into a few families, and knowing the family helps you pick one faster than memorising names:

| Family | Examples | Job |
|---|---|---|
| transform | `map`, `scan` | change each value |
| filter | `filter`, `take`, `distinctUntilChanged` | let only some values through |
| timing | `debounceTime`, `throttleTime` | control *when* values pass |
| flatten | `switchMap`, `concatMap`, `exhaustMap` | start async work per value |
| combine | `combineLatest`, `forkJoin` | merge several streams |
| errors | `catchError`, `retry` | recover from failure |

## See it

```typescript
import { filter, map } from 'rxjs';

numbers$
  .pipe(
    filter((n) => n % 2 === 0),   // 2, 4, 6...
    map((n) => n * 10),           // 20, 40, 60...
  )
  .subscribe((result) => console.log(result));
```

`tap` is the one operator for side effects such as logging while debugging, and it leaves values untouched.

## Go deeper

**Order matters.** `pipe(debounceTime(300), distinctUntilChanged())` first waits for a pause, then removes duplicates *of the debounced values*. Reverse them and you de-duplicate every keystroke, then debounce, which behaves differently.

Because operators never mutate the source, one Observable can feed several pipelines safely. They are also lazy: building a pipeline runs nothing, and only a subscription starts the chain.

Keep side effects out of `map`. A `map` that mutates outside state is hard to reason about, and breaks if two subscribers run it twice. Put the effect in `tap`, or better, in the `subscribe` callback, and keep the pipeline a description of *what the data becomes*.

When a chain of three or four operators repeats in several places, give it a name and reuse it, which the custom operator lesson covers.

A practical way to debug a pipeline is to put `tap` between operators and watch what flows. A short-lived `tap((v) => console.log('after debounce', v))` shows exactly which stage drops or reorders values. Remove them afterwards, since logging in a shipped pipeline is noise.

Marble diagrams are the standard notation when reasoning about timing, and the test scheduler can assert them. You do not need them daily, but when an operator's behaviour is unclear, drawing the values on a timeline settles it faster than guessing.

## Watch out

- Doing the work in `subscribe` that an operator could express.
- Mutating external state inside `map`.
- Getting the order of operators subtly wrong.

## Remember

- Operators return new Observables; the source is untouched.
- Chain them in `pipe()`; order changes behaviour.
- Pick by family: transform, filter, timing, flatten, combine, errors.
