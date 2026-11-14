---
slug: choosing-state-tool
title: "Choosing the right state tool"
topic: state
kind: concept
summary: "Signals, a service, SignalStore or the global Store: a decision by how widely the state is shared and how much history you need."
tags: [state, decision, signals, ngrx]
related: [why-state-management, signal-store-basics, store-redux-flow, store-scope]
---
> **In one line:** Default to component signals, then a service or `signalStore`, and use the global `Store` only when the state is genuinely cross-cutting and event-driven.

## The idea

Every tool solves the shared-state problem. They differ in ceremony and in what they give back, so the choice is a trade-off, not a ranking.

| Situation | Tool | Why |
|---|---|---|
| a flag or value used by one component | component `signal()` | no ceremony at all |
| derived values from that state | `computed()` | automatic and memoized |
| logic and async for one feature or widget | component-provided `signalStore` | structure without actions and reducers |
| state shared between a few features | root service with a private signal, or root `signalStore` | one owner, simple |
| large app, many teams, event history needed, time-travel | NgRx `Store` with effects | traceability, conventions, DevTools |

The cost of the top rung is real: an action, a reducer case, a selector and often an effect for every change. It pays off when a documented history of *why* state changed matters more than writing less code.

## See it

```typescript
// Rung 1: local state, nothing else needed
protected readonly open = signal(false);
protected readonly label = computed(() => (this.open() ? 'Hide' : 'Show'));

// Rung 3: a feature's own store, scoped to the component
@Component({ providers: [ProductFilterStore], /* ... */ })
export class ProductFilterWidget {
  protected readonly store = inject(ProductFilterStore);
}

// Rung 5: cross-cutting, event-driven, global
store.dispatch(CheckoutActions.orderCompleted({ orderId }));
```

## Go deeper

Three questions pick the rung quickly. *Who reads it?* One component means a signal; a subtree means a scoped store; unrelated features mean a root one. *Does it need to explain itself?* If you must answer "what sequence of events led here", actions and DevTools earn their cost. *Does it involve side effects tied to events?* Many reactions to one event, such as a completed checkout triggering analytics, email and navigation, is where effects shine.

You can climb gradually, because the rungs are compatible. A service holding a private signal can later become a `signalStore` with the same public API, and a `signalStore` can feed a global store through an action if one is ever needed. Start small, and move only when a specific pain appears.

Mixing is normal. A real app has global NgRx state for the session and cart, scoped SignalStores for complex screens, and plain signals for the dozens of small flags.

## Watch out

- Putting local flags in the global store.
- Staying with scattered component copies after the data became shared.
- Migrating everything at once instead of when a pain point appears.

## Remember

- Signals first, then service or `signalStore`, then global `Store`.
- Ask who reads it, whether it must explain itself, and what reacts to it.
- Rungs are compatible; climb gradually.
