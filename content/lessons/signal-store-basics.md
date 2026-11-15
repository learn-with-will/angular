---
slug: signal-store-basics
title: "SignalStore: state, computed, methods"
topic: state
kind: api
summary: "A signal-native store built from small features, with no actions or reducers."
tags: [state, signalstore, ngrx-signals, patchstate]
related: [rx-method, store-scope, choosing-state-tool, why-state-management]
---
> **In one line:** `signalStore()` composes state, computed values and methods. Components read signals and call methods, and only methods change state, via `patchState`.

## The idea

Not every piece of state deserves the full action and reducer ceremony. A search box's term, a page number, an "is open" flag are local, but they still benefit from the same discipline: one owner, immutable updates, no stray writes.

`@ngrx/signals` is a separate, light library. You build a store from features, each one a function you add to the call:

| Feature | Adds | Reads or writes as |
|---|---|---|
| `withState(initial)` | each property becomes a read-only signal | `store.term()` |
| `withComputed(...)` | derived signals | `store.hasTerm()` |
| `withMethods(...)` | the operations components call | `store.setTerm('shoes')` |
| `rxMethod(...)` | a method that uses RxJS operators | see the next lesson |

State is **read-only from outside**. Components cannot assign to it, and only the store's own methods call `patchState`.

## See it

```typescript
export const FilterStore = signalStore(
  withState({ term: '', page: 1 }),
  withComputed(({ term }) => ({
    hasTerm: computed(() => term().length > 0),
  })),
  withMethods((store) => ({
    setTerm(term: string): void {
      patchState(store, { term, page: 1 });
    },
    nextPage(): void {
      patchState(store, (state) => ({ page: state.page + 1 }));
    },
  })),
);

// In a component:
//   providers: [FilterStore],
//   protected readonly store = inject(FilterStore);
// Read: store.term(), store.hasTerm()   Change: store.setTerm('shoes')
```

## Go deeper

`patchState` merges the properties you pass into the state, and it accepts an updater function when the new value depends on the old one, as in `nextPage`. It never lets you change a property by assignment, which is what keeps changes traceable to the methods.

Because `withState` exposes signals, templates read `store.term()` directly, with no `toSignal` bridging, and `OnPush` views update exactly when the signals they read change.

Features are composable and typed in order: `withComputed` and `withMethods` receive the state signals and methods defined *before* them. That ordering is what lets a computed value use state, and a method use both.

For nested objects, `patchState` replaces the property, so spread to keep siblings: `patchState(store, (s) => ({ filter: { ...s.filter, term } }))`.

## Watch out

- Mutating state objects instead of calling `patchState`.
- Forgetting that nested objects are replaced, not merged.
- Reading a computed before the state it depends on is declared above it.

## Remember

- State, computed, methods: three small features.
- Only methods write, through `patchState`.
- Templates read signals directly.
