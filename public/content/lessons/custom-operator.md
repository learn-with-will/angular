---
slug: custom-operator
title: "Writing your own operator"
topic: rxjs
kind: technique
summary: "An operator is just a function from Observable to Observable, so name any chain you reuse."
tags: [rxjs, operators, reuse, typescript]
related: [pipe-and-operators, timing-operators, switchmap-typeahead, custom-validator]
---
> **In one line:** A custom operator is a function that takes an Observable and returns one. Wrap a repeated chain in it and give it a name.

## The idea

When the same three operators appear in every typeahead in the app, you have duplicated a decision. A custom operator gives that chain a single name and one place to change.

There are two common shapes, and both are plain functions:

| Shape | Looks like | Use it for |
|---|---|---|
| a function that **is** an operator | `(source) => source.pipe(...)` | a fixed chain |
| a **factory** that returns one | `searchTerm(ms)` returns `(source) => ...` | a configurable chain |

Because they are built from existing operators, they keep everything you rely on: laziness, cancellation and error propagation.

## See it

```typescript
/** Drops null and undefined, and narrows the type accordingly. */
export function filterNil<T>() {
  return (source: Observable<T>) =>
    source.pipe(filter((value): value is NonNullable<T> => value != null));
}

/** The "clean up a search term" steps shared by every typeahead. */
export function searchTerm(ms = 300): MonoTypeOperatorFunction<string> {
  return (source) =>
    source.pipe(
      map((term) => term.trim()),
      debounceTime(ms),
      distinctUntilChanged(),
    );
}

// Usage
this.searchControl.valueChanges.pipe(searchTerm(), switchMap((t) => this.api.search(t)));
```

## Go deeper

The type guard in `filterNil` is the valuable part. Plain `filter(Boolean)` leaves the type as `T | null`, while the guard narrows it to `T`, so downstream operators and templates get a clean type with no `!` assertions.

Keep custom operators **pure** and free of hidden state. State shared in a closure outside the returned function is shared by every use, so two typeaheads would interfere. Anything stateful belongs inside the function that receives `source`, created per subscription.

Test them in isolation. An operator is only a function, so a spec can feed it `of(...)` or a test scheduler and assert the output, with no component and no `TestBed`.

Do not over-abstract. Wrap a chain when it is genuinely repeated and has a meaningful name. A one-line `map` hidden behind a clever name makes code harder to read than the operator itself.

## Watch out

- Sharing mutable state in a closure outside the operator.
- Using `filter(Boolean)` and losing the narrowed type.
- Abstracting a chain used only once.

## Remember

- An operator is `(source) => source.pipe(...)`.
- A factory makes it configurable, as `searchTerm(ms)`.
- Keep it pure, typed and testable in isolation.
