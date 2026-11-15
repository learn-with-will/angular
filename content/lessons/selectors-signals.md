---
slug: selectors-signals
title: "Selectors and reading as signals"
topic: state
kind: technique
summary: "Read the Store through named, memoized selectors, and turn the result into a signal for the template."
tags: [state, ngrx, selectors, signals]
related: [reducer-feature, store-redux-flow, rxjs-signal-interop, pitfall-state-mistakes]
---
> **In one line:** Export named selectors, never reach into raw state, and read them as signals with `selectSignal`.

## The idea

A selector is a function that reads or derives data from the state tree. Selectors are **memoized**: while the inputs have not changed they return the same result, so downstream components do not re-render for nothing.

There are three ways to read, and one of them is a trap:

| Read | Verdict |
|---|---|
| `store.selectSignal(selectProducts)` | preferred: a signal, no subscription |
| `toSignal(store.select(selectProducts), { initialValue: [] })` | fine; useful when you need an Observable too |
| `store.select((s) => s.products.state.items)` inline | avoid: skips memoization and hard-codes the state shape into every consumer |

A named selector is a contract. If the state shape changes, you fix the selector once, and every consumer keeps working.

## See it

```typescript
// state/products.selectors.ts: compose, derive, memoize
export const selectCheapProducts = createSelector(
  selectProducts,
  (products) => products.filter((p) => p.price < 20),
);

export const selectProductCount = createSelector(selectProducts, (p) => p.length);
```

```typescript
@Component({
  selector: 'app-products',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (product of products(); track product.id) {
      <li>{{ product.name }}: {{ product.price | currency }}</li>
    }
    <p>{{ count() }} products</p>
  `,
})
export class ProductsComponent {
  private readonly store = inject(Store);
  protected readonly products = this.store.selectSignal(selectCheapProducts);
  protected readonly count = this.store.selectSignal(selectProductCount);
}
```

## Go deeper

Memoization has a catch: it compares inputs by reference. A selector that returns `products.filter(...)` creates a new array each time its *inputs* change, but returns the cached array while they do not, which is the point. A selector that builds a new array on every call regardless, such as one with no `createSelector`, defeats the optimisation and causes needless re-renders.

Use `createSelector` for derivations (filter, sort, join two slices) and the generated feature selectors for plain reads. Do the heavy work in the selector, not in the template or a `computed()` re-run for every component.

Selectors compose: a selector can take other selectors as inputs, so a page-level view model is assembled from small reusable pieces and tested in isolation with a plain state object.

Reading with `selectSignal` also removes the need for the `async` pipe or manual cleanup, which is why it is the default for new code.

## Watch out

- Reading raw state inline in components.
- Building new arrays in a selector that is not memoized.
- Subscribing manually just to copy a value into a field.

## Remember

- Name and export selectors; compose them with `createSelector`.
- Prefer `selectSignal` to a manual subscription.
- Memoization works by input reference.
