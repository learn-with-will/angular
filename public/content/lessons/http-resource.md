---
slug: http-resource
title: "httpResource: reads as signals"
topic: http
kind: api
summary: "Load data from a URL derived from signals, with loading, error and value as signals and automatic re-fetching."
tags: [http, httpresource, signals, loading]
related: [http-cold-requests, data-service, component-input-binding, http-verbs]
---
> **In one line:** `httpResource()` takes a function that returns a URL, makes the request, exposes the result as signals, and re-fetches whenever the signals it reads change.

## The idea

A detail page needs "the product whose id is in the URL". With plain `HttpClient` that means `ActivatedRoute`, `switchMap`, a subscription and manual loading flags. `httpResource()` derives the request from signals instead, so the dependency is explicit and automatic.

| Signal | Holds |
|---|---|
| `value()` | the latest result, or `undefined` |
| `isLoading()` | whether a request is in flight |
| `error()` | the failure, if any |
| `reload()` | a method that runs the same request again |

If the function returns `undefined`, **no request is sent**, which is handy while a required value is not available yet. A newer request replaces an older one that is still in flight, so there is no stale-response race.

It was experimental in Angular 19 and 20 and is stable since Angular 22. Use it for **reads**; keep writes (`post`, `put`, `delete`) as `HttpClient` calls in a service.

## See it

```typescript
@Component({
  selector: 'app-product-page',
  imports: [CurrencyPipe],
  template: `
    @if (product.isLoading()) {
      <p>Loading…</p>
    } @else if (product.error()) {
      <p role="alert">We couldn't load this product.</p>
      <button type="button" (click)="product.reload()">Try again</button>
    } @else if (product.value(); as p) {
      <h1>{{ p.name }}</h1>
      <p>{{ p.price | currency }}</p>
    }
  `,
})
export class ProductPage {
  readonly id = input.required<string>();   // from the route, via input binding
  protected readonly product = httpResource<Product>(() => `/api/products/${this.id()}`);
}
```

## Go deeper

Navigating from `/products/1` to `/products/2` changes `id()`, which changes the URL the function returns, so the resource re-fetches on its own. There is no `ActivatedRoute`, no `switchMap` and no cleanup, and the stale-snapshot pitfall cannot happen.

Pass a request object when you need more than a URL: `httpResource(() => ({ url: '/api/products', params: { q: this.query() } }))`. The same re-fetch rule applies to every signal read inside the function.

Return `undefined` to wait for a value, otherwise you would request `/api/products/undefined`:

```typescript
httpResource(() => (this.id() ? `/api/products/${this.id()}` : undefined));
```

The resource is also readable by the template and `computed()`, so derived values such as a total update with each result.

## Watch out

- Using it for writes. Use `HttpClient` methods for `post`, `put` and `delete`.
- Reading `value()` before the first response and not handling `undefined`.
- Forgetting to return `undefined` while a needed input is missing.

## Remember

- The request is derived from signals and re-runs when they change.
- `value`, `isLoading`, `error` and `reload()` cover the whole load cycle.
- Reads only; keep writes in a service.
