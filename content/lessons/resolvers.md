---
slug: resolvers
title: "Resolvers: data before the page"
topic: routing
kind: api
summary: "Load the data a page needs before it renders, and deliver it straight into an input."
tags: [routing, resolvers, data-loading, inputs]
related: [navigation-lifecycle, component-input-binding, pitfall-resolver-errors, activated-route]
---
> **In one line:** A resolver fetches data during navigation. The new page only appears once the data is ready, so it never shows a half-empty state.

## The idea

Without a resolver a page renders first and then loads: the user sees a skeleton or spinner, and the component needs loading and error branches in its template. For some pages that is the right experience. For others, such as a detail page that is meaningless without its record, it is more honest to **not show the page until the data exists**.

A resolver is a function (`ResolveFn<T>`) attached to a route under a key. The router runs it after the guards, waits for its result, then activates the component and hands over the value.

With `withComponentInputBinding()` the value arrives as an input named after the key, so the component stays trivial and has no loading logic at all.

## See it

```typescript
export const productResolver: ResolveFn<Product> = (route) => {
  const products = inject(ProductService);
  return products.getById(route.paramMap.get('id')!);
};

export const routes: Routes = [
  {
    path: 'products/:id',
    component: ProductDetail,
    resolve: { product: productResolver },
  },
];
```

```typescript
@Component({
  selector: 'app-product-detail',
  template: `<h1>{{ product().name }}</h1>`,
})
export class ProductDetail {
  // Filled from the resolver key "product"; always defined by the time we render
  readonly product = input.required<Product>();
}
```

## Go deeper

The trade-off is perceived speed. While a resolver runs, the user is still looking at the *previous* page and nothing seems to happen. A slow API makes the whole app feel frozen, so show a global progress indicator driven by the router's `NavigationStart` and `NavigationEnd` events.

Rule of thumb: resolve data that is **required** and **fast**. For optional or slow data, render the page immediately and load inside it, with a loading state. Many apps use resolvers for the main record and in-page loading for everything secondary.

| Data | Where to load it |
|---|---|
| The record the page is *about* (a product, an order) | resolver |
| Related or secondary data (reviews, recommendations) | inside the page, with a loading state |
| Slow or optional data | inside the page, never in a resolver |

A resolver runs again when its inputs change, by default only when path or matrix parameters change. If it depends on query parameters, set `runGuardsAndResolvers: 'paramsOrQueryParamsChange'` on the route.

## Watch out

- Resolving slow or optional data, which makes navigation feel stuck.
- Ignoring failures. A failing resolver cancels navigation; see the next pitfall.
- Forgetting `runGuardsAndResolvers` when the data depends on query parameters, so it never refreshes.

## Remember

- A resolver loads data before the page activates.
- With input binding the result arrives as an input named after the key.
- Resolve what is required and fast; load the rest inside the page.
