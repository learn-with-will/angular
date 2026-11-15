---
slug: pitfall-rxjs-misuse
title: "Pitfall: the common RxJS mistakes"
topic: rxjs
kind: pitfall
summary: "Nested subscribes, the wrong flattening operator, missing cleanup and plain-field state: how each one fails."
tags: [rxjs, bugs, subscribe, cleanup]
related: [flattening-operators, unsubscribe-cleanup, catch-error-placement, switchmap-typeahead]
---
> **In one line:** Most RxJS bugs are one of five mistakes. Each has a recognisable symptom, so you can name the cause quickly.

## The idea

| Mistake | Symptom | Fix |
|---|---|---|
| Subscribing inside a subscription | no cancellation, hard-to-follow code, leaks | a flattening operator |
| `mergeMap` for search | old results overwrite new ones | `switchMap` |
| `switchMap` for saves | the first save silently cancelled | `exhaustMap` or `concatMap` |
| No cleanup on an infinite stream | callbacks keep running after the component is gone | `takeUntilDestroyed()`, `async` pipe, `toSignal` |
| Plain field set in a subscription | view does not update in a zoneless app | write a signal |

A sixth, `catchError` on the outer stream, has its own lesson because it ends the stream forever.

## See it

```typescript
// Before: nested subscribe; the inner request is never cancelled
this.route.paramMap.subscribe((params) => {
  this.http.get<User>(`/api/users/${params.get('id')}`).subscribe((user) => {
    this.user = user;                  // plain field: stale in a zoneless app
  });
});

// After: flatten, cancel stale requests, hold state in a signal
readonly user = toSignal(
  this.route.paramMap.pipe(
    switchMap((params) => this.http.get<User>(`/api/users/${params.get('id')}`)),
  ),
);
```

## Go deeper

The nested subscribe looks harmless, and it fails in three ways at once. Quick navigation from user 1 to 2 to 3 lets an old response arrive last and show the wrong user. Neither subscription is ever cleaned up. And an error in the inner request cannot be handled by one `catchError` that covers the chain.

A good review habit: any `.subscribe(` inside another `.subscribe(` or inside a `subscribe` callback that calls a service is a prompt to ask "which flattening operator is this?".

Also treat `subscribe` itself with suspicion in components. If its only job is `this.x = value`, it should be `toSignal`. If its only job is feeding the template, it should be the `async` pipe. A legitimate `subscribe` is a side effect: logging, navigation, storage, analytics.

Finally, remember an Observable can emit many times. Code that assumes a single `next`, because "it is just a request", breaks the day the source becomes a stream.

It helps to keep a short review checklist beside the code. Ask in order: is anything subscribed inside a subscribe? Is the flattening operator the one the requirement needs? Does an infinite stream have a cleanup? Is the result held in a signal or shown with the `async` pipe? Does the fallback hide a real failure?

Five yes-or-no questions catch most RxJS problems before they reach a user, and they work the same for new code and for a pull request review.

## Watch out

- Nesting `subscribe` calls.
- Choosing the flattening operator by habit.
- Using `subscribe` only to copy a value into a field.

## Remember

- Flatten instead of nesting.
- Match the operator to the concurrency you need.
- Prefer `toSignal` or the `async` pipe to a manual `subscribe`.
