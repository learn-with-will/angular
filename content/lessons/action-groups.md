---
slug: action-groups
title: "Actions with createActionGroup"
topic: state
kind: api
summary: "Define typed actions grouped by source, and name them after events rather than commands."
tags: [state, ngrx, actions, naming]
related: [store-redux-flow, reducer-feature, store-effects, pitfall-state-mistakes]
---
> **In one line:** `createActionGroup` produces strongly typed action creators under one `source`, with far less boilerplate than one `createAction` each.

## The idea

An action is a plain, typed object that says *something happened*. It carries no logic. Writing each one by hand is repetitive, so `createActionGroup` builds a whole set from a `source` and an `events` map. The event names are written as readable text and become camel-case creators.

Name by **who did what**, and split by source. The page that triggers an action and the API that answers are different sources:

| Source group | Events | Meaning |
|---|---|---|
| `Products Page` | `Load Products` | the user opened the page |
| `Products API` | `Load Success`, `Load Failure` | the server answered |

A good action is an **event** ("Load Success"), not a command ("Set Products"). Events let several reducers and effects react independently, and DevTools reads like a story.

## See it

```typescript
export const ProductsPageActions = createActionGroup({
  source: 'Products Page',
  events: {
    'Load Products': emptyProps(),
  },
});

export const ProductsApiActions = createActionGroup({
  source: 'Products API',
  events: {
    'Load Success': props<{ products: Product[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});

// Usage: type-checked creators
store.dispatch(ProductsPageActions.loadProducts());
store.dispatch(ProductsApiActions.loadSuccess({ products }));
```

## Go deeper

The creator names come from the event text: `'Load Success'` becomes `loadSuccess`, and the action `type` is `'[Products API] Load Success'`. Because the type string is generated, you never mistype it, and a rename is a single edit.

Prefer **few actions with clear meaning** to many tiny ones. If the reducer needs three actions to express one thing that happened, one event carrying all the data is clearer, such as `Checkout Completed` rather than `Clear Cart` plus `Set Order` plus `Hide Dialog`.

Keep payloads small and serialisable: ids and plain data, not class instances, functions or Observables. NgRx can warn about non-serialisable state and actions in development, and DevTools replay depends on them being plain.

Avoid dispatching one action from a reducer's effect for every field. Capture the user's intent once, and let each reducer pick what it needs.

## Watch out

- Naming actions after commands such as `Set Loading`.
- Putting functions or class instances in payloads.
- Mixing page-triggered and API-triggered events in one group.

## Remember

- `createActionGroup` gives typed creators from a source and events.
- Name events by who did what.
- Keep payloads plain and serialisable.
