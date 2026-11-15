---
slug: pitfall-state-mistakes
title: "Pitfall: common state mistakes"
topic: state
kind: pitfall
summary: "Mutating state, a dying effect, raw state reads and accidental singletons: seven mistakes and their symptoms."
tags: [state, ngrx, bugs, immutability]
related: [reducer-feature, store-effects, selectors-signals, store-scope]
---
> **In one line:** Most state bugs are one of seven mistakes. The symptom usually points straight at the cause.

## The idea

| Mistake | Symptom | Fix |
|---|---|---|
| mutating state in a reducer or `patchState` updater | view does not update, DevTools history is wrong | return a new object with spread |
| everything in the global store | actions and reducers for a dropdown flag, tangled features | local signals or a scoped store |
| HTTP calls from components | untraceable side effects | move them to effects |
| `catchError` outside the inner request in an effect | after one failure the effect never fires again | catch inside, return an action, or `tapResponse` |
| raw state read inline in a component | no memoization, shape leaks everywhere | export a named selector |
| local store provided in root by accident | two widgets share one state | provide in the component |
| expecting `selectLoading` for `isLoading` | "selector does not exist" error | selector names derive from the property name |

Each row is a real review comment you will write more than once.

## See it

```typescript
// Before: mutation. Same object reference, so nothing downstream sees a change
on(CounterActions.increment, (state) => {
  state.count++;
  return state;
});

// After: a new object
on(CounterActions.increment, (state) => ({ ...state, count: state.count + 1 }));
```

```typescript
// Before: an error here ends the stream; later loads are silently ignored
switchMap(() => this.api.getAll().pipe(map((p) => loadSuccess({ products: p })))),
catchError((e) => of(loadFailure({ error: e.message }))),

// After: catch inside, so the effect survives
switchMap(() =>
  this.api.getAll().pipe(
    map((p) => loadSuccess({ products: p })),
    catchError((e) => of(loadFailure({ error: e.message }))),
  ),
),
```

## Go deeper

Mutation is the hardest to spot because the code works once. `state.count++` changes the old object in place, so a reference comparison sees "no change", `OnPush` components skip the update, and DevTools replays a history that no longer matches reality. Enabling NgRx's runtime checks in development, `strictStateImmutability`, throws at the exact line, which is worth turning on.

For the dying effect, add a test: make the service throw once, then dispatch the action again and assert the second load works. A single test of the second dispatch catches the whole class of bug.

If you are unsure where state belongs, go back to the ladder: used by one component, keep it a signal. The global store is a commitment, not a default.

## Watch out

- Trusting a reducer that "works" without checking for mutation.
- Writing only the first-failure test for an effect.
- Reaching for the global store by default.

## Remember

- Return new objects; turn on the immutability runtime checks.
- Catch errors inside the inner request.
- Named selectors, scoped local stores, effects for side effects.
