---
slug: store-redux-flow
title: "The NgRx Store flow"
topic: state
kind: concept
summary: "Actions, reducers, selectors and effects: one direction of data, and a place for every kind of work."
tags: [state, ngrx, store, redux]
related: [why-state-management, action-groups, reducer-feature, store-effects]
---
> **In one line:** A component dispatches an action, a pure reducer produces new state, a selector reads it back, and effects handle everything impure.

## The idea

NgRx's `Store` implements the Redux pattern on RxJS. The whole application state is a single immutable tree, and it changes only through a loop that never runs backwards:

```sequence
actor comp: Component
actor red: Reducer
actor sel: Selector
actor eff: Effect
comp -> red: `dispatch(action)`
red -> sel: new state
sel --> comp: slice re-read, view updates
comp -> eff: actions with side effects
eff -> red: result action
```

Each building block has exactly one responsibility:

| Block | Responsibility | Must it be pure? |
|---|---|---|
| **Action** | describes *something that happened*: `[Products Page] Load Products` | it is data only |
| **Reducer** | `(state, action) => newState` | yes: no mutation, no HTTP, no dates |
| **Selector** | reads and derives data, memoized | yes |
| **Effect** | listens for actions, does side effects, dispatches new actions | no, this is where impurity lives |

Keeping all impure work in effects is what keeps reducers predictable.

## See it

The cycle for a counter, with no HTTP involved:

```typescript
// 1. The component states an intent; it never changes count itself
store.dispatch(CounterActions.increment());

// 2. The reducer computes the next state from the previous one
on(CounterActions.increment, (state) => ({ count: state.count + 1 }));

// 3. A selector exposes the result, and the component reads it as a signal
protected readonly count = this.store.selectSignal(selectCount);
```

To understand any state change, you only need to find the action that caused it.

## Go deeper

Actions are named by **source and event**, such as `[Products Page] Load Products` versus `[Products API] Load Success`. The name records who did what, so DevTools shows a readable history, and "which component fired this?" has an answer.

That readable log is what unlocks time-travel debugging: because state is a pure function of the actions so far, DevTools can replay or rewind them. It only works if reducers really are pure, which is why mutation is the cardinal sin.

The cost is ceremony: an action, a reducer case and a selector for every change. That cost is the reason not to put every flag in the store.

A useful habit is to trace one feature end to end on paper before writing code. List the user's event, the action it dispatches, which reducer case changes which field, which selector exposes it, and whether an effect is involved. If you cannot name each step, the design is not ready, and writing it down usually reveals a missing action or an effect doing a reducer's job.

Hot-reloading and testing both benefit from the pattern. Because a reducer is a plain function, a spec just calls it with a state and an action and compares the result, with no TestBed, no component and no mocks.

## Watch out

- Doing HTTP or reading the clock inside a reducer.
- Dispatching actions named after a *command* ("set loading") instead of an *event*.
- Using the global store for state one component owns.

## Remember

- Component, action, reducer, state, selector, component: one direction.
- Reducers are pure; effects are where side effects go.
- Action names record who did what.
