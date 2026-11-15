---
slug: reducer-feature
title: "Reducers and createFeature"
topic: state
kind: api
summary: "Pure state transitions, with selectors generated from the state shape."
tags: [state, ngrx, reducer, createfeature]
related: [store-redux-flow, action-groups, selectors-signals, pitfall-state-mistakes]
---
> **In one line:** A reducer maps `(state, action)` to a new state without mutating anything. `createFeature` bundles it with generated selectors.

## The idea

A reducer is a pure function. Given the same state and action it always returns the same result, and it **never changes the old state**: it returns a new object. That immutability is what makes change detection cheap and time-travel debugging possible.

`createFeature` wraps a name and a reducer, then generates one selector for each state property, so simple reads need no hand-written `createSelector`.

| You write | You get |
|---|---|
| `name: 'products'` | the slice key, `productsFeature.name` |
| state with `products`, `loading`, `error` | `selectProducts`, `selectLoading`, `selectError` |
| the feature itself | `selectProductsState`, the whole slice |

Selector names derive from the property names: a property `isLoading` generates `selectIsLoading`, not `selectLoading`.

## See it

```typescript
export interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = { products: [], loading: false, error: null };

export const productsFeature = createFeature({
  name: 'products',
  reducer: createReducer(
    initialState,
    on(ProductsPageActions.loadProducts, (state) => ({ ...state, loading: true, error: null })),
    on(ProductsApiActions.loadSuccess, (state, { products }) => ({ ...state, products, loading: false })),
    on(ProductsApiActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  ),
});

export const { selectProducts, selectLoading, selectError } = productsFeature;
```

## Go deeper

Every `on(...)` returns a **new** object with the spread operator, copying what did not change. `state.loading = true` would mutate the previous state: the store could not tell anything changed, the DevTools history would be wrong, and `OnPush` views would not update.

Model "loading, error, data" as separate fields, as above, or as one discriminated union (`{ status: 'loading' } | { status: 'ok', products } | { status: 'error', error }`). The union makes impossible combinations, such as loading *and* an error, unrepresentable, at the cost of slightly more code.

Keep derived data out of the state. A `total` that can be computed from `products` should be a selector, not a stored field, otherwise two fields can disagree.

Reducers must stay free of side effects: no HTTP, no `Date.now()`, no random ids. Generate those in the effect or the component and pass them in the action.

## Watch out

- Mutating state inside `on(...)`.
- Storing derived values that a selector could compute.
- Expecting `selectLoading` when the property is `isLoading`.

## Remember

- Reducers are pure and return new state.
- `createFeature` generates a selector per property.
- Derive in selectors; keep reducers free of side effects.
